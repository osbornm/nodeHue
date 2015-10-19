/*jslint node: true */

var q = require("q"),
  colors = require("colors"),
  config = require("../config"),
  console = require("../console"),
  tci = require("../systems/travisci");

var CyclopsProject = function() {
  'use strict';
  var self = this;
  self.name = "Cyclops";
  self.description = "Cyclops and the Asset server assests.ctl.io";
  self.icon = "";
  self.frequency = config.get('defaultFrequency');
  self.hueGroupId = "2";
  self.hueColors = {}
  self.hueColors[config.get('projectStates:success')] = [0.1934, 0.0547];
  self.hueColors[config.get('projectStates:successFromFailure')] = [0.1934, 0.0547];
  self.hueColors[config.get('projectStates:queuedForBuild')] = [1, 1];
  self.hueColors[config.get('projectStates:building')] = [1, 1];
  self.hueColors[config.get('projectStates:failure')] = [0.3648, 0.1507];

  self.error = function(message) {
    console.error(colors.red("%s - %s"), self.name, message);
  };

  //Get the secrete stuff
  self.account = config.get("uiux:travis:account");
  self.token = config.get("uiux:travis:token");

  self.noop = false;
  if (!self.account && !self.repository && !self.token) {
    self.error("you need a config section that looks like 'publicPlatform:{ travis:{ account: {value}, repository: {value}, token: {value} } }'");
    self.noop = true;
  }
  self.cyclopsTravis = new tci({
    account: self.account,
    repository: "Cyclops",
    token: self.token
  });

  self.assetsTravis = new tci({
    account: self.account,
    repository: "AssetsServer",
    token: self.token
  });

  self.getState = function() {
    if (self.noop) {
      return;
    }

    var deffered = q.defer();
    self.assetsTravis.getState()
      .then(function(deployState) {
        if (deployState == config.get("projectStates:deploying")) {
          deffered.resolve(deployState);
        } else {
          self.cyclopsTravis.getState()
            .then(function(buildState) {
              deffered.resolve(buildState);
            });
        }
      });

    return deffered.promise;
  };

  return self;
};

module.exports = new CyclopsProject();