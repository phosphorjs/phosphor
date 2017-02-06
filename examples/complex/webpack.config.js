module.exports = {
  entry: './index.js',
  output: {
    filename: './bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  }
};
