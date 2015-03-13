/*jslint node: true, nomen: true*/

"use strict";

var readline = require("readline"),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    }),
    path = require("path"),
    projectMonitor = require("./projectMonitor"),
    express = require("express"),
    app = express(),
    port = 3000,
    projects = [],
    lessMiddleware = require("less-middleware"),
    serveStatic = require("serve-static"),
    theDB = require("./database");


// Setup the website
app.use(lessMiddleware(__dirname + "/www/public"));
app.use(lessMiddleware(path.join(__dirname, "www", "public", "less"), {
    dest: path.join(__dirname, "www", "public"),
    preprocess: {
        path: function (pathname, req) {
            pathname = pathname.replace("/css/", "/");
            return pathname;
        }
    }
}));

app.use(serveStatic(__dirname + "/www/public"));
app.set("views", path.join(__dirname, "/www/views"));
app.set("view engine", "hjs");

app.get("/", function (req, res) {
    theDB.getCurrentProjects().done(function (docs) {
        res.render("index", {
            projects: docs,
            partials: {
                layout: "layout",
                project: "project"
            }
        });
    });
});

app.get('/health', function(req, res){
  res.send({
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  })
})


app.get("/api/projects", function (req, res) {
    theDB.getCurrentProjects().done(function (docs) {
        res.json(docs.map(function (d) {
            return { id: d._id, status: d.currentStatus };
        }));
    });
});

    // start everything up
    var server = app.listen(port, function () {
        console.log("listening on port %s", port);
        rl.question("Hit enter to stop...\r\n", function () {
            console.log("stopping...");
            projectMonitor.stop();
            server.close();
            process.exit();
        });
        projectMonitor.start(projects);
    });

    // Setup Websockets
    var io = require('socket.io').listen(server); io.on("connection", function (socket) {
        //console.log("a user connected!");
    });


    module.exports = {
        webSocket: io
    };
