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
        // Every non-relative module is external
        // abc -> require("abc")
        /^phosphor\/[a-z\-0-9]+$/,
        function(context, request, callback) {
            // Every module prefixed with "global-" becomes external
            // "global-abc" -> abc
            if(/^phosphor\//.test(request))
                return callback(null, "phosphor");
            callback();
        },
  ]
};
