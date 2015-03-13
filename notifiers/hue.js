/*jslint node: true */

var request = require("request"),
    config = require("../config");

var Hue = function () {
    'use strict';
    var self = this;
    self.baseUrl = config.get("hue:baseUrl");
    self.xyColors = {
        green: [0.4062, 0.5124],
        lightPurple: [0.3225, 0.2552],
        purple: [0.1934, 0.0547],
        red: [0.644, 0.3048],
        orange: [1, 1],
        white: [0.1941, 0.0559]
    };
    self.alertTypes = {
        none: "none",
        blinkOnce: "select",
        blink: "lselect"
    };
    self.setGroupColor = function (groupId, xyColor, alertType) {
        if (!alertType) {
            alertType = self.alertTypes.none;
        }
        request.put({
            url: self.baseUrl + "groups/" + groupId + "/action", //TODO: build up a URL so that / are all right
            headers: {
                "Content-Tpye": "application/json"
            },
            body: JSON.stringify({
                "on": true,
                "alert": alertType,
                "bri": 200,
                "xy": xyColor
            })
        }, function (error, response, body) {
            if (error) {
                console.log("unable to set group '" + groupId + "' to correct color!".red);
            }
        });
    };
    self.getColorForState = function (state) {
        switch (state) {
        case config.get('projectStates:success'):
        case config.get('projectStates:successFromFailure'):
            return self.xyColors.green;
        case config.get('projectStates:failure'):
            return self.xyColors.red;
        case config.get('projectStates:building'):
            return self.xyColors.purple;
        case config.get('projectStates:queuedForBuild'):
            return self.xyColors.lightPurple;
        case config.get('projectStates:deploying'):
            return self.xyColors.orange;
        default:
            return self.xyColors.white;
        }
    };
    self.notify = function (state, project) {
        if (project.hueGroupId && self.baseUrl !== undefined) {
            var color = self.getColorForState(state);
            if (project.hueColors) {
                color = project.hueColors[state] || color;
            }

            self.setGroupColor(project.hueGroupId, color);
        } else {
            console.log("no hue baseurl");
        }
    };
};

module.exports = new Hue();
