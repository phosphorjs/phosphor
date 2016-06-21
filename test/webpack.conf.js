module.exports = {
  entry: './test/build/index.js',
  output: {
    filename: './test/build/bundle.js'
  },
  debug: true,
  devtool: 'source-map',
  bail: true,
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ]
  }
}
