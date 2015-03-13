/*jslint node: true */

var request = require("request"),
    config = require("../config"),
    io = require("../app").webSocket;

var WebSocket = function () {
    'use strict';
    var self = this;

    self.notify = function (state, project) {
        if (io) {
            io.emit("Porject Updated", { project: project, currentStatus: state });
        }
    };

    return self;
};

module.exports = new WebSocket();
