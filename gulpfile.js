/*
|--------------------------------------------------------------------------
| CONFIGURE PATHS
|--------------------------------------------------------------------------
| Points to the external file where we define all our file locations
|
*/

var path = require('./gulp.path')();

/*
|--------------------------------------------------------------------------
| REQUIRE GULP PACKAGES
|--------------------------------------------------------------------------
| Look into the node_modules folder and find a package named ('gulp-package')
| Once found, assign the contents to a variable name 'package'.
|
*/

var gulp = require('gulp');

// SASS
// Requires the gulp-sass plugin
var sass = require('gulp-sass');

// Cache to avoid repeating extremely slow process of optimizing images unecessarilly
var cache = require('gulp-cache');

// CSS 
// Inline css
var inlineCss = require('gulp-inline-css');
var inline = require('gulp-inline');

// REPLACE 
var replace = require('gulp-replace');

// DATA
// A gulp plugin for deep-merging multiple JSON files into one file. Use with image-size-export
var merge = require('gulp-merge-json');

// HTML
// Tidy/readable markup
var prettify = require('gulp-jsbeautifier');

// Minify HTML and CSS
var htmlmin = require('gulp-htmlmin');

// TEMPLATING
// Require nunjucks for templating
var nunjucksRender = require('gulp-nunjucks-render');

// We have to tweak the nunjucks task slightly to use data from this data.json file. To do so, we need to use to the help of another gulp plugin called gulp-data.
var data = require('gulp-data');

// Provides simple file renaming methods.
var rename = require("gulp-rename");

// NOTIFICATIONS
// Enables Gulp to notify us through the Notifications Center (Mac)
var notify = require('gulp-notify');

// Error Prevention for multiple plugins
var plumber = require('gulp-plumber');

// Get Rid of Comments
// const removeCode = require('gulp-remove-code');
var stripCode = require('gulp-strip-code');

/*
|--------------------------------------------------------------------------
| REQUIRE OTHER PACKAGES
|--------------------------------------------------------------------------
|
*/

// SERVER 
// Live-reloading - browsers are refreshed automatically whenever a file is saved.
var bs = require('browser-sync').create();

// Alt live reload
var livereload = require('gulp-livereload');
// Test livereload vs browsersync
var watch = require('gulp-watch');

// So we can run tasks in sequence as Gulp otherwise activates tasks simultaneously.
// var runSequence = require('run-sequence');
const runSequence = require('gulp4-run-sequence');


// Clear Files
var del = require('del');

// Clear contents of data.json
var fs = require('fs')

/*
|--------------------------------------------------------------------------
| FUNCTIONS
|--------------------------------------------------------------------------
*/

// ERROR PREVENTION
// --------------------------------------------------
// Preventing Sass errors from breaking gulp watch
function customPlumber(errTitle) {
    return plumber({
        errorHandler: notify.onError({
            // Customizing error title
            title: errTitle || "Error running Gulp",
            message: "Error: <%= error.message %>",
            sound: "Glass"
        })
    });
}


// CLEAN FOLDERS 
// --------------------------------------------------
// done is a callback to ensure that the clean task is 'done' before the proceeding task runs
function clean(path, done) {
  del(path, done);

}

function done() {
  console.log('cleaned folders')  
}

// Clean CSS, data, dev templates, dist templates
gulp.task('folders:clean', function(done) {
  var css_src = path.css_src;
  var css_template = path.css_template;
  var dev_email = path.html_dev_template;
  var minified = path.minified;
  var email = path.email;

  clean(css_src, done); 
  clean(css_template, done); 
  clean(dev_email, done);
  clean(minified, done);
  clean(email, done);

  fs.truncate('./src/data/data.json', 0, done);

  // done();

});

gulp.task('data_src:clean', function(done) {

  clean(['./src/data/campaign/*.json'], done); 
});

// De-caching for Data files
// https://github.com/colynb/gulp-data/issues/17
function requireUncached( $module ) {
    delete require.cache[require.resolve( $module )];
    return require( $module );
}




// INITIATE SERVER 
// --------------------------------------------------
// var reload = bs.reload;
gulp.task('browserSync', function() {

  bs.init({
    server: {
      baseDir: 'src',
      port: 3000
      
      // Browsersync can watch your files as you work. Changes you make will either be injected into the page (CSS & images) or will cause all browsers to do a full-page refresh.
      // files: ["src/css/style.css", "src/index.html"]

    // Clicks, Scrolls & Form inputs on any device will be mirrored to all others.
      // ghostMode: {
     //  clicks: true,
     //  forms: true,
    //   scroll: false
      

    }
  });
    //  bs.reload("index.html");
    // gulp.watch("*.html").on("change", bs.reload); // still needed?
});


