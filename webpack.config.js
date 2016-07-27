var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'dist');
var APP_DIR = path.resolve(__dirname, 'src/client/app');
var JSNEXT_MAIN = path.resolve(__dirname, require('./package.json')['jsnext:main']);

var config = {
    //entry: JSNEXT_MAIN.toString(),
    output: {
        path: BUILD_DIR,
        filename: 'stack-es2015-modules.js'
    },
    devtool: "inline-source-map",
    module : {
        loaders : [
            {
                test: /\.(jsx|js)$/,
                exclude : [
                    /node_modules/
                ],
                loader : 'babel-loader'
            }
        ]
    },
    resolve: {
        extensions: [
            "", ".webpack.js", ".web.js", ".js", //default
            ".jsx"
        ],
        alias: {
            actions: APP_DIR + "/actions",
            components: APP_DIR + "/components",
            constants: APP_DIR + "/constants",
            containers: APP_DIR + "/containers",
            reducers: APP_DIR + "/reducers",
            base: APP_DIR
        }
    }
};

if(process.env.npm_lifecycle_event == 'build') {
    console.log('webpack: use special \'build\' configuration.');
    config.entry = JSNEXT_MAIN;

    config.output.library = 'stack-es2015-modules';
    config.output.libraryTarget = 'umd';
    config.output.umdNamedDefine = true;
} else {
    console.log('webpack: basic configuration used, as no special configuration found, instead found: \'' + process.env.npm_lifecycle_event + '\'.');
}

module.exports = config;
