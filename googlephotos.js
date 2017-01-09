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
        cacheFolder: 'cache/',
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
		if (this.message && this.message.length > 0) {
			wrapper.innerHTML = this.message;
			wrapper.className = "dimmed light small";
			return wrapper;
        } 
        else if (this.image && this.image.length > 0) {
            wrapper.innerHTML = "";
            wrapper.className = "dimmed light small";

            var imgContainer = document.createElement("div");
            imgContainer.className = "gpcontainer";

            var img = document.createElement("img");
            img.setAttribute("src", this.file(this.image));
            if (this.config.limitWidth > 0) {
                img.style.maxWidth = this.config.limitWidth + "px";
            }
            if (this.config.limitHeight > 0) {
                img.style.maxHeight = this.config.limitHeight + "px";
            }

            imgContainer.appendChild(img);

            wrapper.appendChild(imgContainer);
            return wrapper;
        }
		
        wrapper.innerHTML = "Unknown error in module: " + this.name + ".";
        wrapper.className = "dimmed light small";
        return wrapper;
	},

	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		Log.info("Notification received: " + notification);
        if (notification === "DOM_OBJECTS_CREATED") {
            var params = {
                tokenFile: this.file(this.config.tokenFolder + 'auth_token.json'),
                secretFile: this.file(this.config.tokenFolder + 'client_secret.json'),
                cacheFolder: this.file(this.config.cacheFolder)
            };
            this.sendSocketNotification("PARAMS", params);
            this.sendSocketNotification("CONFIG", this.config);
            this.sendSocketNotification("FETCH", {});
		}
	},

    socketNotificationReceived: function (notification, payload) {
        Log.info("Socket notification received: " + notification);
		if (notification === "NEW_IMAGE") {
            Log.info("New image received: " + payload.imageFile);
            this.message = "";
            this.image = this.config.cacheFolder + payload.imageFile;
            this.updateUI();
        } else if (notification === "ERROR") {
            this.message = payload.message;
            this.image = "";
            // TODO delete old image
            this.updateUI();    
        }
	},

    updateUI: function() {
		var self = this;
		//if (this.status && this.status.behind > 0) {
        self.updateDom(0);
		//	self.show(1000, {lockString: self.identifier});
		//}
	}
});
