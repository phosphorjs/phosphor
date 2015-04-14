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
var typedoc = require('gulp-typedoc');
var typescript = require('gulp-typescript');

// livereload and server file for dev.
var livereload = require('gulp-livereload');
var webserver = require('gulp-webserver');



var typings = ['./typings/tsd.d.ts'];


var tsSources = [
  'collections/algorithm',
  'collections/circularbuffer',
  'collections/queue',

  'core/imessage',
  'core/imessagefilter',
  'core/imessagehandler',
  'core/message',
  'core/messageloop',
  'core/signal',

  'di/token',
  'di/container',
  'di/icontainer',

  'utility/boxsizing',
  'utility/cursor',
  'utility/disposable',
  'utility/empty',
  'utility/hittest',
  'utility/pair',
  'utility/point',
  'utility/rect',
  'utility/size',
  'utility/viewport',

  'virtualdom/factory',
  'virtualdom/dom',
  'virtualdom/icomponent',
  'virtualdom/idata',
  'virtualdom/ielement',
  'virtualdom/renderer',

  'components/basecomponent',
  'components/component',
  'components/codemirror',

  'widgets/alignment',
  'widgets/childmessage',
  'widgets/direction',
  'widgets/dockmode',
  'widgets/itab',
  'widgets/ilayoutitem',
  'widgets/itabbable',
  'widgets/movemessage',
  'widgets/orientation',
  'widgets/resizemessage',
  'widgets/sizepolicy',
  'widgets/widgetflag',
  'widgets/layout',
  'widgets/layoutengine',
  'widgets/spaceritem',
  'widgets/widgetitem',
  'widgets/boxlayout',
  'widgets/splithandle',
  'widgets/splitlayout',
  'widgets/stackedlayout',
  'widgets/widget',
  'widgets/panel',
  'widgets/boxpanel',
  'widgets/splitpanel',
  'widgets/stackedpanel',
  'widgets/dockarea',
  'widgets/elementhost',
  'widgets/menuitem',
  'widgets/menu',
  'widgets/menubar',
  'widgets/tab',
  'widgets/tabbar',
  'widgets/tabpanel'

  // 'shell/IPlugin',
  // 'shell/IPluginList',
  // 'shell/IRegion',
  // 'shell/IRegionManager',
  // 'shell/AutoHidePanel',
  // 'shell/PluginList',
  // 'shell/RegionManager',
  // 'shell/Bootstrapper'
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
    .pipe(header('"use strict";\n'))
    .pipe(gulp.dest('./dist'));

  var css = gulp.src(stylSources)
    .pipe(stylus({ use: [nib()] }))
    .pipe(rename('phosphor.css'))
    .pipe(gulp.dest('./dist'));

  return stream.merge(dts, js, css);
});


var _watch = function() {
  gulp.watch(tsSources, ['dist']);
  gulp.watch(
    ['examples/**/*.ts', 'examples/**/index.html','examples/**/*.styl'],
    ['examples']
  )
}

gulp.task('watch', _watch);


gulp.task('serve', function(){
  livereload.listen();
  _watch()
  gulp.src('./')
    .pipe(webserver({
      root: 'examples',
      livereload: true,
      directoryListing: true,
      fallback: 'index.html',
      enable: true,
      open: true
  }))

});




gulp.task('examples', function() {
  var project = typescript.createProject({
    declarationFiles: false,
    noImplicitAny: true,
    target: 'ES5',
  });

  var sources = typings.concat([
    'dist/phosphor.d.ts',
    'examples/**/index.ts'
  ]);

  var src = gulp.src(sources)
    .pipe(typescript(project))
    .pipe(rename(function (path) {
      path.dirname += '/build'; }))
    .pipe(header('"use strict";\n'))
    .pipe(gulp.dest('examples'))
    .pipe(livereload());

  var css = gulp.src('examples/**/index.styl')
    .pipe(stylus({use: [nib()]}))
    .pipe(rename(function (path) {
      path.dirname += '/build'; }))
    .pipe(gulp.dest('examples'))
    .pipe(livereload());

  return stream.merge(src, css);
});


gulp.task('css', function() {
  return gulp.src(stylSources)
    .pipe(stylus({ use: [nib()] }))
    .pipe(rename('phosphor.css'))
    .pipe(gulp.dest('./dist'));
});


gulp.task('docs', function() {
  return gulp.src(typings.concat(tsSources))
    .pipe(typedoc({
      out: './build/docs',
      name: 'Phosphor',
      target: 'ES5',
      mode: 'file',
      includeDeclarations: true }));
});

gulp.task('default', ['dist']);
