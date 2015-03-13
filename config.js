/*jslint node: true */

var path = require("path"),
    nconf = require('nconf');

nconf.argv()
     .env()
     .file({ file: path.join(__dirname, "config.json") });

nconf.defaults({
    defaultFrequency: 20000,
    projectStates: {
        success: "Success",
        successFromFailure: "Success From Failure",
        failure: "Failure",
        queuedForBuild: "Queued For Build",
        building: "Building",
        deploying: "Deploying",
        unknown: "Unknown"
    }
});


module.exports = nconf;
