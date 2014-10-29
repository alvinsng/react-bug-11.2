var gulp   = require('gulp')
  , bsfy   = require('gulp-browserify')
  , uglify = require('gulp-uglify')
  , concat = require('gulp-concat');

gulp.task('app', function() {
  return gulp.src('./src/index.js')
    .pipe(bsfy({
      debug: true,
      transform: ['reactify'],
      extensions: ['.jsx'],
    }))
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./build/'));
});

gulp.task('scripts', ['app'], function(){
  return gulp.src([
    './build/app.js',
  ])
  .pipe(concat('bundle.js'))
  .pipe(gulp.dest('./build/'));
});

gulp.task('watch', ['scripts'], function() {
  gulp.watch('./src/**/*.*', ['app']);
});

gulp.task('default', ['scripts', 'watch']);
