/*jslint node: true */

var q = require("q"),
    config = require("../config"),
    console = require("../console"),
    colors = require("colors"),
    oct = require("../systems/octopus"),
    tc = require("../systems/teamcity");

var PlatformProject = function () {
    'use strict';
    var self = this;
    self.name = "Platform";
    self.description = "the basis for everything. Control, API, Billing, etc.";
    self.icon = "";
    self.hueGroupId = "1";
    self.frequency = config.get('defaultFrequency');

    self.error = function (message) {
        console.error(colors.red("%s - %s"), self.name, message);
    };

    self.octopusBaseUrl =  config.get("platform:octopus:url");
    self.octopusApiKey =  config.get("platform:octopus:apiKey");
    self.teamCityBaseUrl =  config.get("platform:teamCity:url");
    self.teamCityUserName = config.get("platform:teamCity:userName");
    self.teamCityPassword =  config.get("platform:teamCity:password");
    self.noop = false;
    if(!self.octopusBaseUrl && !self.octopusApiKey && !self.teamCityBaseUrl && !self.teamCityUserName && !self.teamCityPassword) {
        self.error("you need a config section that looks like 'platform:{ octopus:{ url: {value}, apiKey: {value} }, teamCity: { url: {value}, userName: {value}, password: {value} } }'");
        self.noop = true;
    }

    self.octopus = new oct({
        baseUrl: config.get("platform:octopus:url"),
        apiKey: config.get("platform:octopus:apiKey"),
        project: "T3"
    });

    self.teamCity = new tc({
        baseUrl: self.teamCityBaseUrl,
        userName: self.teamCityUserName,
        password:  self.teamCityPassword,
        projectName: "T3 :: CI"
    });

    self.getState = function () {
        if(self.noop) {
            return;
        }

        var deferred = q.defer();
        self.octopus.getState().then(function(deployState) {
            if(deployState == config.get("projectStates:deploying"))
            {
                deferred.resolve(deployState);
            } else {
                self.teamCity.getState().then(function (buildState) {
                    deferred.resolve(buildState);
                });
            }
        });

        return deferred.promise;
    };

    self.shutdown = function () {
        self.teamCity.cancel();
        self.octopus.cancel();
    };

    return self;
};

module.exports = new PlatformProject();
