/*global $, App */

/* eslint no-undef:0 */
// this var would be used in css url links so to make sure sol app works when hosted on different site
// use absolute path that should be adjusted based on env at runtime
// Note that becase of ES6 imports hoisting we need to use extra file that is included into the main file
// to guaranty that public path is set before any other imports
__webpack_public_path__ = window.App.Env.esPluginConfig.pluginHostDomain + "/";

$.cachedScript = function( url, options ) {
    // Allow user to set any option except for dataType, cache, and url
    options = $.extend( options || {}, {
        dataType: 'script',
        cache: true,
        url: url
    });

    // Use $.ajax() since it is more flexible than $.getScript
    // Return the jqXHR object so we can chain callbacks
    return $.ajax( options );
};

$.cachedScript(App.Env.esPluginConfig.pluginHostDomain + '/__VERSION__/main.js')
    .done(function() {
        // wait for DOM to be loaded, to make sure that expected elements like #mainContent is present
        $(function() {
            window.fnTeamMigrationPluginStart();
        });
    })
    .fail(function() {
        console.log('Failed to load main.js');
    });

