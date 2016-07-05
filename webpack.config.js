var version = require('./package.json').version;

module.exports = {
    entry: {
        algorithm: './lib/algorithm',
        collections: './lib/collections',
        core: './lib/core',
        dom: './lib/dom',
        ui: './lib/ui'
    },
    output: {
        filename: '[name].js',
        path: './dist',
        library: 'phosphor/lib/[name]',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        publicPath: 'https://npmcdn.com/phosphor@' + version + '/dist/'
    },
    bail: true,
    devtool: 'source-map'
};
