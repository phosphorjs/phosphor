var path = require('path');

module.exports = {
  entry: './build/index.js',
  output: {
    filename: './build/bundle.example.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};
