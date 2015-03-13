/*jslint node: true */

var q = require("q"),
    config = require("../config"),
    request = require("request"),
    console = require("../console"),
    xmlParser = require("xml2js"),
    colors = require("colors");

/**
 * Assign the project to an employee.
 * @param {Object} options - options to confifure TeamCity system.
 * @param {string} options.baseUrl- base url of the Octopus Server.
 * @param {string} options.apiKey - ApiKey with rights to view the project.
 * @param {(string|string[])} options.project - Project name or and array or project names
 */
var Octopus = function (options) {
    'use strict';
    var self = this;
    self.baseUrl = options.baseUrl;
    self.apiKey = options.apiKey;
    if(options.project.length) {
        self.projects = options.project;
    } else {
        self.projects = [options.project]
    }

     self.printError = function (message) {
        console.error(colors.red("[TeamCity '%s'] %s"), self.projectName, message);
    };

    self.cancel = function () {
        if (self.currentRequest) {
            self.currentRequest.abort();
        }
    };

    self.getState = function () {
        var deferred = q.defer();

        self.currentRequest = request({
            url: self.baseUrl + "/api/dashboard",
            headers: {
                "X-Octopus-ApiKey": self.apiKey
            }
        }, function (error, response, body) {
            if(error) {
                self.printError("unknown error getting result");
                deferred.resolve(config.get("projectStates:unknown"));
            }
            else if (response === null || response === undefined) {
                self.printError("response NULL || Undefined");
                deferred.resolve(config.get("projectStates:unknown"));
            }
            else {
                var json = JSON.parse(body),
                    projectIds = [],
                    state = config.get("projectStates:success");

                json.Projects.forEach( function(p) {
                    if(self.projects.indexOf(p.Name) > -1){
                        projectIds.push(p.Id);
                    }
                });

                var tasks = json.Items.filter(function (i) {
                    return  projectIds.indexOf(i.ProjectId) > -1;
                });

                // TODO: consider filtering enviroments

                var isDeploying = tasks.some(function (t) {
                    return t.Name === "Deploy" && !t.IsCompleted
                });

                if(isDeploying) {
                    state = config.get("projectStates:deploying");
                }
                deferred.resolve(state);
            }
        });

        return deferred.promise;
    };
    return self;
}

module.exports = Octopus;
