var webpackConfig = require('./webpack.config');
webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.postLoaders = [{
  test: /\.jsx|\.js$/,
  exclude: /(test|libs|node_modules|bower_components)\//,
  loader: 'istanbul-instrumenter'
}]

module.exports = function (config) {
  config.set({
  	// basePath: '.',
	browsers: ['chrome_large'],
  customLaunchers: {
    chrome_large: {
      base: 'Chrome',
      flags: [
          '--window-size=1100,600',
          '--window-position=-0,0'
      ]
    }
  },
	files: [
		'test/runner.coverage.js'
	],
	plugins: [
      'karma-chrome-launcher',
      'karma-chai',
      'karma-mocha',
      'karma-sourcemap-loader',
      'karma-webpack',
      'karma-coverage',
      'karma-mocha-reporter'
    ],
	frameworks: [ 'chai', 'mocha' ],
	preprocessors: {
        'test/**/*': ['webpack', 'sourcemap'],
        'src/**/*': ['webpack', 'sourcemap']
	},
  coverageReporter: {
    type : 'html',
    dir : 'coverage/'
  },
	reporters: [ 'progress', 'coverage' ],
	singleRun: true,
	webpack: webpackConfig,
	webpackServer: {
      noInfo: true
    }
  });
};