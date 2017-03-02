var path = require('path');

module.exports = {
  entry: './build/test/index.spec.js',
  output: {
    filename: './build/bundle.test.js'
  },
  resolve: {
    modules: [path.resolve('../..'), 'node_modules']
  }
}
