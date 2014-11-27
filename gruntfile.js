var browserify = require("browserify");
var fs = require("fs");
var mkdirp = require("mkdirp");

module.exports = function(grunt) {
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['gruntfile.js', 'index.js', 'js/**/*.js', 'tests/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        browserify: {
            'build/biojs-vis-proteome.js': ['index.js']
        },
        clean: ['build'],
        copy: [
            { expand: true, flatten: true, src: ['html/index.html'], dest: 'build/' },
            { expand: true, flatten: true, src: ['css/*'], dest: 'build/css/' },
            { expand: true, flatten: true, src: ['data/*'], dest: 'build/data/' }
        ],
        simplemocha: {
            options: {
                globals: ['expect'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'tap'
            },
            all: { src: ['tests/*.js'] }
        }
    });
    
    //Tasks
    grunt.registerTask('build', ['clean', 'jshint', 'simplemocha', 'copy', 'browserify']); //Generates build folder
    
    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-simple-mocha');


  grunt.registerTask('browserify', 'Browserifies the source', function(){
    // task is async
    var done = this.async();

    // create tmp dir
    mkdirp("build");

    var ws = fs.createWriteStream('build/biojs-vis-proteome.js');
    ws.on('finish', function () {
      done();
    });

    // expose the pv viewer
    var b = browserify({debug: true,hasExports: true});
    exposeBundles(b);
    b.bundle().pipe(ws);
  });

  // exposes the main package
  // + checks the config whether it should expose other packages
  function exposeBundles(b){
    var packageConfig = require("./package.json");

    b.add(packageConfig.main, {expose: packageConfig.name });

    // check for addition exposed packages (not needed here)
    if(packageConfig.sniper !== undefined && packageConfig.sniper.exposed !== undefined){
      for(var i=0; i<packageConfig.sniper.exposed.length; i++){
        b.require(packageConfig.sniper.exposed[i]);
      }
    }
  }
};
