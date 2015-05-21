/*jslint node: true */

var config = require("../config"),
    rest = require("rest"),
    mime = require('rest/interceptor/mime'),
    basicAuth = require("rest/interceptor/basicAuth"),
    console = require("../console"),
    _ = require('lodash'),
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
    self.projectNames = options.projectNames;
    self.previouslyFailing = false;
    self.currentRequest;
    self.priorStates = {};
    
    self.client = rest.wrap(
        basicAuth, 
        { 
            username: self.userName, 
            password: self.password 
        }).wrap(mime);

    self.getStatusEndpoint = function() {
        return self.baseUrl + "/httpAuth/app/rest/cctray/projects.xml" ;
    }  

    self.printError = function (message) {
        console.error(colors.red("[TeamCity '%s'] %s"), self.baseUrl, message);
    };

    self.cancel = function () {
        if (self.currentRequest) {
            self.currentRequest.abort();
        }
    };

    self.getConfiguredStatus = function(project, priorState) {
        var result

        if (project.activity === "Building") {
            result = config.get("projectStates:building");
        } else if (project.activity === "Has pending changes") {
            result = config.get("projectStates:queuedForBuild");
        } else if (project.activity === "Sleeping") {
            if (project.lastBuildStatus === "Failure") {
                result = config.get("projectStates:failure");
            } else {
                if (priorState && priorState.lastBuildStatus === "Failure") {
                    result = config.get("projectStates:successFromFailure");
                } else {
                    result = config.get("projectStates:success");
                }
            }
        }

        return result;
    }

    self.makeUnknownState = function() {
         return { "projectName": "not found", status: config.get("projectStates:unknown") }
    }

    self.getMultiState = function() {
        if (!self.projectNames) {
            self.printError("No projectName specified.");
            return self.makeUnknownState();
        }

        return self.getMultiStateInner(self.projectNames);
    }

    self.getMultiStateInner = function(projectNames) {
        return self.client({ 
            path: self.getStatusEndpoint()
        }).then(function(response) {
            var responses = [];

            if (response.status.code < 300) {
                if (!response.entity.Project) {
                    self.printError("Response did not have expected format");
                    return responses;
                }

                return response.entity.Project.filter(function(project) {
                    return _.includes(projectNames, project.name);
                }).map(function(project) {

                    var priorState = self.priorStates[project.name];
                    var newStatus = self.getConfiguredStatus(project, priorState);
                    self.priorStates[project.name] = project;

                    return { 
                        "projectName": project.name,
                        status: newStatus
                    };
                });
            } 
            else {
                self.printError("Request failed with status " + response.status.code);
            }

            return responses
        }).then(function(projectResponses){
            if (projectResponses.length === 0) {
                self.printError("Could not find projects matching " + projectNames + " in returned status.");

                return self.makeUnknownState();
            }

            return projectResponses;

        }).catch(function(err) {
            self.printError(err);
            return self.makeUnknownState();
        })  
    };


    self.getState = function () {
        if (!self.projectName) {
            self.printError("No projectName specified.");
            return self.makeUnknownState();
        }

        return self.getMultiStateInner([ self.projectName ])
        .then(function(states) {
            if (states.length > 0) {
                return states[0];
            }

            self.printError("No states returned for project: " + self.projectName);
            return self.makeUnknownState();
        })
    }
    
    self.buildProjectRequest = function() {
        return {
            url: self.getStatusEndpoint(),
            auth: {
                username: self.userName,
                password: self.password
            },
            headers: {
                "Content-Tpye": "application/json",
                accepts: "application/json"
            }
        };
    };
}

module.exports = TeamCity;
