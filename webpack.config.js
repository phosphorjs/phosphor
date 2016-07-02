var version = require('./package.json').version;

module.exports = {
    entry: './lib/api.js',
    output: {
        filename: 'index.js',
        path: './dist',
        library: 'phosphor',
        libraryTarget: 'umd',
        publicPath: 'https://npmcdn.com/phosphors@' + version + '/dist/'
    },
    devtool: 'source-map'
};
