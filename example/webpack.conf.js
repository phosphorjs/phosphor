var path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: './bundle.js'
  },
  resolve: {
    alias: {
      '@phosphor': 'src'
    },
    root: path.resolve('..')
  }
};
