module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {sourceMap: true, sourceMapStyle: 'link', separator: ';'},
      livelyLang: {
        src: ['lib/base.js',
              'lib/events.js',
              'lib/object.js',
              'lib/collection.js',
              'lib/tree.js',
              'lib/graph.js',
              'lib/function.js',
              'lib/string.js',
              'lib/number.js',
              'lib/date.js',
              'lib/class.js',
              'lib/messenger.js',
              'lib/worker.js'],
        dest: 'lively.lang.dev.js'
      }
    },

    uglify: {
      livelyLang: {
        options: {
          sourceMap: true,
          banner: '/*! <%= pkg.name %>-v<%= pkg.version %> '
                + '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {'lively.lang.min.js': 'lively.lang.dev.js'}
      }
    }

  });

  grunt.task.registerTask('generateDoc', function() {
    var files = [
      "lib/class.js",
      "lib/collection.js",
      "lib/date.js",
      "lib/events.js",
      "lib/function.js",
      "lib/graph.js",
      "lib/messenger.js",
      "lib/number.js",
      "lib/object.js",
      "lib/string.js",
      "lib/tree.js",
      "lib/worker.js"];
    require("./generate-doc").generateDoc({files: files}, this.async());
  });

  grunt.registerTask('build', ['generateDoc', 'concat', 'uglify']);
};
