var NodeHelper = require("node_helper");
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';
var auth;

module.exports = NodeHelper.create({

    // subclass start method.
    start: function() {
        console.log("Starting node_helper for module [" + this.name + "]");

        // Load client secrets from a local file.
        fs.readFile(this.path + '/client_id.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }
            // Authorize a client with the loaded credentials, then call the
            // Drive API.
            authorize(JSON.parse(content), listFiles);
        });
    },

    // subclass socketNotificationReceived
    socketNotificationReceived: function(notification, payload) {
        //console.log("=========== notification received: " + notification);
        if (notification === 'GOOGLEPHOTOS_GET') {
            this.getImagesFromJSON(payload.url, payload.size);
        }
    },

    authGoogle: function() {

    }
});

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
    var service = google.drive('v3');
    service.files.list({
        auth: auth,
        pageSize: 10,
        fields: "nextPageToken, files(id, name)"
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var files = response.files;
        if (files.length == 0) {
            console.log('No files found.');
        } else {
            console.log('Files:');
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                console.log('%s (%s)', file.name, file.id);
            }
        }
    });
}