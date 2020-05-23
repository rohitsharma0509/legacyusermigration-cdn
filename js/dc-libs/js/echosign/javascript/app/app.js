/*!
 * Adobe Sign
 * Copyright 2016 Adobe Systems Incorporated.
 */

/**
 * app.js
 */

/* global require */
var Backbone = require('backbone');
var _ = require('underscore');

(function(App){

    App.Views = {};

    App.Models = {};

    App.Collections = {};

    App.Templates = {};

    /**
     * instance of main app view
     */
    App.appView = {};

    /**
     * event truck
     */
    App.EventBus = _.extend({}, Backbone.Events);

    /**
     * ajax services (DWR)
     */
    App.Service = {};

    /**
     * REST api services
     */
    App.Api = {};

    /**
     * debug methods
     */
    App.Debug = {};

})(window.App = window.App || {});
