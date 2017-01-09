/* global Module */

/* Magic Mirror
 * Module: HelloWorld
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("googlephotos", {

    imageFile: "",
    errorMessage: "",

    // Default module config.
    defaults: {
        img: 'test_img.jpg',
        limitWidth: 320,
        limitHeight: 280,
        loadingText: "Loading...",
        isAuthorised: false,

    },

    getStyles: function() {
        return ["googlephotos.css"]
    },

    //getScripts: function() {
    //    return ["googlelibs.js"]
    //},

    start: function() {
        this.data.classes = 'bright medium';
        this.tokenFile = this.file('auth_token.json');
        this.sendSocketNotification("GOOGLEPHOTOS_AUTHENTICATE", { tokenFile: this.tokenFile });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GOOGLEPHOTOS_ERR") {
            console.log("GP Error: " + errorMessage);
            errorMessage = payload;
        }
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        if (errorMessage.length() > 0) {
            wrapper.innerText = "An error occurred: " + errorMessage;
            return wrapper;
        }

        var imgContainer = document.createElement("div");
        imgContainer.className = "gpcontainer";

        var img = document.createElement("img");
        img.setAttribute("src", this.file(this.config.img));
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
});