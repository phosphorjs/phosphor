module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha'],
    reporters: ['mocha', 'coverage-istanbul'],
    files: ['build/bundle.test.js'],
    port: 9876,
    colors: true,
    singleRun: true,
    browserNoActivityTimeout: 30000,
    failOnEmptyTestSuite: false,
    coverageIstanbulReporter: {
      reports: [ 'html', 'text-summary' ],
      fixWebpackSourcePaths: true,
    },
    logLevel: config.LOG_INFO
  });
};
