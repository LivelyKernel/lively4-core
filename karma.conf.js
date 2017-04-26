var webpackConfig = require('./webpack.config');
webpackConfig.devtool = 'inline-source-map';

var type = process.env.npm_lifecycle_event;
if(type) {
    console.log('script type: ' + type);
} else {
    type = 'test';
    console.log('no npm_lifecycle_event given, ASSUMING: ' + type);
}

module.exports = function (config) {
    var configuration = {
        // basePath: '.',
        browsers: ['chrome_large'],
        customLaunchers: {
            chrome_large: {
                base: 'Chrome',
                flags: [
                    '--window-size=1100,600',
                    '--window-position=-0,0'
                ]
            },
            Chrome_Travis_CI_large_no_sandbox: {
                base: 'Chrome',
                flags: [
                    '--window-size=1100,600',
                    '--window-position=-0,0',
                    '--no-sandbox'
                ]
            }
        },
        files: [
            'test/runner.js'
        ],
        plugins: [
            'karma-chrome-launcher',
            'karma-chai',
            'karma-sinon',
            'karma-sinon-chai',
            'karma-mocha',
            'karma-sourcemap-loader',
            'karma-webpack',
            'karma-mocha-reporter'
        ],
        frameworks: [ 'chai', 'mocha', 'sinon', 'sinon-chai' ],
        preprocessors: {
            'test/**/*': ['webpack', 'sourcemap'],
            'src/**/*': ['webpack', 'sourcemap']
        },
        reporters: [ 'progress', 'mocha' ],
        singleRun: false,
        webpack: webpackConfig,
        webpackServer: {
            noInfo: true
        }
    };
    if (process.env.TRAVIS) {
        configuration.browsers = ['Chrome_Travis_CI_large_no_sandbox'];
    }

    if (type === 'coverage') {
        webpackConfig.module.postLoaders = [{
            test: /\.jsx|\.js$/,
            exclude: /(test|libs|node_modules|bower_components)\//,
            loader: 'istanbul-instrumenter'
        }];
        configuration.files = ['test/runner.coverage.js'];
        configuration.plugins.push('karma-coverage');
        configuration.coverageReporter = {
            type : 'html',
            dir : 'coverage/'
        };
        configuration.reporters.push('coverage');
        configuration.singleRun = true;

    }

    config.set(configuration);
};