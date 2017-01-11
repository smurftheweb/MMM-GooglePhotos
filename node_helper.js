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

    SCOPES: ['https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
    ],

    start: function() {},

    socketNotificationReceived: function(notification, payload) {
        var self = this;

        if (notification === "PARAMS") {
            this.tokenFile = payload.tokenFile;
            this.secretFile = payload.secretFile;
            this.cacheFolder = payload.cacheFolder;
            this.createCacheFolder();
        } else if (notification === "CONFIG") {
            this.config = payload;
        } else if (notification === "FETCH") {
            this.startFetch();
        } else if (notification === "DELETE_IMAGE") {
            fs.unlink(payload);
        } else {
            this.errorOccurred("Unrecognised notification in node_helper: " + notification);
        }
    },

    createCacheFolder() {
        fs.access(this.cacheFolder, fs.constants.F_OK, (err) => {
            if (err) { fs.mkdir(this.cacheFolder); }
        });
    },

    // This function starts fetching images. 
    startFetch() {

        var self = this;
        console.log("GooglePhotos - Starting fetch");

        // If we do not have an authorized client already, setup one
        if (!self.oauth2Client || self.oauth2Client === undefined) {

            // Authorize a client with the loaded credentials, then store it
            self.glibAuthorize(self.getPhotoFolder, self.errorOccurred);
        } else {
            self.getPhotoFolder(self); //self.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });    
        }
    },

    // This function checks if we have the "Google Photos" folder ID, then passes on to
    // findRandomImage if we do. Otherwise, it goes to find it.
    getPhotoFolder: function(self) {

        // Check if we have photos
        if (self.googlePhotosId && self.googlePhotosId.length > 0) {
            self.findRandomImage(self.googlePhotosId);
        } else {
            self.findPhotosFolder();
        }
    },

    // This function actually finds the google photo folder, and passes on to
    // findRandomImage. We cache the folder id as we need it every time.
    findPhotosFolder: function() {
        var self = this;
        var service = google.drive('v3');

        // find the google photos drive
        service.files.list({
            auth: self.oauth2Client,
            pageSize: 1,
            fields: "files(id, name)",
            q: "name = 'Google Photos' and mimeType = 'application/vnd.google-apps.folder'"
        }, function(err, response) {
            if (err) {
                self.errorOccurred('The API returned an error: ' + err);
                return;
            }
            var files = response.files;
            if (files.length == 0) {
                self.errorOccurred('Photo folder not found.');
                return;
            } else {
                self.googlePhotosId = files[0].id;
                self.findRandomImage();
                return;
            }
        });
    },

    // Find a random image in google photos folder, and pass on to saveLatestImage.
    findRandomImage: function() {
        var self = this;
        var service = google.drive('v3');

        // Get a list of images and return one
        // TODO: Check for repeat
        // Get the list of pictures
        service.files.list({
            auth: self.oauth2Client,
            fields: "files(id, name)",
            q: "mimeType contains 'image/' and '" + self.googlePhotosId + "' in parents"
        }, function(err, response) {
            if (err) {
                self.errorOccurred('The API returned an error: ' + err);
                return;
            }
            var images = response.files;
            if (images.length == 0) {
                self.errorOccurred("No images found");
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
        service.files.get({
                auth: self.oauth2Client,
                fileId: self.lastPhotoId,
                alt: 'media'
            })
            .on('end', function() {
                self.fetchCompleted(self.lastPhotoName);
            })
            .on('error', function(err) {
                self.errorOccurred("Failed to download image: " + err);
            })
            .pipe(dest);
    },

    fetchCompleted: function(imageFile) {
        this.sendSocketNotification("NEW_IMAGE", { imageFile: imageFile });
        this.scheduleNextFetch(this.config.updateInterval);
    },

    errorOccurred: function(err, self) {
        var me = self || this;
        me.sendSocketNotification("ERROR", { message: err });
        me.scheduleNextFetch(this.config.updateInterval);
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
    glibAuthorize: function(authorisedCallback, errorCallback) {
        var self = this;

        fs.readFile(self.secretFile, function processClientSecrets(err, content) {
            if (err) {
                errorCallback('Error loading client secret file: ' + err, self);
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
                    self.auth = self.glibGetNewToken(self.oauth2Client, authorisedCallback, errorCallback);
                } else {
                    self.oauth2Client.credentials = JSON.parse(token);
                    authorisedCallback(self);
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
    glibGetNewToken: function(oauth2Client, authorisedCallback, errorCallback) {
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
                    errorCallback('Error while trying to retrieve access token: ' + err)
                    return;
                }
                oauth2Client.credentials = token;
                self.glibStoreToken(token);
                authorisedCallback();
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