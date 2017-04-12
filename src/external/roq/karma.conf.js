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
            'test/temp/out.js'
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
        singleRun: false
    };
    if (process.env.TRAVIS) {
        configuration.browsers = ['ChromeCanary_Travis_CI_large_no_sandbox'];
    }

    config.set(configuration);
};