var webpackConfig = require('./webpack.config');
webpackConfig.devtool = 'inline-source-map';

module.exports = function (config) {
    var configuration = {
        // basePath: '.',
        browsers: ['chrome_large'],
        customLaunchers: {
            chrome_large: {
                base: 'Chrome',
                flags: [
                    '--window-size=1100,600',
                    '--window-position=-0,0',
                    '--no-sandbox'
                ]
            },
            ChromeCanary_Travis_CI_large_no_sandbox: {
                base: 'ChromeCanary',
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
            'karma-mocha',
            'karma-sourcemap-loader',
            'karma-webpack',
            'karma-mocha-reporter'
        ],
        frameworks: [ 'chai', 'mocha' ],
        preprocessors: {
            'test/**/*': ['webpack', 'sourcemap'],
            'src/**/*': ['webpack', 'sourcemap']
        },
        reporters: [ 'progress' ],
        singleRun: false,
        webpack: webpackConfig,
        webpackServer: {
            noInfo: true
        }
    };
    if (process.env.TRAVIS) {
        configuration.browsers = ['ChromeCanary_Travis_CI_large_no_sandbox'];
    }

    config.set(configuration);
};