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
var header = require('gulp-header');
var nib = require('nib');
var rename = require('gulp-rename');
var stream = require('event-stream');
var stylus = require('gulp-stylus');
var typescript = require('gulp-typescript');


var typings = ['./typings/tsd.d.ts'];


var tsSources = [
  'collections/IIterator',
  'collections/IIterable',
  'collections/ICollection',
  'collections/IList',
  'collections/IQueue',
  'collections/ReadOnlyCollection',
  'collections/ReadOnlyList',
  'collections/ListIterator',
  'collections/ArrayList',
  'collections/CircularBuffer',
  'collections/Queue',

  'algorithm/binarysearch',
  'algorithm/iteration',

  'core/ICoreEvent',
  'core/IDisposable',
  'core/IEventFilter',
  'core/IEventHandler',
  'core/CoreEvent',
  'core/Disposable',
  'core/eventloop',
  'core/Signal',

  'di/IInjectable',
  'di/Container',

  'dom/boxdata',
  'dom/hitTest',
  'dom/overrideCursor',

  'enums/Alignment',
  'enums/Direction',
  'enums/Orientation',
  'enums/SizePolicy',
  'enums/WidgetFlag',

  'events/ChildEvent',
  'events/MoveEvent',
  'events/ResizeEvent',

  'geometry/Point',
  'geometry/Size',
  'geometry/Rect',

  'layout/ILayoutItem',
  'layout/Layout',
  'layout/SizingItem',
  'layout/SpacerItem',
  'layout/WidgetItem',
  'layout/layoutCalc',
  'layout/BoxLayout',
  'layout/SingleLayout',
  'layout/SplitterHandle',
  'layout/SplitterLayout',
  'layout/StackLayout',

  'virtualdom/IComponent',
  'virtualdom/IVirtualElement',
  'virtualdom/VirtualElementType',
  'virtualdom/factory',
  'virtualdom/dom',
  'virtualdom/renderer',
  'virtualdom/Component',

  'widgets/ITab',
  'widgets/ChildEvent',
  'widgets/MoveEvent',
  'widgets/ResizeEvent',
  'widgets/Widget',
  'widgets/CodeMirrorWidget',
  'widgets/Splitter',
  'widgets/StackWidget',
  'widgets/Tab',
  'widgets/TabBar'
].map(function(name) { return './src/' + name + '.ts'; });


var stylSources = './styl/index.styl';


gulp.task('clean', function(cb) {
  del(['./dist'], cb);
});


gulp.task('dist', function() {
  var project = typescript.createProject({
    declarationFiles: true,
    noImplicitAny: true,
    target: 'ES5',
  });

  var sources = typings.concat(tsSources);

  var src = gulp.src(sources)
    .pipe(typescript(project));

  var dts = src.dts.pipe(concat('phosphor.d.ts'))
    .pipe(gulp.dest('./dist'));

  var js = src.pipe(concat('phosphor.js'))
    .pipe(header('"use strict";'))
    .pipe(gulp.dest('./dist'));

  var css = gulp.src(stylSources)
    .pipe(stylus({ use: [nib()] }))
    .pipe(rename('phosphor.css'))
    .pipe(gulp.dest('./dist'));

  return stream.merge(dts, js, css);
});


gulp.task('watch', function() {
  gulp.watch(tsSources, ['dist']);
});


gulp.task('examples', function() {
  var project = typescript.createProject({
    declarationFiles: false,
    noImplicitAny: true,
    target: 'ES5',
  });

  var src = gulp.src(['dist/phosphor.d.ts', 'examples/**/index.ts'])
    .pipe(typescript(project))
    .pipe(rename(function (path) {
      path.dirname += '/build'; }))
    .pipe(gulp.dest('examples'));

  var css = gulp.src('examples/**/index.styl')
    .pipe(stylus({use: [nib()]}))
    .pipe(rename(function (path) {
      path.dirname += '/build'; }))
    .pipe(gulp.dest('examples'));

  return stream.merge(src, css);
});


gulp.task('default', ['dist']);
