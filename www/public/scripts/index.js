require(['jquery', 'socketio', 'bootstrap'], function ($, io) {
    $(function () {
        var socket = io();
        socket.on("Porject Updated", function (data) {
            var selector = "#" + data.project.name
            var text = data.project.name + " - " + data.currentStatus
            $(selector).text(text);
        });
    });
});
