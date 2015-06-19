module.exports = function (config) {
  'use strict';
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    frameworks: ['mocha'],

    // list of files / patterns to load in the browser
    files: [
      "node_modules/expect.js/index.js",
      "dist/phosphor.js",
      "tests/build/index.js"
    ],

    // list of files to exclude
    exclude: [
    ],

    preprocessors: {
    },

    // use dots reporter, as travis terminal does not support escaping sequences
    // possible values: 'dots', 'progress'
    // CLI --reporters progress
    reporters: ['progress'],

    // web server port
    // CLI --port 9876
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    // CLI --colors --no-colors
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    // CLI --log-level debug
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    // CLI --auto-watch --no-auto-watch
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    // CLI --browsers Chrome,Firefox,Safari
    browsers: [process.env.TRAVIS ? 'Firefox' : 'Chrome'],

    // If browser does not capture in given timeout [ms], kill it
    // CLI --capture-timeout 5000
    captureTimeout: 20000,

    // report which specs are slower than 500ms
    // CLI --report-slower-than 500
    reportSlowerThan: 500,
  })
}
