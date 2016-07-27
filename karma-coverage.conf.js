var webpackConfig = require('./webpack.config');
webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.postLoaders = [{
  test: /\.jsx|\.js$/,
  exclude: /(test|libs|node_modules|bower_components)\//,
  loader: 'istanbul-instrumenter'
}]

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
            'test/runner.coverage.js'
        ],
        plugins: [
            'karma-chrome-launcher',
            'karma-chai',
            'karma-sinon',
            'karma-mocha',
            'karma-sourcemap-loader',
            'karma-webpack',
            'karma-coverage',
            'karma-mocha-reporter'
        ],
        frameworks: [ 'chai', 'mocha', 'sinon' ],
        preprocessors: {
            'test/**/*': ['webpack', 'sourcemap'],
            'src/**/*': ['webpack', 'sourcemap']
        },
        coverageReporter: {
            type : 'html',
            dir : 'coverage/'
        },
        reporters: [ 'progress', 'coverage', 'mocha' ],
        singleRun: true,
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