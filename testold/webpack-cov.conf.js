module.exports = {
  entry: './test/build/index.js',
  output: {
    filename: './test/build/coverage.js'
  },
  debug: true,
  devtool: 'source-map',
  bail: true,
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        include: require('path').resolve('lib/'),
        loader: 'istanbul-instrumenter'
      }
    ],
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ],
  }
}
