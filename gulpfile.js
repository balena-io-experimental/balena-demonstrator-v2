'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  return gulp.src('./public/static/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public/static/css/'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./public/static/scss/**/*.scss', ['sass']);
});
