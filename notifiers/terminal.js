/*jslint node: true */
var console = require("../console"),
    config = require("../config"),
    colors = require("colors");

var Terminal = function () {
    'use strict';
    var self = this;

    self.getColorForState = function (state) {
        switch (state) {
        case config.get('projectStates:success'):
        case config.get('projectStates:successFromFailure'):
            return colors.green;
        case config.get('projectStates:failure'):
            return colors.red;
        case config.get('projectStates:building'):
        case config.get('projectStates:queuedForBuild'):
            return colors.yellow;
        case config.get('projectStates:deploying'):
            return colors.cyan;
        default:
            return colors.white;
        }
    };

    self.notify = function (status, project) {
        var color = self.getColorForState(status);
        console.log(color("%s - %s"), project.name, status);
    };
};

module.exports = new Terminal();
