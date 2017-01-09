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
		updateInterval: 10 * 60 * 1000, // every 10 minutes
	},

	// create a variable to hold the location name based on the API result.
	fetchedLocatioName: "",

	// Define required scripts.
	getStyles: function() {
		return ["googlephotos.css"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

        this.message = "Loading...";
		this.loaded = true;
        //this.scheduleUpdate(this.config.initialLoadDelay);
		//this.updateTimer = null;

	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (!this.message && this.message.length() > 0) {
			wrapper.innerHTML = this.message;
			wrapper.className = "dimmed light small";
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
            Log.log("here0");
            var tokens = {
                tokenFile: this.file(this.config.tokenFolder + 'auth_token.json'),
                secretFile: this.file(this.config.tokenFolder + 'client_secret.json')
            };
            Log.log("here1");
            this.sendSocketNotification("TOKENS", tokens);
            Log.log("here2");
            this.sendSocketNotification("CONFIG", this.config);
            this.sendSocketNotification("FETCH", {});
			//this.hide(0,{lockString: self.identifier});
		}
	},

    socketNotificationReceived: function (notification, payload) {
        this.message = "Socket notification received";
        Log.info("Socket notification received");
		// if (notification === "NEW_IMAGE") {
        //     Log.info("New image received");
        //     this.message = "New image received";
		// 	//this.status = payload;
		// 	this.updateUI();
		// }
	},

    updateUI: function() {
		var self = this;
		//if (this.status && this.status.behind > 0) {
			self.updateDom(0);
		//	self.show(1000, {lockString: self.identifier});
		//}
	},

	// /* updateWeather(compliments)
	//  * Requests new data from openweather.org.
	//  * Calls processWeather on succesfull response.
	//  */
	// updateWeather: function() {
	// 	if (this.config.appid === "") {
	// 		Log.error("WeatherForecast: APPID not set!");
	// 		return;
	// 	}

	// 	var url = this.config.apiBase + this.config.apiVersion + "/" + this.config.forecastEndpoint + this.getParams();
	// 	var self = this;
	// 	var retry = true;

	// 	var weatherRequest = new XMLHttpRequest();
	// 	weatherRequest.open("GET", url, true);
	// 	weatherRequest.onreadystatechange = function() {
	// 		if (this.readyState === 4) {
	// 			if (this.status === 200) {
	// 				self.processWeather(JSON.parse(this.response));
	// 			} else if (this.status === 401) {
	// 				self.updateDom(self.config.animationSpeed);

	// 				Log.error(self.name + ": Incorrect APPID.");
	// 				retry = true;
	// 			} else {
	// 				Log.error(self.name + ": Could not load weather.");
	// 			}

	// 			if (retry) {
	// 				self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
	// 			}
	// 		}
	// 	};
	// 	weatherRequest.send();
	// },

	// /* getParams(compliments)
	//  * Generates an url with api parameters based on the config.
	//  *
	//  * return String - URL params.
	//  */
	// getParams: function() {
	// 	var params = "?";
	// 	if(this.config.locationID) {
	// 		params += "id=" + this.config.locationID;
	// 	} else if(this.config.location) {
	// 		params += "q=" + this.config.location;
	// 	} else if (this.firstEvent && this.firstEvent.geo) {
	// 		params += "lat=" + this.firstEvent.geo.lat + "&lon=" + this.firstEvent.geo.lon
	// 	} else if (this.firstEvent && this.firstEvent.location) {
	// 		params += "q=" + this.firstEvent.location;
	// 	} else {
	// 		this.hide(this.config.animationSpeed, {lockString:this.identifier});
	// 		return;
	// 	}

	// 	params += "&units=" + this.config.units;
	// 	params += "&lang=" + this.config.lang;
	// 	/*
	// 	 * Submit a specific number of days to forecast, between 1 to 16 days.
	// 	 * The OpenWeatherMap API properly handles values outside of the 1 - 16 range and returns 7 days by default.
	// 	 * This is simply being pedantic and doing it ourselves.
	// 	 */
	// 	params += "&cnt=" + (((this.config.maxNumberOfDays < 1) || (this.config.maxNumberOfDays > 16)) ? 7 : this.config.maxNumberOfDays);
	// 	params += "&APPID=" + this.config.appid;

	// 	return params;
	// },

	// /* processWeather(data)
	//  * Uses the received data to set the various values.
	//  *
	//  * argument data object - Weather information received form openweather.org.
	//  */
	// processWeather: function(data) {
	// 	this.fetchedLocatioName = data.city.name + ", " + data.city.country;

	// 	this.forecast = [];
	// 	for (var i = 0, count = data.list.length; i < count; i++) {

	// 		var forecast = data.list[i];
	// 		this.forecast.push({

	// 			day: moment(forecast.dt, "X").format("ddd"),
	// 			icon: this.config.iconTable[forecast.weather[0].icon],
	// 			maxTemp: this.roundValue(forecast.temp.max),
	// 			minTemp: this.roundValue(forecast.temp.min),
	// 			rain: this.roundValue(forecast.rain)

	// 		});
	// 	}

	// 	//Log.log(this.forecast);
	// 	this.show(this.config.animationSpeed, {lockString:this.identifier});
	// 	this.loaded = true;
	// 	this.updateDom(this.config.animationSpeed);
	// },

	// /* scheduleUpdate()
	//  * Schedule next update.
	//  *
	//  * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	//  */
	// scheduleUpdate: function(delay) {
	// 	var nextLoad = this.config.updateInterval;
	// 	if (typeof delay !== "undefined" && delay >= 0) {
	// 		nextLoad = delay;
	// 	}

	// 	var self = this;
	// 	clearTimeout(this.updateTimer);
	// 	this.updateTimer = setTimeout(function() {
	// 		self.updateWeather();
	// 	}, nextLoad);
	// },

	// /* ms2Beaufort(ms)
	//  * Converts m2 to beaufort (windspeed).
	//  *
	//  * argument ms number - Windspeed in m/s.
	//  *
	//  * return number - Windspeed in beaufort.
	//  */
	// ms2Beaufort: function(ms) {
	// 	var kmh = ms * 60 * 60 / 1000;
	// 	var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
	// 	for (var beaufort in speeds) {
	// 		var speed = speeds[beaufort];
	// 		if (speed > kmh) {
	// 			return beaufort;
	// 		}
	// 	}
	// 	return 12;
	// },

	// /* function(temperature)
	//  * Rounds a temperature to 1 decimal or integer (depending on config.roundTemp).
	//  *
	//  * argument temperature number - Temperature.
	//  *
	//  * return number - Rounded Temperature.
	//  */
	// roundValue: function(temperature) {
	// 	var decimals = this.config.roundTemp ? 0 : 1;
	// 	return parseFloat(temperature).toFixed(decimals);
	// }
});
