var NodeHelper = require("node_helper");
var GoogleLib = require('./googlelib.js');

var fs = require('fs');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/admin-directory_v1-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';


module.exports = NodeHelper.create({

    // subclass start method.
    start: function() {

        //this.SCOPES = ;
        //this.TOKEN_PATH = this.path + 

        this.googlePhotosId = "";
        this.localPhotoId = "";
        this.localPhotoName = "";

        this.log("Starting node_helper for module [" + this.name + "]");
    },

    socketNotificationReceived: function(notification, payload) {
        this.log("Notification received: " + notification);
        if (notification === "GOOGLEPHOTOS_AUTHENTICATE") {
            this.authenticate(payload.tokenFile);
        }
    },

    authenticate: function(tokenFile) {
        this.log("Token file is " + tokenFile);
        var credentialsFile = this.path + '/client_secret.json';
        // Authorize a client with the loaded credentials, then store it
        var golib = new GoogleLib(credentialsFile, tokenFile);
        var auth = golib.authorize();
        this.log('Authenticated: ' + auth);
    },

    log: function(msg) {
        console.log("GP: " + msg);
    }
});