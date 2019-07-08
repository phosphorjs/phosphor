var path = require('path');

module.exports = {
  entry: './build/index.spec.js',
  output: {
    filename: './build/bundle.test.js'
  },
  module: {
    rules: [
      // instrument only testing sources with Istanbul
      {
        test: /\.js$/,
        use: { loader: 'istanbul-instrumenter-loader' },
        include: path.resolve('../../packages/datastore/')
      }
    ]
  }
}
