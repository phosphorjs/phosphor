/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

var del = require('del');
var concat = require('gulp-concat');
var gulp = require('gulp');
var nib = require('nib');
var rename = require('gulp-rename');
var stream = require('event-stream');
var stylus = require('gulp-stylus');
var typescript = require('gulp-typescript');


var sourceDir = './src/';
var stylDir = './styl/';
var distDir = './dist/';
var buildDir = './build/';
var jsBuildDir = buildDir + 'js/';
var dtsBuildDir = buildDir + 'dts/';
var cssBuildDir = buildDir + 'css/';

var tsSources = sourceDir + '**/*.ts';
var jsSources = jsBuildDir + '**/*.js';
var stylSources = stylDir + 'index.styl';


var project = typescript.createProject({
  declarationFiles: true,
  noImplicitAny: true,
  target: 'ES5',
});


gulp.task('clean', function(cb) {
  del([buildDir, distDir], cb);
});


gulp.task('build', function() {
  var src = gulp.src(tsSources).pipe(typescript(project));
  var dts = src.dts.pipe(concat('phosphor.d.ts')).pipe(gulp.dest(dtsBuildDir));
  var js = src.pipe(concat('phosphor.js')).pipe(gulp.dest(jsBuildDir));
  var css = gulp.src(stylSources)
    .pipe(stylus({ use: [nib()] }))
    .pipe(rename('phosphor.css'))
    .pipe(gulp.dest(cssBuildDir));
  return stream.merge(dts, js, css);
});


gulp.task('dist', ['build'], function() {
  // TODO implement me
});


gulp.task('watch', function() {
  gulp.watch(tsFiles, ['build']);
});


gulp.task('examples', function() {
  var project = typescript.createProject({
    declarationFiles: false,
    noImplicitAny: true,
    target: 'ES5',
  });
  var glob = [].concat([
    'build/dts/phosphor.d.ts',
    'examples/**/index.ts'
  ]);
  var src = gulp.src(glob)
    .pipe(typescript(project))
    .pipe(rename(function (path) {
      path.dirname += '/build';
    })).pipe(gulp.dest('examples'));
  var css = gulp.src('examples/**/index.styl')
    .pipe(stylus({use: [nib()]}))
    .pipe(rename(function (path) {
      path.dirname += '/build';
    })).pipe(gulp.dest('examples'));
  return stream.merge(src, css);
});


gulp.task('default', ['dist']);
