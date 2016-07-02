module.exports = {
  entry: './example/index.js',
  output: {
    libaryTarget: 'umd',
    filename: './example/bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  },
  externals: [
    function(context, request, callback) {
        if(/^..\/lib\//.test(request))
            return callback(null, "phosphor");
        callback();
    },
  ]
};
