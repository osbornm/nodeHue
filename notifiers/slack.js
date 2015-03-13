/*jslint node: true */

var request = require("request"),
    config = require("../config");

var Slack = function () {
    'use strict';
    var self = this;
    self.sendMessage = function (proj, message) {
        if (proj.slackUrl) {
            request.post({
                url: proj.slackUrl,
                headers: {
                    "Content-Tpye": "application/json"
                },
                body: JSON.stringify({
                    "username": proj.slackUsername || "nodeHue",
                    "text": message
                })
            }, function (error, response, body) {
                console.log(error);
            });
        }
    };

    self.notify = function (status, project) {
        //console.log("slack notifier");
        //TODO: Class SendMessage
    };
};

module.exports = new Slack();
