/*jslint node: true, nomen: true*/
var gulp = require("gulp");
var shell = require("gulp-shell");

gulp.task("build", function () {
    "use strict";
    return gulp.src(['./**/*.*', '!./_build/**/*.*', '!./design/**/*.*', '!./data/**/*.*'])
        .pipe(gulp.dest('_build'));
});

gulp.task("deploy", ["build"], shell.task([
    "ssh -t ubuntu@192.168.224.45 'sudo stop nodeHue'",
    "rsync -avzI -e ssh _build/ ubuntu@192.168.224.45:development/nodeHue/",
    "ssh -t ubuntu@192.168.224.45 'sudo start nodeHue'"
], {ignoreErrors: true }))

