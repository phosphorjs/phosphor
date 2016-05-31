module.exports = {
  entry: './example/index.js',
  output: {
    filename: './example/bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  }
};
