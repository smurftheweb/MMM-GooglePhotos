/* global Module */

/* Magic Mirror
 * Module: HelloWorld
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("googlephotos", {

    // Default module config.
    defaults: {
        img: 'test_img.jpg',
        limitWidth: 320,
        limitHeight: 280,
        loadingText: "Loading...",
        googlePhotosId: "",
        lastPhotoId: ""
    },

    getStyles: function() {
        return ["googlephotos.css"]
    },

    //getScripts: function() {
    //    return ["googlelibs.js"]
    //},

    start: function() {
        this.data.classes = 'bright medium';

    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

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