/*jslint node: true */

var colors = require("colors"),
    config = require("../config"),
    console = require("../console");

var AppServicesProject = function () {
    'use strict';
    var self = this;
    self.name = "App Services";
    self.description = "App Services projects";
    self.icon = "";
    self.frequency = config.get('defaultFrequency');

    self.hueGroupId = "4";
    
    self.getState = function() {
    	return config.get("projectStates:success");
    };

    return self;
};

module.exports = new AppServicesProject();
