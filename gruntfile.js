module.exports = function(grunt) {
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['gruntfile.js', 'main.js', 'js/**/*.js'],
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
        ]
    });
    
    //Tasks
    grunt.registerTask('build', ['clean', 'jshint', 'copy', 'browserify']); //Generates build folder
    
    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
};