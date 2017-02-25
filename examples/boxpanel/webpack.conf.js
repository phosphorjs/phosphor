module.exports = {
  entry: './examples/boxpanel/index.js',
  output: {
    filename: './examples/boxpanel/bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  }
};
