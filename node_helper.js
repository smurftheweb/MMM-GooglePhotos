var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

	config: {},

	updateTimer: null,

	start: function () {
        console.log("GP node helper started");
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "FETCH") {
            console.log("GP fetch received");
			this.config = payload;
			this.preformFetch();
		}
	},

	preformFetch() {
		var self = this;

        self.sendSocketNotification("NEW_IMAGE", { imageFile: "test_img.jpg" });
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
			self.preformFetch();
		}, delay);
	}

});
