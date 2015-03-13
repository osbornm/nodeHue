#NodeHue
NodeHue is an extensible node.js based project monitoring system. Projects consume `systems` (build servers, deployment server, etc.) and subscribe to `notifiers` to record the state of the project. The name is homage to the first notifier that was implemented, a build light system using Phillips Hue lights. It's Important to note that while the first use cases, and therefore most of the example, revolve around project build and deployment system NodeHue is designed to be extensible allowing you to monitor anything. For example you could monitor the amount of customer tickets and if a threshold is reached turn a light red in the team room.

### Systems
Systems are basically helpers that projects consume to get state. An example system is, Travis CI, this system provides a simple way to check the build status of a project. Systems can be implemented any way as they are just helpers there is no prescribed definition.

### Notifiers
Notifiers take the state of a project and trigger and action. For instance the Hue notifier looks for `Failed` states and turns a light red. Notifiers are automatically detected at runtime. Each Notifier is given the chance to perform an action on a project state. Based on properties of the project or the state the notifier may choose to do something or nothing. Bellow is the contract a notifier must follow.

````javaScript
/*jslint node: true */
var console = require("../console"),
    request = require("request");

var Sample = function() {
    'use strict'
    var self = this;
    /**
    * Called for each time the state of a project is monitored.
    * @param {string} state - state of the project, these are well defined string that can be read from the config file.
    * @param {string} project- The entire project object.
 */
    self.notify = function(state, project) {
        if(project.hasAProperty){
            // Make a call to another web service.
        }
    };
    return self;
};

module.exports = new Sample();
````

### Projects
Projects define metadata about a specific project to monitor and consume systems, although they do not have to consume systems (aka helpers) they generally do, and return a project state. Projects are automatically detected at runtime. Bellow is the contract a project must follow.

````javaScript
/*jslint node: true */
var console = require("../console"),
    tci = require("../systems/travisci");

var SampleProject = function() {
    'use strict'
    var self = this;
    // [required] used on the website.
    self.name = "Sample Project";
    // [required] used on the website.
    self.description = "A Sample Project in the README file";
    // [required] How often to call getState in ms.
    self.frequency = config.get('defaultFrequency');

    self.travis = new tci({account: "", repository: "", token: ""});

    // [required] called as frequently as you defined above. returns a project state string or a promise that will resolve to a state string. There are well known state strings that can be read from the config.
    self.getState = function() {
        return self.travis.getState();
    };

    // [optional] called when NodeHue is shutting down can be used to cancel request or clean up.
    self.shutdown = function () {
        self.travis.cancel();
    };

    return self;
};

module.exports = new SampleProject();
````

### config.json
NodeHue is an open source project so we don't want to just hard code our passwords and API tokens. This is where the config.json file comes in. By default NodeHue is configured to look for a `config.json` in the root folder. This file can be accessed through the config module `var config = require(.\config)`. Most of the systems, notifiers, and projects require values from this config file, in general if the values are missing they should all produce an error message explaining the values/shape that it expects. The `config.json` file is configured to be ignored in the `.gitignore` file and is meant to be shared via sneaker net.


## The Website
Accompanying NodeHue is a simple website that uses a webhook notifier to automatically update the state of each project. The website is an area that will continue to grow and provide more functionality include historical data for each project. Locally the site runs on `localhost:3000` but can be configured however you like.

## Running Locally
NodeHue is a nodejs app so you will need to install nodejs then:

1. run `npm install`
2. run `bower install`
3. run `node app.js`

There is a gulp file that can be used to deploy but you'll need to modify it to work for your system. Current it copies only the needed files to a `_build` directory and then ssh to the server stops a forever service we have running, rsync the new files, and then starts the server back up.
