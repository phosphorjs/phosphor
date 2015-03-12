/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

var del = require('del');
var gulp = require('gulp');
var stream = require('event-stream');
var typescript = require('gulp-typescript');


var sourceDir = './src/';
var distDir = './dist/';
var buildDir = './build/';
var jsBuildDir = buildDir + 'js/';
var dtsBuildDir = buildDir + 'dts/';

var tsSources = sourceDir + '**/*.ts';


var project = typescript.createProject({
  declarationFiles: true,
  noImplicitAny: true,
  target: 'ES5',
  module: 'commonjs',
});


gulp.task('clean', function(cb) {
  del([buildDir, distDir], cb);
});


gulp.task('build', function() {
  var src = gulp.src(tsSources).pipe(typescript(project));
  var dts = src.dts.pipe(gulp.dest(dtsBuildDir));
  var js = src.pipe(gulp.dest(jsBuildDir));
  return stream.merge(dts, js);
});


gulp.task('dist', ['build'], function() {
  // TODO implement me
});


gulp.task('watch', function() {
  gulp.watch(tsFiles, ['build']);
});


gulp.task('default', ['dist']);
