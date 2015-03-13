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
 * @param {string} options.account- account name.
 * @param {string} options.repository- repository in the account.
 * @param ({string}) options.baseUrl- base url of the Travis Server defaults to api.travis-ci.com.
 * @param {string} options.token - api token.
 * @param {(string|string[])} options.project - Project name or and array or project names
 */
var Travis = function (options) {
    'use strict';
    var self = this;
    self.account = options.account;
    self.repository = options.repository;
    self.baseUrl = options.baseUrl || "https://api.travis-ci.com";
    self.url = self.baseUrl + "/repos/" + self.account + "/" + self.repository + "/builds";
    self.token = options.token;
    self.previouslyFailing = false;
    self.currentRequest;

     self.printError = function (message) {
        console.error(colors.red("[Travis CI '%s'] %s"), self.projectName, message);
    };

    self.cancel = function () {
        if (self.currentRequest) {
            self.currentRequest.abort();
        }
    };

    self.getState = function () {
        var deferred = q.defer();
        request({
            url: self.url,
            headers: {
                "Content-Tpye": "application/json",
                Authorization: "Token " + self.token,
                Accept: "application/vnd.travis-ci.2+json"
            }
        }, function (error, response, body) {
            var result;
            if (response === null || response === undefined) {
                self.printError("error getting Travis CI result, response Null");
                result = config.get("projectStates:unknown");
            }
            else if (response.statusCode < 300) {
                var json = JSON.parse(body);
                // Just get the latest build
                var build = json.builds[0];
                if (build) {
                    if (build.state === "passed") {
                        self.previouslyFailing = false;
                        if (self.previouslyFailing) {
                            result = config.get("projectStates:successFromFailure");
                        } else {
                            result = config.get("projectStates:success");
                        }
                    } else if (build.state === "created") {
                        result = config.get("projectStates:queuedForBuild");
                    } else if (build.state === "booting" || build.state === "received") {
                        result = config.get("projectStates:queuedForBuild");
                    } else if (build.state === "started") {
                        result = config.get("projectStates:building");
                    } else if (build.state === "failed") {
                        self.previouslyFailing = true;
                        result = config.get("projectStates:failure");
                    } else if (build.state === "errored") {
                        self.previouslyFailing = true;
                        result = config.get("projectStates:failure");
                    } else {
                        self.printError("Unable to parse state from server");
                        result = config.get("projectStates:unknown");
                    }
                }
            }
            else {
                self.printError("unable to check state");
                result = config.get("projectStates:unknown");
            }
            deferred.resolve(result);
        });

        return deferred.promise;
    };

    return self;
};

module.exports = Travis;
