/* eslint-env node */

var webpack = require('webpack'),
  webpackConfig = require('./webpack.config.js');

module.exports = function (grunt) {

  grunt.initConfig({
    clean: {
      build: ['dist/**']
    },

    copy: {
      assets: {
        files: [{
          // This is to copy css files
          expand: true,
          cwd: '.',
          src: ['css/**'],
          dest: './dist/__VERSION__/'
        }]
      },
      top_level: {
        files: [{
          expand: true,
          cwd: '.',
          src: ['index.html'],
          dest: './dist/'
        }]
      },
      lang_files: {
        files: [{
          cwd : './js',
          expand: true,
          src: ["nls/**"],
          dest: "./dist/__VERSION__/"
        }]
      },
      bundle: {
        files: [{
          expand: false,
          src: ["./js/team-migration-bundle.js"],
          dest: "./dist/team-migration-bundle.js"
        }]
      }
    },
    webpack: {
      options: webpackConfig,
      build: {
        devtool: 'source-map',
        plugins: [
          new webpack.optimize.UglifyJsPlugin({
            compress: {warnings: false}
          }),
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
          })
        ]
      },

      'build-dev': {
        devtool: 'inline-source-map'
      }
    },

    karma: {
      unit: {
        configFile: './karma.conf.js'
      }
    }
  });

  // Load Grunt task modules (prefixed with 'grunt-'):
  require('load-grunt-tasks')(grunt, {
    pattern: [
      'grunt-*',
      '!grunt-timer'
    ]
  });

  grunt.registerTask('clean-all', ['clean:build']);

  // Production build
  grunt.registerTask('build', [
    'clean-all',
    'copy:top_level',
    'copy:assets',
    'copy:lang_files',
    'copy:bundle',
    'webpack:build'
  ]);

  // dev build with un-minified dc-signature-panel-bundle.js
  grunt.registerTask('build-dev', [
    'clean-all',
    'copy:top_level',
    'copy:assets',
    'copy:lang_files',
    'copy:bundle',
    'webpack:build-dev'
  ]);

  grunt.registerTask('test', [
    'karma:unit'
  ]);
};
