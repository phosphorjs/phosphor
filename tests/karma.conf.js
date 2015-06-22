module.exports = function (config) {
    'use strict';
    config.set({

        basePath: '..',

        frameworks: ['mocha', 'detectBrowsers'],

        files: [
            'node_modules/expect.js/index.js',
            'dist/phosphor.js',
            'tests/build/*.js'
        ],

        reporters: ['progress'],

        port: 9876,
        colors: true,
        singleRun: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        plugins: [
          'karma-chrome-launcher',
          'karma-firefox-launcher',
          'karma-ie-launcher',
          'karma-safari-launcher',
          'karma-detect-browsers',
          'karma-mocha'
        ]
    });
};
