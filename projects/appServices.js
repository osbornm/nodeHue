/*jslint node: true */

var colors = require("colors"),
    config = require("../config"),
    console = require("../console"),
    _ = require('lodash'),
    tc = require("../systems/teamcity");

var AppServicesProject = function () {
    'use strict';
    var self = this;
    self.name = "App Services";
    self.description = "App Services projects";
    self.icon = "";
    self.frequency = config.get('defaultFrequency');

    self.hueGroupId = "4";

    self.teamCityBaseUrl =  config.get("appServices:teamCity:url"), 
    self.teamCityUserName = config.get("appServices:teamCity:userName");
    self.teamCityPassword =  config.get("appServices:teamCity:password");

    self.teamCity = new tc({
        baseUrl: self.teamCityBaseUrl,
        userName: self.teamCityUserName,
        password:  self.teamCityPassword,
        projectNames: [ 
        	"AppFog v2 :: bosh_watchdog :: CI",
            "AppFog v2 :: gokiri :: build",
        	"AppFog v2 :: hydra :: clc-hydra",
        	"IronFoundry v2 :: if_release",
        	"IronFoundry v2 :: if_warden"
        	]
    });

    // Logic:
    //  Deploying > Failure > Queued For Build > Building > Success From Failure > Success > Unknown 
    //  
    // Could consider moving this inside 
    self.transitionTable = {
        "Failure": function(current, consideration) { 
            return (current === 'Deploying') ? consideration : current; 
        },
        "Success": function(current, consideration) { 
            return (current === 'Success') ? consideration : current; 
        },
        "Success From Failure": function(current, consideration) {
            return (current === 'Success') ? consideration : current; 
        },
        "Queued For Build": function(current, consideration) { 
            return _.includes(['Success', 'Success From Failure'], current) ? consideration : current; 
        },
        "Building": function(current, consideration){ 
            return _.includes(['Success', 'Success From Failure', 'Queued For Build'], current) ? consideration : current; 
        },
        "Deploying": function(current, consideration){
            return consideration;
        },
        "Unknown": function(current, consideration){
            return current;
        }
    };

    self.getState = function() {
        return self.teamCity.getMultiState()
        .then(function(projectStates) {
            var finalState = 'Success';

            projectStates.forEach(function(projectState) {
                console.log(projectState);
                var stateFn = self.transitionTable[finalState];

                if (stateFn) {
                    finalState = stateFn(finalState, projectState.status);
                } else {
                    console.error('Could not find state transition function');
                }        
            });

            return finalState;
        });
    };

    return self;
};

module.exports = new AppServicesProject();
