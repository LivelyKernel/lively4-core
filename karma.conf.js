// Karma configuration
// Generated on Thu Aug 06 2015 09:43:45 GMT+0200 (W. Europe Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'requirejs', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      //'babel-core/browser.js',
      //'es6-module-loader/es6-module-loader-dev.src.js',
      'system.src.js',
      {pattern: 'babel-core/**/*.js', included: false},
      {pattern: 'client/**/*.js', included: false},
      {pattern: 'src/**/*.js', included: false},
      {pattern: 'loader/**/*.js', included: false},
      {pattern: 'transformer/**/*.js', included: false},
      {pattern: 'bootworker*', included: false},
      {pattern: 'serviceworker*', included: false},
      {pattern: 'test/**/*-test.js', included: false},
      'test-main.js'
    ],

    proxies: {
      '/babel-core/': '/base/babel-core/',
      '/es6-module-loader/': '/base/es6-module-loader/',
      '/client/': '/base/client/',
      '/src/': '/base/src/',
      '/test/': '/base/test/',
      '/serviceworker-loader.js': '/base/serviceworker-loader.js',
      '/serviceworker.js': '/base/serviceworker.js',
      '/serviceworker-cache-polyfill.js': '/base/serviceworker-cache-polyfill.js',
      '/bootworker.js': '/base/bootworker.js',
      '/bootworker.html': '/base/bootworker.html',
      '/system.src.js': '/base/system.src.js',
      '/loader/': '/base/loader/',
      '/transformer/': '/base/transformer/'
    },


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeCanary'],

    customLaunchers: {
      Chrome_Travis_CI: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      },
      ChromeCanary_Travis_CI: {
        base: 'ChromeCanary',
        flags: ['--no-sandbox']
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    browserNoActivityTimeout: 20000
  });

  if(process.env.TRAVIS) {
    config.browsers = ['ChromeCanary_Travis_CI'];
  }

};
