/*jslint node: true, nomen: true*/

var colors = require("colors"),
    config = require("./config"),
    hue = require("./notifiers/hue"),
    console = require("./console"),
    slack = require("./notifiers/slack"),
    q = require("q"),
    junk = require("junk"),
    path = require("path"),
    data = require("./database");

var ProjectMonitor = function () {
    'use strict';
    var self = this;

    self.projects = [];

    self.notifiers = [];

    self.intervals = [];

    self.stateActions = {};

    self.stateActions[config.get('projectStates:success')] = function (proj) {
        console.log("%s - Success".green, proj.name);
        hue.setColorForProject(proj, hue.xyColors.green);
        slack.notify(config.get('projectStates:success'), proj);
    };

    self.stateActions[config.get('projectStates:successFromFailure')] = function (proj) {
        console.log("%s - Success From Previous Failure".green, proj.name);
        hue.setColorForProject(proj, hue.xyColors.green, hue.alertTypes.blinkOnce);
    };

    self.stateActions[config.get('projectStates:failure')] = function (proj) {
        console.log("%s - Failure".red, proj.name);
        hue.setColorForProject(proj, hue.xyColors.red);
    };

    self.stateActions[config.get('projectStates:queuedForBuild')] = function (proj) {
        console.log("%s - Queued For Build".yellow, proj.name);
        hue.setColorForProject(proj, hue.xyColors.lightPurple);
    };

    self.stateActions[config.get('projectStates:building')] = function (proj) {
        console.log("%s - Building".yellow, proj.name);
        hue.setColorForProject(proj, hue.xyColors.purple);
    };

    self.stateActions[config.get('projectStates:deploying')] = function (proj) {
        console.log("%s - Deploying".cyan, proj.name);
        hue.setColorForProject(proj, hue.xyColors.orange);
    };

    self.stateActions[config.get('projectStates:unknown')] = function (proj) {
        console.log("%s - Unknown State", proj.name);
        hue.setColorForProject(proj, hue.xyColors.white);
    };

    self.updateProject = function (proj) {
        q.when(proj.getState(), function (state) {
            data.updateProject(proj, state);
            self.notifiers.forEach(function (n) {
                n.notify(state, proj);
            });
        });
    };

    self.loadProjects = function () {
        // Load all the projects up
        var projectsPluginFolder = path.join(__dirname, "/projects"),
            pluginFiles = require("fs").readdirSync(projectsPluginFolder).filter(junk.not);

        pluginFiles.forEach(function (file) {
            var proj = require(projectsPluginFolder + "/" + file);
            self.projects.push(proj);
            console.log("adding %s", proj.name);
            data.addProject(proj);
        });

        console.log("%s project(s) loaded", self.projects.length);
    };

    self.loadNotifiers = function () {
        // Load all the notifiers
        var notifierPluginFolder = path.join(__dirname, "/notifiers"),
            notifierFiles = require("fs").readdirSync(notifierPluginFolder).filter(junk.not);

        notifierFiles.forEach(function (file) {
            var notifier = require(notifierPluginFolder + "/" + file);
            self.notifiers.push(notifier);
        });

        console.log("%s notifer(s) loaded", self.notifiers.length);
    };

    self.start = function () {
        self.loadProjects();
        self.loadNotifiers();
        self.projects.forEach(function (proj) {
            if (proj) {
                self.updateProject(proj);
                self.intervals.push(setInterval(function () {
                    self.updateProject(proj);
                }, proj.frequency));
            }
        });
    };

    self.stop = function () {
        self.intervals.forEach(function (i) {
            clearInterval(i);
        });
        self.projects.forEach(function (p) {
            if (p.shutdown) {
                p.shutdown();
            }
        });
        self.notifiers.forEach(function (notifier) {
            if (notifier.shutdown) {
                notifier.shutdown();
            }
        });
    };
};

module.exports = new ProjectMonitor();
