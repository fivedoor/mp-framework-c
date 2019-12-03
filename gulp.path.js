module.exports = function () {
    var client = './dist/';
    var dev = './src/';
    var root = './';

    var path = {
        /**
         * Files paths
         */

        client: client,
        root: root,

        // SOURCE FILES
        images_src: 'src/images/**/*.+(png|jpg|gif|svg)',
        data_src: './src/data/campaign/*.json',
        sass_src: './src/scss/*.scss',

        // DEVELOPMENT
        data_output: './src/data/data.json',
        copy_encoded_output: './src/data/campaign/',
        images_data_output: './src/data/src/images/images1-local.json',
        sass_watch: 'src/scss/**/*.scss',
        css_src: './src/css/*.css',
        css_template: './src/templates/css/*.css',
        html_dev_template: 'src/*.html',
        njks_pages: 'src/pages/**/*.html',
        njks_temp: 'src/templates/**/*.html',

        // CLIENT FILES
        css: client + 'css',
        email: client + 'email.html',
        minified: client + 'min.html',

        /**
         * Node settings
         */
        defaultPort: 7203,
        nodeServer: './src/server/app.js'


    };


    return path;
};
