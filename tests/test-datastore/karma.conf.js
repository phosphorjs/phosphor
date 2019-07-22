module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha'],
    reporters: ['mocha'],
    files: ['build/bundle.test.js'],
    port: 9876,
    colors: true,
    singleRun: true,
    browserNoActivityTimeout: 30000,
    failOnEmptyTestSuite: false,
    logLevel: config.LOG_INFO
  });
};
