/*jslint node: true */

var q = require("q"),
    config = require("../config"),
    console = require("../console"),
    colors = require("colors"),
    tc = require("../systems/teamcity");

var PlatformApiProject = function () {
    'use strict';
    var self = this;
    self.name = "Platform API Tests";
    self.description = "Will they ever pass?";
    self.icon = "";
    self.hueGroupId = "5";

    self.error = function (message) {
        console.error(colors.red("%s - %s"), self.name, message);
    };

    self.frequency = 60000;
    self.teamCityBaseUrl =  config.get("platform:teamCity:url");
    self.teamCityUserName = config.get("platform:teamCity:userName");
    self.teamCitypassword =  config.get("platform:teamCity:password");
    self.noop = false;
    if (!self.teamCityBaseUrl && !self.teamCityUserName && !self.teamCitypassword) {
        self.error("you need a config section that looks like 'platform:{ octopus:{ url: {value}, apiKey: {value} }, teamCity: { url: {value}, userName: {value}, password: {value} } }'");
        self.noop = true;
    }
    self.teamCity = new tc({
        baseUrl: self.teamCityBaseUrl,
        userName: self.teamCityUserName,
        password:  self.teamCitypassword,
        projectName: "T3 :: API Tests"
    });

    self.getState = function() {
        if(self.noop) {
            return;
        }
        return self.teamCity.getState().then(function(state) { return state.status; });
    }

    self.shutdown = function () {
        self.teamCity.cancel();
    };

    return self;
};

module.exports = new PlatformApiProject();
