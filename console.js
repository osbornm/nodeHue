/*jslint node: true */

var Console = function () {
    'use strict';
    var self = this;

    self.log = function () {
        if (process.env.NODE_ENV !== 'prod') {
            console.log.apply(this, arguments);
        }
    };

    self.error = function () {
        console.error.apply(this, arguments);
    };
};

module.exports = new Console();
