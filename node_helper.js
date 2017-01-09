var NodeHelper = require("node_helper");

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

module.exports = NodeHelper.create({

	config: {},
    auth: new googleAuth(),
    oauth2Client: undefined,

    tokenFile: '',
    secretFile: '',
    googlePhotosId: '',
    cacheFolder: '',
    lastPhotoId: '',
    lastPhotoName: '',

	updateTimer: null,

    SCOPES: [ 'https://www.googleapis.com/auth/drive.metadata.readonly',
              'https://www.googleapis.com/auth/drive.readonly'
            ],

	start: function () {
        console.log("GP node_helper started");
	},

	socketNotificationReceived: function (notification, payload) {
        var self = this;

        console.log("GP node_helper notification: " + notification);
        if (notification === "PARAMS") {
            this.tokenFile = payload.tokenFile;
            this.secretFile = payload.secretFile;
            this.cacheFolder = payload.cacheFolder;
        } else if (notification === "CONFIG") {
            this.config = payload;
        } else if (notification === "FETCH") {
            //this.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });
			this.startFetch();
		} else {
            console.log("Unrecognised notification: " + notification);
        }
	},

	startFetch() {
		var self = this;
        if (!self.oauth2Client || self.oauth2Client === undefined) {
            console.log("GooglePhotos - loading authentication");
            // Authorize a client with the loaded credentials, then store it
            self.glibAuthorize();
        } else {
            self.getPhotoFolder(); //self.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });    
        }

		// this.scheduleNextFetch(this.config.updateInterval);
	},

    getPhotoFolder: function() {
        var self = this;

        // Check if we have photos
        if (self.googlePhotosId && self.googlePhotosId.length > 0) {
            self.findRandomImage(self.googlePhotosId);        
        } else {
            self.findPhotosFolder();
        }
    },

    findPhotosFolder: function() {
        var self = this;
        console.log("Find photo folder");
        var service = google.drive('v3');

        // find the google photos drive
        service.files.list({
            auth: self.oauth2Client,
            pageSize: 1,
            fields: "files(id, name)",
            q: "name = 'Google Photos' and mimeType = 'application/vnd.google-apps.folder'"
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var files = response.files;
            if (files.length == 0) {
                console.log('Photo folder not found.');
                return;
            } else {
                self.googlePhotosId = files[0].id;
                console.log('Photo folder found: ' + self.googlePhotosId);
                self.findRandomImage();
                return;
            }
        });
    },

    findRandomImage: function() {
        var self = this;
        var service = google.drive('v3');
        console.log("Finding random photo");

        // Get a list of images and return one
        // TODO: Check for repeat
        // Get the list of pictures
        service.files.list({
            auth: self.oauth2Client,
            fields: "files(id, name)",
            q: "mimeType contains 'image/' and '" + self.googlePhotosId + "' in parents"
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var images = response.files;
            if (images.length == 0) {
                console.log("No images found");
                return;
            } else {

                // Pick one at random (except last one)
                var imgNum = -1;
                do {
                    imgNum = Math.floor(Math.random() * (images.length - 1));
                } while (self.lastPhotoId == images[imgNum].id);

                // Update the last one
                self.lastPhotoId = images[imgNum].id;
                self.lastPhotoName = images[imgNum].name;
                console.log("Found random image: " + self.lastPhotoName);
                self.saveLatestImage();
            }
        });
    },

    saveLatestImage: function() {
        var self = this;
        var service = google.drive('v3');

        // Get latest image then fetch completed
        // download the image TODO: Make sure these get deleted!
        var dest = fs.createWriteStream(self.cacheFolder + self.lastPhotoName);
        console.log("About to download " + self.lastPhotoId);
        service.files.get({
                auth: self.oauth2Client,
                fileId: self.lastPhotoId,
                alt: 'media'
            })
            .on('end', function() {
                console.log('Image downloaded');
                self.fetchCompleted(self.lastPhotoName);
            })
            .on('error', function(err) {
                console.log('Failed to download image: ', err)
                self.errorOccurred("Failed to download image: " + err);
            })
            .pipe(dest);
    },

    fetchCompleted: function(imageFile) {
        this.sendSocketNotification("NEW_IMAGE", { imageFile: imageFile }); 
    },

    errorOccurred: function(err) {
        this.sendSocketNotification("ERROR", { message: err });
    },

	scheduleNextFetch: function(delay) {
		if (delay < 60 * 1000) {
			delay = 60 * 1000
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.startFetch();
		}, delay);
	},

    /** GOOGLE LIBRARY STUFF BELOW HERE */
    
    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     */
    glibAuthorize: function() {
        var self = this;

        fs.readFile(self.secretFile, function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                errorOccurred(err);
                return;
            }

            // Authorize a client with the loaded credentials, then store it
            var credentials = JSON.parse(content);

            var clientSecret = credentials.installed.client_secret;
            var clientId = credentials.installed.client_id;
            var redirectUrl = credentials.installed.redirect_uris[0];
            self.oauth2Client = new self.auth.OAuth2(clientId, clientSecret, redirectUrl);

            // Check if we have previously stored a token.
            fs.readFile(self.tokenFile, function(err, token) {
                if (err) {
                    self.auth = self.glibGetNewToken(self.oauth2Client);
                } else {
                    self.oauth2Client.credentials = JSON.parse(token);
                    self.getPhotoFolder();
                }
            });
        });
    },

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     *     client.
     */
    glibGetNewToken: function(oauth2Client) {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES
        });
        console.log('Authorize this app by visiting this url: ', authUrl);
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter the code from that page here: ', function(code) {
            rl.close();
            oauth2Client.getToken(code, function(err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                }
                oauth2Client.credentials = token;
                console.log(token);
                self.glibStoreToken(token);
                console.log("self defined check");
                self.getPhotoFolder();
                return oauth2Client;
            });
        });
    },

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    glibStoreToken: function(token) {
        // The token is in the module folder; we know it exists
        // try {
        //     fs.mkdirSync(TOKEN_DIR);
        // } catch (err) {
        //     if (err.code != 'EEXIST') {
        //         throw err;
        //     }
        // }
        fs.writeFile(this.tokenFile, JSON.stringify(token));
        console.log('Token stored to ' + tokenFile);
    },

});
