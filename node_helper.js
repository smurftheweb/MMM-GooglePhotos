var NodeHelper = require("node_helper");
var GoogleLib = require('./googlelib.js');

var fs = require('fs');

module.exports = NodeHelper.create({

  // subclass start method.
  start: function () {

    this.googlePhotosId = "";
    this.localPhotoId = "";
    this.localPhotoName = "";

    this.log("Starting node_helper for module [" + this.name + "]");
  },

  socketNotificationReceived: function (notification, payload) {
    this.log("Notification received: " + notification);
    if (notification === "GOOGLEPHOTOS_AUTHENTICATE") {
      this.authenticate(payload.tokenFile);
    }

    // For testing only
    this.sendSocketNotification("NEWS_ITEMS", { error: err });
  },

  authenticate: function (tokenFile) {
    this.log("Token file is " + tokenFile);
    var credentialsFile = this.path + '/client_secret.json';
    // Authorize a client with the loaded credentials, then store it
    var golib = new GoogleLib(credentialsFile, tokenFile);
    golib.authorize(this.isAuthenticated, this.errorOccurred);
  },

  errorOccurred: function (err) {
    console.log("Error occurred in GP node_helper: " + err);
    this.sendSocketNotification("NEWS_ITEMS", { error: err });
  },

  isAuthenticated: function (oauth) {
    this.auth = oauth;
    this.sendSocketNotification("GOOGLEPHOTOS_AUTHORIZED", null);
  },

  log: function (msg) {
    console.log("GP: " + msg);
  }
});