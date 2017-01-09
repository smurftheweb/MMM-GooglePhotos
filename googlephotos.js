/* global Module */

/* Magic Mirror
 * Module: MMM-GooglePhotos
 *
 * By smurftheweb@gmail.com
 * MIT Licensed.
 */

Module.register("googlephotos",{

	// Default module config.
	defaults: {
        tokenFolder: 'tokens/',
        limitHeight: 280,
        limitWidth: 320,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
	},

	// Define required scripts.
	getStyles: function() {
		return ["googlephotos.css"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

        this.message = "Loading...";
        this.image = "";
		this.loaded = true;
        //this.scheduleUpdate(this.config.initialLoadDelay);
		//this.updateTimer = null;

	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
        console.log("Message: ", this.message);
		if (this.message && this.message.length > 0) {
			wrapper.innerHTML = this.message;
			wrapper.className = "dimmed light small";
			return wrapper;
        } else if (this.image && this.image.length > 0) {
            wrapper.innerHTML = "";
            wrapper.className = "dimmed light small";

            var imgContainer = document.createElement("div");
            imgContainer.className = "gpcontainer";

            var img = document.createElement("img");
            img.setAttribute("src", this.file(this.image));
            if (this.config.limitWidth > 0) {
                Log.info("Limiting width");
                img.style.maxWidth = this.config.limitWidth + "px";
            }
            if (this.config.limitHeight > 0) {
                Log.info("Limiting height");
                img.style.maxHeight = this.config.limitHeight + "px";
            }

            imgContainer.appendChild(img);

            wrapper.appendChild(imgContainer);
            return wrapper;
        }
		
        wrapper.innerHTML = "This is just a test for module: " + this.name + ".";
        wrapper.className = "dimmed light small";
        return wrapper;
	},

	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		Log.info("Notification received: " + notification);
        if (notification === "DOM_OBJECTS_CREATED") {
            var tokens = {
                tokenFile: this.file(this.config.tokenFolder + 'auth_token.json'),
                secretFile: this.file(this.config.tokenFolder + 'client_secret.json')
            };
            this.sendSocketNotification("TOKENS", tokens);
            this.sendSocketNotification("CONFIG", this.config);
            this.sendSocketNotification("FETCH", {});
			//this.hide(0,{lockString: self.identifier});
		}
	},

    socketNotificationReceived: function (notification, payload) {
        this.message = "Socket notification received: " + notification;
        Log.info("Socket notification received: " + notification);
		if (notification === "NEW_IMAGE") {
            Log.info("New image received: " + payload.imageFile);
            this.message = "";
            this.image = payload.imageFile;
        }
        this.updateUI();
		// }
	},

    updateUI: function() {
		var self = this;
		//if (this.status && this.status.behind > 0) {
        self.updateDom(0);
		//	self.show(1000, {lockString: self.identifier});
		//}
	}
});