// WATCH  
// --------------------------------------------------
gulp.task('watch', gulp.series('browserSync'), function(){
     // when sass files are edited sass task will rerun and browser will reload automatically
    //  gulp.watch(path.sass_watch, ['rebuild']);
     // when page index is edited template task will rerun and browser will reload automatically
    //  gulp.watch(path.njks_pages, ['rebuild']);
    //  gulp.watch(path.njks_temp, ['rebuild']);
    //  gulp.watch(path.data_src, ['rebuild']);
    
    gulp.watch(path.css_src).on('change', bs.reload);
  // when template index is edited browser will reload automatically
  // Watch any files in html_dev_template, reload on change
  gulp.watch([path.html_dev_template]).on('change', bs.reload);


});



// COMPILE DATA 
// --------------------------------------------------
// Merge images.json into data.json
gulp.task('data:comp', function() {

  gulp
    .src(['src/data/campaign/*.json', 'src/data/config/*.json'])
    .pipe(merge('src/data/data.json'))
    .pipe(gulp.dest('./'))
    .pipe(notify({ message: 'data:comp task complete' }));
});



// COMPILE SASS
// --------------------------------------------------
gulp.task('sass', function() {
// Gets all files ending with .scss // in src/scss and children dirs
    return gulp
        .src(path.sass_src)
        // Checks for errors all plugins
        .pipe(customPlumber('Error Running Sass'))
        .pipe(sass({
          precision: 2 // Sets precision to 2 (see OPTIONS below)
          }))
        .pipe(gulp.dest('src/css'))
        .pipe(gulp.dest('src/templates/css'))
        // Tells Browser Sync to reload files task is done
        .pipe(bs.stream())
        // .pipe(browserSync.reload({stream:true})); -DOESNT SEEM TO WORK!!
        .pipe(notify({ message: 'sass task complete' }));
});


// CREATE TEMPLATE
// --------------------------------------------------
// https://mozilla.github.io/nunjucks/api.html#autoescaping
// var env = nunjucks.configure('src/templates', { autoescape: false });

gulp.task('template:comp', function() {
  // Gets .html and .nunjucks files in pages
  return gulp
    .src('src/pages/**/*.+(html|njk)')
    // Adding data to Nunjucks
    .pipe( data(function(file){
         return requireUncached('./src/data/data.json');
     }))
    // Renders template with nunjucks
    .pipe(nunjucksRender({
      path: ['src/templates'] // CHECK IF THIS NEED TO BE REDEFINED or dips into the folders
    }))

    // output files in app folder
    .pipe(gulp.dest('src'))
    .pipe(bs.stream())
    .pipe(notify({ message: 'template:comp task complete' }));

});


// INJECT LINKS
// --------------------------------------------------
gulp.task('links:inject', function() {
  // Gets .html and .nunjucks files in pages
  return gulp
    .src('src/index.html')
    // Inject the macros
    .pipe(data(function() {
      return require('./src/data/data.json')
    }))
    .pipe(nunjucksRender({
      path: ['src/templates']
    }))
    // Render the macros as links
    .pipe(data(function() {
      return require('./src/data/data.json')
    }))
    .pipe(nunjucksRender({
      path: ['src/templates']
    }))
    // output files in app folder
    .pipe(gulp.dest('src'))
    .pipe(bs.stream());
});



// SAVE STYLES TO COMPILE FOLDER
// --------------------------------------------------------------------------------------------------
gulp.task('css:save-copy', function() {
    return gulp
        .src('src/css/**/*.+(html|css)')
        .pipe(gulp.dest('src/compiled/css/'))
        .pipe(notify({ message: 'css:save-copy task complete' }));
});


// REMOVE BLOCKS NOT TO BE INLINED
// --------------------------------------------------

gulp.task('css:inline-ignore', function(){
      return gulp
        .src(['src/index.html'])
        .pipe(replace('<link rel="stylesheet" href="css/resets.css">', ''))
        .pipe(replace('<link rel="stylesheet" href="css/style.css">', ''))
        .pipe(replace('<link rel="stylesheet" href="css/media-queries.css">', ''))
       .pipe(gulp.dest('src/compiled/'));
});

// INLINE CSS  !!!!!!!!!! doese not work after css:inline-ignore is run in sequence 
// --------------------------------------------------
gulp.task('css:inline', function() {
    return gulp
        .src('src/compiled/index.html')
        .pipe(inlineCss({
            applyStyleTags: true,
            applyLinkTags: true,
            removeStyleTags: true,
            removeLinkTags: true
        }))
        .pipe(gulp.dest('src/compiled/'));
});


