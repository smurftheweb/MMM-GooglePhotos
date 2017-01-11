/* global Module */

/* Magic Mirror
 * Module: MMM-GooglePhotos
 *
 * By smurftheweb@gmail.com
 * MIT Licensed.
 */

Module.register("googlephotos", {

    // Default module config.
    defaults: {
        tokenFolder: 'tokens/',
        limitHeight: 280,
        limitWidth: 320,
        cacheFolder: 'cache/',
        updateInterval: 60 * 1000, // every 1 minutes, minimum time 1 minutes
        fetchCacheTime: 60, // time to cache expiry
    },

    // Define required scripts.
    getStyles: function() {
        return ["googlephotos.css"];
    },

    getScripts: function() {
        return ["moment.js"];
    },

    // Define start sequence.
    start: function() {
        this.message = "Loading...";
        this.image = "";
        this.loaded = true;
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "dimmed light small";

        if (this.message && this.message.length > 0) {
            wrapper.innerHTML = this.message;
            return wrapper;
        } else if (this.image && this.image.length > 0) {
            wrapper.innerHTML = "";

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
        return wrapper;
    },

    // Override notification handler.
    notificationReceived: function(notification, payload, sender) {
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

    socketNotificationReceived: function(notification, payload) {
        if (notification === "NEW_IMAGE") {
            this.message = "";
            this.replaceImage(this.config.cacheFolder + payload.imageFile);
            this.updateUI();
        } else if (notification === "ERROR") {
            Log.info(payload.message);
            this.message = payload.message;
            this.replaceImage();
            this.updateUI();
        }
    },

    replaceImage: function(newImage) {
        console.log(this.image);
        if (this.image && this.image.length > 0) {
            this.sendSocketNotification("DELETE_IMAGE", this.file(this.image));
        }

        if (newImage && newImage.length > 0) {
            this.image = newImage;
        } else {
            this.image = "";
        }
    },

    updateUI: function() {
        var self = this;
        self.updateDom(0);
    }
});