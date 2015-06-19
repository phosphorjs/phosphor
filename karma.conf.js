module.exports = function (config) {
    'use strict';
    config.set({

        basePath: '',

        frameworks: ['mocha'],

        files: [
            'dist/*.js',
            'node_modules/expect.js/index.js',
            'tests/build/*.js'
        ],

        reporters: ['progress'],

        port: 9876,
        colors: true,
        autoWatch: false,
        singleRun: false,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        browsers: ['Firefox']

    });
};
