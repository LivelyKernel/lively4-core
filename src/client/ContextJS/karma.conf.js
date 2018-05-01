// Karma configuration
// Generated on Mon May 02 2016 11:53:39 GMT+0200 (W. Europe Daylight Time)

module.exports = function(config) {
  var configuration = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['commonjs', 'mocha', 'chai'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'src/contextjs.js',
      'src/module_import.js',
      'src/Layers.js',
      'src/old-api.js',
      'tests/globalChai.js', // only needed for the import
      'tests/**/*test.js',
      'tests/**/*Tests.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/contextjs.js': ['babel', 'commonjs'],
      'src/module_import.js': ['babel', 'commonjs'],
      'src/Layers.js': ['babel', 'commonjs'],
      'src/old-api.js': ['babel', 'commonjs'],
      'tests/**/*.js': ['babel', 'commonjs'],
    },

    babelPreprocessor: {
      options: {
        presets: ['es2015'],
        plugins: ['array-includes'],
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
      modulesRoot: '.'
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
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS', 'Chrome', 'Firefox', 'IE', 'Safari', 'Opera'],
    // see below for the browsers which are run on Travis CI
    customLaunchers: {
        Chrome_no_sandbox: {
            base: 'Chrome',
            flags: ['--no-sandbox'],
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
      configuration.browsers = ['Chrome_no_sandbox', 'Firefox'];
  }
  config.set(configuration);
}
