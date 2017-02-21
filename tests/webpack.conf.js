var path = require('path');

module.exports = {
  entry: './build/index.js',
  output: {
    filename: './build/bundle.js'
  },
  resolve: {
    modules: [path.resolve('..'), 'node_modules']
  },
  devtool: 'source-map',
  bail: true
}
