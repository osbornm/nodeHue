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
 * @param {string} options.baseUrl- base url of the TeamCity Server.
 * @param {string} options.userName - User Name of a user with rights to view the project.
 * @param {string} options.password - password for the user.
 * @param {string} options.projectName - Name of the project to look at.
 */
var TeamCity = function (options) {
    'use strict';
    var self = this;
    self.baseUrl = options.baseUrl;
    self.userName = options.userName;
    self.password = options.password;
    self.projectName = options.projectName;
    self.previouslyFailing = false;
    self.currentRequest;

    self.printError = function (message) {
        console.error(colors.red("[TeamCity '%s'] %s"), self.projectName, message);
    };

    self.cancel = function () {
        if (self.currentRequest) {
            self.currentRequest.abort();
        }
    };

    self.getState = function () {
        var deferred = q.defer(),
            result;
        self.currentRequest = request({
                url: self.baseUrl + "/httpAuth/app/rest/cctray/projects.xml",
                auth: {
                    username: self.userName,
                    password: self.password
                },
                headers: {
                    "Content-Tpye": "application/json",
                    accepts: "application/json"
                }
            },
            function (error, response, body) {
                if (response === null || response === undefined) {
                    self.printError("response was NULL");
                    deferred.resolve(config.get("projectStates:unknown"));
                } else if (!error && response.statusCode < 300) {
                    xmlParser.parseString(body, function (parserError, parserResult) {
                        if (parserError) {
                            self.printError("error parsing JSON");
                            deferred.resolve(config.get("projectStates:unknown"));
                        } else {
                            var result,
                                project,
                                filteredProjects = parserResult.Projects.Project.filter(function (p) {
                                    return p.$.name === self.projectName;
                                }).map(function (p) {
                                    return p.$;
                                });
                            if (filteredProjects.length === 1) {
                                project = filteredProjects[0];
                                if (project.activity === "Building") {
                                    result = config.get("projectStates:building");
                                } else if (project.activity === "Has pending changes") {
                                    result = config.get("projectStates:queuedForBuild");
                                } else if (project.activity === "Sleeping") {
                                    if (project.lastBuildStatus === "Failure") {
                                        result = config.get("projectStates:failure");
                                        self.previouslyFailing = true;
                                    } else {
                                        if (self.previouslyFailing) {
                                            result = config.get("projectStates:successFromFailure");
                                        } else {
                                            result = config.get("projectStates:success");
                                        }
                                        self.previouslyFailing = false;
                                    }
                                }
                            } else {
                                self.printError("could not find project");
                                result = config.get("projectStates:unknown");
                            }
                            deferred.resolve(result);
                        }
                    });
                } else {
                    self.printError("unknown error");
                    deferred.resolve(config.get("projectStates:unknown"));
                }
            });
        return deferred.promise;
    };

    return self;
}

module.exports = TeamCity;
