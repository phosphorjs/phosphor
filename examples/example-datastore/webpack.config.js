var path = require('path');
var MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

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
  },
  plugins: [
    new MonacoWebpackPlugin()
  ]
};
