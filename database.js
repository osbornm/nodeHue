/*jslint node: true, nomen: true*/

var colors = require("colors"),
    config = require("./config"),
    hue = require("./notifiers/hue"),
    console = require("./console"),
    slack = require("./notifiers/slack"),
    q = require("q"),
    junk = require("junk"),
    path = require("path");

var Datastore = require('nedb'),
    theDB = new Datastore({
        filename: path.join(__dirname, "data", "projects.db"),
        autoload: true
    });
console.log("db loaded");

theDB.persistence.setAutocompactionInterval(60000);

var Database = function () {
    'use strict';
    var self = this;

    self.addProject = function (proj) {
        q.when(self.getProject(proj.name), function (doc) {
            if (!doc) {
                theDB.insert({
                    _id: proj.name.replace(/ /g, ''),
                    name: proj.name,
                    addded: new Date()
                });
            }
        });
    };

    self.getProject = function (name) {
        return q.Promise(function (resolve, reject, notify) {
            theDB.findOne({
                _id: name.replace(/ /g, '')
            }, function (err, doc) {
                if (err) {
                    reject(new Error(err));
                }
                resolve(doc);
            });
        });
    };

    self.updateProject = function (proj, status) {
        return q.Promise(function (resolve, reject) {
            theDB.update({
                _id: proj.name.replace(/ /g, '')
            }, {
                $set: {
                    name: proj.name,
                    currentStatus: status,
                    updateTime: new Date()
                }
            }, function (error, updateCount) {
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve(updateCount);
                }
            });
        });
    };

    self.getCurrentProjects = function () {
        return q.promise(function (resolve, reject) {
            theDB.find({}, function (error, docs) {
                if (error)
                    reject(new Error(error));
                resolve(docs);
            });
        });
    }

    return self;
};

module.exports = new Database();
