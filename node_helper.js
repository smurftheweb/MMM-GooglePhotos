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

	updateTimer: null,

    SCOPES: [ 'https://www.googleapis.com/auth/drive.metadata.readonly' ],

	start: function () {
        console.log("GP node_helper started");
	},

	socketNotificationReceived: function (notification, payload) {
        var self = this;

        console.log("GP node_helper notification: " + notification);
        if (notification === "CONFIG") {
            this.config = payload;
        } else if (notification === "TOKENS") {
            this.tokenFile = payload.tokenFile;
            this.secretFile = payload.secretFile;
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
            self.fetchCompleted("test_img.jpg"); //self.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });    
        }

        self.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });
		// simpleGits.forEach(function(sg) {
		// 	sg.git.fetch().status(function(err, data) {
		// 		data.module = sg.module;
		// 		if (!err) {
		// 			self.sendSocketNotification("STATUS", data);
		// 		}
		// 	});
		// });

		// this.scheduleNextFetch(this.config.updateInterval);
	},

    fetchCompleted: function(imageFile) {
        this.sendSocketNotification("NEW_IMAGE", { imageFile: imageFile }); 
    },

    isAuthenticated: function(auth) {
        this.fetchCompleted("test_img.jpg");
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
                    self.auth = glibGetNewToken(self.oauth2Client);
                    self.errorOccurred("New token");
                } else {
                    self.oauth2Client.credentials = JSON.parse(token);
                    self.errorOccurred("Existing Token");
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
                glibStoreToken(token);
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
