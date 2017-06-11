var path = require('path');

module.exports = {
  entry: './build/index.js',
  output: {
    path: __dirname + '/build/',
    filename: 'bundle.example.js',
    publicPath: './build/'
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.png$/, use: 'file-loader' }
    ]
  }
};
