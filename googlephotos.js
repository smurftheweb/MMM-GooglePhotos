/* global Module */

/* Magic Mirror
 * Module: HelloWorld
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("googlephotos",{

	// Default module config.
	defaults: {
		img: 'test_img.jpg',
		limitWidth: 320,
		limitHeight: 280,
		loadingText: "Loading..."
	},

	start: function() {
		this.data.classes = 'bright medium';
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		
		var img = document.createElement("img");
		img.setAttribute("src", this.file(this.config.img));
		if (this.config.limitWidth > 0)  img.style.width = this.config.limitWidth;
		if (this.config.limitHeight > 0) img.style.height = this.config.limitHeight;
		
		wrapper.appendChild(img);
		return wrapper;
	}
});