// INJECT CSS RESETS & MEDIA QUERIES & OUTLOOK BODY TAGS 
// injects the 'ignored' css to style block 
// OL body tag cause gulp watch to break so injecting them at the end
// --------------------------------------------------
gulp.task('css:inject', function() {
  // Gets .html and .nunjucks files in css
  return gulp
    .src('src/compiled/css/njk/**/*.+(html|njk)')
     .pipe(rename("index.html"))
    // Adding data to Nunjucks
    //.pipe(data(function() {
   //   return require('./src/data/data.json')
   // }))
    // Renders template with nunjucks
    .pipe(nunjucksRender({
      path: ['src/compiled/']
    }))
    .pipe(rename("index.html"))
    // output files in app folder
    .pipe(gulp.dest('src/compiled/'))
    // .pipe(bs.stream());
});

//  STRIP COMMENTS  - CSS Dev Comments
// ------------------------------------------------

const cssComments = /\/\*.+?\*\//g; // single line 
const cssAllComments = /\/\*([\s\S]*?)\*\//g; // single and multi line 
const cssDevComments = /\/\*\*.+?\*\//g; // single line dev comments starting /** 
const htmlComments = /<!--(?!<!)[^\[>].*?-->/g; // html comments not including conditional code 
const htmlDevComments = /<!---(?!<!)[^\[>].*?-->/g; // html dev comments starting <!--- not including conditional code 
const htmlAllComments = /<!--([\s\S]*?)-->/g; // html single and multi line 
const htmlAllDevComments = /<!---([\s\S]*?)-->/g; // html dev single and multi line 



gulp.task('css:comments-strip', function () {
      return gulp
        .src(['src/compiled/index.html'])
        .pipe(replace(cssAllComments, ''))
        .pipe(replace(htmlAllDevComments, ''))
       .pipe(gulp.dest('src/compiled/'));
  });
  


// TIDY HTML
// --------------------------------------------------
gulp.task('html:tidy', function() {
    return gulp
    .src(['./src/compiled/index.html'])
    .pipe(prettify())
    .pipe(gulp.dest('./dist/'));
});


// MINIFY HTML & CSS
// --------------------------------------------------
// https://github.com/kangax/html-minifier
gulp.task('html:min', function() {
  return gulp
    .src('dist/email.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      processConditionalComments: true,
      removeComments: true
  }))
    .pipe(rename('min.html'))
    .pipe(gulp.dest('./dist/'))
});




// CLEAN
// To clear the caches off your local system, you can create a separate task that's named `cache:clear`
gulp.task('cache:clear', function (callback) {
return cache.clearAll(callback)
});



/*
|--------------------------------------------------------------------------
| GULP SEQUENCES
|--------------------------------------------------------------------------
  NB: I belive need to 'return' gulp in each task in order for sequencing to work
  data task does not contain return so may need to check on that 
  NB:  a change introduced in Gulp 4. means a task cannot be defined before its dependencies hence these are at end of file
*/


// CSS COMPILE CHAIN
// --------------------------------------------------
gulp.task('compile', function (callback) {
  runSequence(
    'css:save-copy', 
    'css:inline-ignore',
    'css:inline',
    'css:inject',
    'css:comments-strip',
    'watch',
    callback
//  ^^^^^^^^
//  This informs that the sequence is complete.
  );
});

function doneFoo() {
   console.log('compile completed')
   return gulp
        .pipe(notify({ message: 'compile completed' }));      
}


// BUILD CHAIN
// --------------------------------------------------
// Using runSequence plugin, rather than chaining them with Gulp, so tasks don't need to have dependency on other tasks when run by themselves
gulp.task('build', function(callback) {
  runSequence('folders:clean', 'data', 'sass', 'template', callback);
});

// REBUILD CHAIN
// --------------------------------------------------
gulp.task('rebuild', function(callback) {
  runSequence('data', 'sass', 'template:comp', 'links:inject', 'css:inline','css:inject', 'html:tidy', 'html:min', callback);
});


// TEMPLATE CHAIN
// --------------------------------------------------
gulp.task('template', function(callback) {
  runSequence('template:comp', 'links:inject', 'css:inline','css:inject', 'html:tidy', 'html:min', 'watch', callback);
});


//  CLEAR CHAIN
// --------------------------------------------------
// gulp.task('data', ['img:data','img:host','copy:encode','data:comp']);
gulp.task('clear', function(callback) {
  runSequence('folders:clean','data_src:clean', callback);
});


// DATA CHAIN BASIC
// --------------------------------------------------
// gulp.task('data', ['img:data','img:host','copy:encode','data:comp']);
gulp.task('data', function(callback) {
  runSequence('data:comp', callback);
});

