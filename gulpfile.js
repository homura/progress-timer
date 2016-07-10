var gulp = require('gulp')
var uglify = require('gulp-uglify')
var rename = require('gulp-rename')
var license = require('gulp-license')

var pkg = require('./package.json')

gulp.task('build', function () {
  gulp.src('progress-timer.js')
      .pipe(uglify())
      .pipe(license('MIT', {tiny: true, organization: pkg.author}))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(gulp.dest('dist'))
})