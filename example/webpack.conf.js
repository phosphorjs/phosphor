module.exports = {
  entry: './index.js',
  output: {
    libaryTarget: 'umd',
    filename: './bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  },
  externals: [
    function(context, request, callback) {
        if(/^phosphor\//.test(request))
            return callback(null, "phosphor");
        callback();
    },
  ]
};
