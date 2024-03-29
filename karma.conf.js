// Karma configuration
// Generated on Thu Aug 06 2015 09:43:45 GMT+0200 (W. Europe Daylight Time)
var fs = require("fs")

module.exports = function(config) {
  config.set({

    client: {
      mocha: {
        timeout : 6000 // 6 seconds - upped from 2 seconds
      }
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    // frameworks: ['mocha', 'requirejs', 'chai'],
    // frameworks: [],
    // 'requirejs' ... !!!! THIS BREAKS Lively Modules
    frameworks: ['mocha'], // ,'chai'

    // frameworks: [],
    

    // list of files / patterns to load in the browser
    files: [
      // 'src/external/system.src.js',
      // 'src/external/babel-browser.js',
      // 'vendor/regenerator-runtime.js',

      
      // #Jens, cannot load lively.modules here, because we configure System.js later
      // ALT: 'src/external/lively.modules-with-lively.vm.js',
      // 'node_modules/systemjs/dist/system.src.js',
      // 'node_modules/lively.modules/dist/lively.modules-with-lively.vm.js',
      
      // {pattern: 'node_modules/**/*.js', included: false},
      // {pattern: 'node_modules/**/*.json', included: false},
      {pattern: 'node_modules/mocha/mocha.js', included: false},
      {pattern: 'src/**/*.js*', included: false},
      {pattern: 'src/**/*.css*', included: false},
      {pattern: 'src/**/*.html*', included: false},
      {pattern: 'src/**/*.wasm*', included: false},
      {pattern: 'swx-*.js', included: false},
      
      {pattern: 'test/**/*', included: false},

      {pattern: 'demos/**/*.js', included: false},
      {pattern: 'demos/**/*.html', included: false},

      
      {pattern: 'vendor/**/*.js', included: false},
      {pattern: 'templates/**/*', included: false},
      {pattern: 'test-main.js', included: false},
      {pattern: 'package.json', included: false},

      {pattern: 'src/external/focalStorage.js', included: false},
      'test-loader.js' // BOOT STARTS HERE
    ],

    proxies: {
      '/node_modules/': '/base/node_modules/',
      '/node_modules/mocha/mocha.js': '/base/node_modules/mocha/mocha.js',
      '/src/': '/base/src/',
      '/test/': '/base/test/',
      '/demos/': '/base/demos/',
      '/templates/': '/base/templates/',
      '/package.json': '/base/package.json',
      '/swx-boot.js': '/base/swx-boot.js',
      '/swx-loader.js': '/base/swx-loader.js',
      '/swx-post.js': '/base/swx-post.js',
      '/swx-pre.js': '/base/swx-pre.js',
    },

    // list of files to exclude
    // TODO: call github api from travis ci
    exclude: ['src/external/**/*-test.js'].concat(process.env.TRAVIS ? ['test/github-api-test.js'] : []),

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
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    customLaunchers: {
      Chrome_Travis_CI: {
        base: 'Chrome',
        flags: ['--disable-gpu',
            '--disable-accelerated-video-decode',
            '--disable-accelerated-mjpeg-decode'] // '--no-sandbox'
      },
      ChromeCanary_Travis_CI: {
        base: 'ChromeCanary',
        flags: [] // '--no-sandbox'
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    browserNoActivityTimeout: 60000
  });


  // Not needed at the moment
  // if (!process.env.GithubToken) {
  //   console.log("\033[7m\033[31m****************************************************************************\033[0m");
  //   console.log("\033[7m\033[31m* You need to provide the \"GithubToken\" environment variable to run tests. *\033[0m");
  //   console.log("\033[7m\033[31m****************************************************************************\033[0m");
  //   process.exit(-1);
  // }

  // insert the github token
  fs.writeSync(
    fs.openSync("test-main.js", "w"),
    "// AUTOGENERATED, please do not edit!!! \n" +
    fs.readFileSync("test-main.template.js", "utf8")
      .replace("INSERTGITHUBTOKEN", process.env.GithubToken)
      .replace("INSERTDROPBOXTOKEN", process.env.DropboxToken)
  );

  config.browsers = ['Chrome_Travis_CI'];
};
