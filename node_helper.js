var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

	config: {},

    tokenFile: '',
    secretFile: '',

	updateTimer: null,

	start: function () {
        console.log("GP node_helper started");
        this.sendSocketNotification("HELLO", { message: "Hello!" });
	},

	socketNotificationReceived: function (notification, payload) {
        var self = this;

        console.log("GP node_helper notification: " + notification);
        if (notification === "CONFIG") {
            console.log("Config received");
            this.config = payload;
        } else if (notification === "TOKENS") {
            console.log("Tokens received: ", payload);
            this.tokenFile = payload.tokenFile;
            this.secretFile = payload.secretFile;
        } else if (notification === "FETCH") {
            console.log("GP fetch received");
            this.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });
			//this.performFetch();
		} else {
            console.log("Unrecognised notification: " + notification);
        }
	},

	performFetch() {
		var self = this;

        self.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });
        console.log("debug: " + this.config.tokenFolder);
        console.log("Message sent");
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

	scheduleNextFetch: function(delay) {
		if (delay < 60 * 1000) {
			delay = 60 * 1000
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.performFetch();
		}, delay);
	}

});
