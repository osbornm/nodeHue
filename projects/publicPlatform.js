/*jslint node: true */

var colors = require("colors"),
    config = require("../config"),
    console = require("../console"),
    tci = require("../systems/travisci");

var PublicPlatformProject = function () {
    'use strict';
    var self = this;
    self.name = "Public Platform";
    self.description = "The Public website http://www.CenturyLinkCloud.com";
    self.icon = "";
    self.frequency = config.get('defaultFrequency');
    self.hueGroupId = "2";
    self.hueColors = {}
    self.hueColors[config.get('projectStates:success')] = [0.1934, 0.0547];
    self.hueColors[config.get('projectStates:successFromFailure')] = [0.1934, 0.0547];
    self.hueColors[config.get('projectStates:queuedForBuild')] = [1, 1];
    self.hueColors[config.get('projectStates:building')] = [1, 1];
    self.hueColors[config.get('projectStates:failure')] = [0.3648, 0.1507];

    self.error = function (message) {
        console.error(colors.red("%s - %s"), self.name, message);
    };

    //Get the secrete stuff
    self.account =  config.get("publicPlatform:travis:account");
    self.repository =  config.get("publicPlatform:travis:repository");
    self.token =  config.get("publicPlatform:travis:token");

    self.noop = false;
    if(!self.account && !self.repository && !self.token) {
        self.error("you need a config section that looks like 'publicPlatform:{ travis:{ account: {value}, repository: {value}, token: {value} } }'");
        self.noop = true;
    }
    self.travis = new tci({account: self.account, repository: self.repository, token: self.token});

    self.getState = function() {
        if(self.noop) {
            return;
        }
        return self.travis.getState();
    };

    return self;
};

module.exports = new PublicPlatformProject();
