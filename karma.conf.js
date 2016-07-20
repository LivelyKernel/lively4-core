// Karma configuration
// Generated on Mon May 02 2016 11:53:39 GMT+0200 (W. Europe Daylight Time)

module.exports = function(config) {
  var configuration = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['commonjs', 'mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'src/babelsberg/jsinterpreter/*.js',
      //'src/babelsberg/!(uglify|PerformanceTests)*.js',
      'src/*.js',
      'src/base/*.js',
      'src/ticking/*.js',
      'src/interpretation/*.js',
      'tests/**/*Helper.js',
      'tests/**/*Fixture.js',
      'tests/**/*Tests.js',
      'node_modules/stack-es2015-modules/stack.js',
      'node_modules/composite-scopes-all/index.js',
      'node_modules/composite-scopes-all/contextjs.js',
      'node_modules/composite-scopes-all/Layers.js',
      'node_modules/composite-scopes-all/copv2/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/!(acorn)*.js': ['babel', 'commonjs'],
      'tests/**/*.js': ['babel', 'commonjs'],
      'node_modules/stack-es2015-modules/!(karma)*.js': ['babel', 'commonjs'],
      'node_modules/composite-scopes-all/index.js': ['babel', 'commonjs'],
      'node_modules/composite-scopes-all/contextjs.js': ['babel', 'commonjs'],
      'node_modules/composite-scopes-all/Layers.js': ['babel', 'commonjs'],
      'node_modules/composite-scopes-all/copv2/*.js': ['babel', 'commonjs']
    },

    // proxies: {
    //   "stack-es2015-modules": "/node_modules/stack-es2015-modules/"
    // },

    babelPreprocessor: {
      options: {
        presets: ['es2015'],
        sourceMap: 'inline'
      },
      // filename: function (file) {
      //   var lastSlash = file.originalPath.lastIndexOf('/');
      //   var folder = file.originalPath.substring(0, lastSlash + 1);
      //   var basename = file.originalPath.substring(lastSlash + 1);
      //   return folder + 'es5/' + basename;
      // },
      sourceFileName: function (file) {
        return file.originalPath;
      }
    },

    commonjsPreprocessor: {
      modulesRoot: 'node_modules',
      alias : {
            'node_modules/stack-es2015-modules/stack.js': 'stack-es2015-modules'
          }
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [/*'PhantomJS', */'Chrome'/*, 'Firefox', 'IE', 'Safari', 'Opera'*/],
    // see below for the browsers which are run on Travis CI
    customLaunchers: {
        Chrome_no_sandbox: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        }
    },


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,


    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  };

  if (process.env.TRAVIS) {
      configuration.browsers = ['Chrome_no_sandbox'/*, 'Firefox'*/];
  }
  config.set(configuration);
};
