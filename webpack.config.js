var version = require('./package.json').version;

module.exports = {
    entry: './lib',
    output: {
        filename: 'index.js',
        path: './dist',
        libraryTarget: 'this',
        publicPath: 'https://npmcdn.com/phosphor@' + version + '/dist/'
    },
    bail: true,
    devtool: 'source-map'
};
