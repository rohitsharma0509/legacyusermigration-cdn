/**
 * common.js
 *
 * app-wide common code
 */

/* global Mousetrap */

(function(){

    /**
     * ns() - namespace creation
     *
     * Usage: App.ns('Some.Path').obj = ...
     *
     * @param path {string} - path under App
     * @returns {object} - created or existing namespace
     */
    App.ns = function(path){
        var o = this, period = '.';
        if (path.indexOf(period) > -1) { //Skip this if no "." is present
            var d = path.split(period);
            for (var j = 0; j < d.length; j++) {
                o[d[j]] = o[d[j]] || {};
                o = o[d[j]];
            }
        } else {
            o[path] = o[path] || {};
            o = o[path]; //Reset base object to the new object so it's returned
        }
        return o;
    };


    /**
     * inherit and extend named attribute object from parent class.  This
     * can be used for attributes that can be function, eg, 'defaults'.
     *
     * Backbone doesn't provide a build-in method to propagate inheritance
     * of attributes.
     *
     * @param attrName {string} - name of attribute to be inherited (could be
     *   an object or a function returning an object)
     * @param obj {object} - extend object
     * @return {function} a function that returns a new inherited object
     *
     * Note: if attrName is given as the SECOND argument, it takes precedence over obj properties.
     */
    App.Views.inherit = App.Models.inherit = function(attrName, obj) {
        return function(){
            if (_.isString(attrName)) {
                // obj precedence
                return _.deepClone(_.extend({}, _.result(this.constructor.__super__, attrName), obj));
            } else {
                // attribute precedence
                return _.deepClone(_.extend({}, attrName, _.result(this.constructor.__super__, obj)));
            }
        };
    };

    /**
     * concatenate named attribute object from parent class.  This
     * can be used for attributes that can be function, eg, 'defaults'.
     *
     * @param attrName {string} - name of attribute array to be concatenated
     * @param arr {Array} - extend object
     * @return {function} a function that returns a new concatenated array
     *
     * Note: if attrName is given as the SECOND argument,
     * array referenced by attribute name is appended to existing array.
     */
    App.Views.concat = App.Models.concat = function(attrName, arr) {
        return function() {
            if (_.isString(attrName)) {
                // prepend array to existing array.
                return (_.result(this.constructor.__super__, attrName)).concat(arr);
            } else {
                // append array to existing array.
                return attrName.concat(_.result(this.constructor.__super__, arr));
            }
        };
    };

    /**
     * override a method for mixin - this wraps the mixin method and
     * provides the original method as the last argument.
     *
     * Useful for mixins (not subclassing).
     *
     * Usage:
     *
     * _.extend(Proto, {
     *   initialize: App.Models.override(Proto.initialize, function() {
     *      var initialize_orig = _(arguments).last();
     *      initialize_orig();
     *      // mixin override here...
     *    }),
     *    ...
     *  });
     *
     *  @param orig {function} - original function being overridden
     *  @param replacement {function} - the replacement function
     *  @return {function} the wrapped replacement with orig as last argument
     */
    App.Views.override = App.Models.override = function(orig, replacement) {
        return function(){
            return replacement.apply(this, _(arguments).push( _.bind(orig, this)));
        };
    };

    /**
     * ensure a method is called one-at-a-time (i.e., singly).  This
     * is useful for methods than return a Promise.  While the Promise
     * is outstanding, multiple calls to the same method are not executed.
     *
     * Note: each class has a single lock, so the use of this for multiple
     * methods within a class locks all such methods until the lock is cleared.
     *
     * @type {App.Models.singly}
     * @param fn {function} the function returning a Promise to singly-ify
     * @prarm delay {[number]} time to delay unlocking (default: see unlockDelay)
     * @return {function} singly-ified function
     */
    App.Views.singly = App.Models.singly = function(fn, delay) {
        if (arguments.length < 2) delay = App.Views.singly.unlockDelay;
        return function (/* arguments */) {
            var self = this,
                delayedDone = function (result, arg2) {
                    return new Promise(function(resolve, reject) {
                        _.delay(function () {
                            self.unlock();
                            result === '__was_rejected__' ? reject(arg2) : resolve(result);
                        }, delay);
                    });
                },
                result;

            // don't execute if we can't get a lock
            if (!this.lock()) return;

            // if fn throws, unlock the method
            try {
                result = fn.apply(this, arguments);
            } finally {
                if (result && _.isFunction(result.then)) {
                    return result.then(delayedDone, _.partial(delayedDone, '__was_rejected__'));
                }
                // "resolve" now in case of exception or if no promise was returned (defeats the purpose of the lock!)
                this.unlock();
            }

            return result;
        };
    };

    /**
     * time in msec to delay unlocking a class after promises are resolved/rejected.
     * This generally prevents a duplicate UI action (e.g., click a submit button) while
     * the success handler is being processed.
     *
     * @type {number}
     */
    App.Views.singly.unlockDelay = App.Models.singly.unlockDelay = 500;

    /**
     * lock the class.  Effectively functions as a mutex.
     *
     * Usage: to prevent multiple executions
     *
     *   if (!this.lock()) return;
     *   // else ok to continue
     *
     * @return {boolean} true if able to got a lock, false if already locked
     */
    Backbone.View.prototype.lock =
        Backbone.Model.prototype.lock =
            Backbone.Collection.prototype.lock = function() {
                return !this._locked && (this._locked = true);
            };

    /**
     * unlock a class - releases the lock.
     */
    Backbone.View.prototype.unlock =
        Backbone.Model.prototype.unlock =
            Backbone.Collection.prototype.unlock = function() {
                this._locked = false;
            };

    /**
     * enable a view to have a spinner.  A spinner will be centered in the view and shown by default.
     *
     * If render() method replaces the html, it will also remove the spinner.  enableSpinner()
     * can be called again to re-attach it.
     *
     * Exposes additional methods: toggleSpinner(), showSpinner(), and hideSpinner()
     *
     * @param opts {object} (optional) - hash:
     *    classes {string} - '', 'large', 'process' or custom class
     *    show {boolean} - initial visibility (default: true)
     *    container {jQuery} - container to place spinner in, otherwise this.$el
     */
    Backbone.View.prototype.enableSpinner = function( opts ) {
        var tmpl = '<div class="view-spinner spinner {{classes}}" style="display:{{show ? "block" : "none"}}" role="progressbar"> </div>',
            container = opts && opts.container || this.$el;

        opts = _.defaults(opts || {}, {
            classes: 'large',
            show: true
        });

        jQuery(container).append(_.template(tmpl)(opts));

        this.toggleSpinner = function(toggle) {
            this.$('.view-spinner').toggle(toggle);
        };
        this.showSpinner = _.partial(this.toggleSpinner, true);
        this.hideSpinner = _.partial(this.toggleSpinner, false);
    };

    /**
     * utility function on Backbone.View - enable placeholder
     * for the view if not natively supported by browser.  This can
     * be called in a view's initialize() to automatically apply
     * the plugin after the view is rendered.
     *
     * Requires jquery.placeholder.js plugin
     *
     * @param now {boolean} - apply the placeholder now.  Otherwise it is
     *   applied after render.
     */
    Backbone.View.prototype.enablePlaceholder = function( now ) {
        var sel = 'input[placeholder], textarea[placeholder]',
            opts = {force : false};

        if (now) {
            this.$(sel).placeholder(opts);
        }
        else if (!App.Env.feature.placeholder) {
            // override render function and apply placeholder
            var render = this.render;
            this.render = function() {
                var result = render.apply(this, arguments),
                    nodes = this.$(sel);

                // enable placeholders
                nodes.placeholder(opts);

                // handled disabled inputs (they don't fire change event from plugin)
                // (eg, signature/initials fields)
                nodes.filter('[disabled]').on('change', function(){
                    jQuery(this).triggerHandler('blur.placeholder');
                });

                // onpropertychange handler in the plugin fires a 'focus.placeholder' event.
                // jQuery fires the 'focus' event (sans namespace) -- which messes up cloned fields.
                // override onpropertychange to only trigger the correct handler.  Defer is needed
                // because plugin uses setTimeout.
                _.defer(function(){
                    nodes.each(function(){
                        this.onpropertychange = function() {
                            jQuery(this).triggerHandler('blur.placeholder');
                        };
                    });
                });

                return result;
            };
        }
    };

    /**
     * Utility function on Backbone.View - handle keyboard event to navigate items
     * within the view using arrow keys as if they were contained within a menu or toolbar.
     *
     * If no itemSelector is specified, keyboard event will navigate all focusable descendants of the view.
     *
     * If no menuSelector is specified, navigation will be constrained to the backbone view itself.
     *
     * @param event {KeyboardEvent} - the keyboard event to handle
     * @param itemSelector {Object} - jQuery selector for item elements, when undefined navigate all focusable descendants of the view
     * @param menuSelector {Object} - jQuery selector for the container element wrapping the item elements, when undefined, use the backbone view itself
     * @param loop {Boolean} - loop to start or end on last or first item
     */
    Backbone.View.prototype.navigateAsMenuOrToolbar = function( event, itemSelector, menuSelector, loop ) {
        var KEY = App.Utils.KEY,
            $target = jQuery(event.target),
            which =  event.which || event.keyDown,
            $menu = !menuSelector ? this.$el : this.$(menuSelector),
            $items = !itemSelector ? $menu.find(':focusable') : $menu.find(itemSelector).filter(':focusable'),
            index = $items.index($target),
            preventDefault = false,
            $focusable;

        switch (which) {
            case KEY.HOME:
                $focusable = $items.first();
                break;
            case KEY.END:
                $focusable = $items.last();
                break;
            case KEY.LEFT:
            case KEY.UP:
                $focusable = $items.filter(':lt(' + index + '):last');
                if (loop && !$focusable.length) {
                    $focusable = $items.last();
                }
                break;
            case KEY.DOWN:
            case KEY.RIGHT:
                $focusable = $items.filter(':gt(' + index + '):first');
                if (loop && !$focusable.length) {
                    $focusable = $items.first();
                }
                break;
        }

        if ($focusable) {
            $focusable.focus();
            preventDefault = true;
        }

        if (preventDefault) {
            event.preventDefault();
        }
    };


    /**
     * override Backbone's fetch method not to clobber error handler.
     * This is necessary for DWR interface.   @see FB 40683
     *
     * @param options {object} - @see Backbone.Model's fetch()
     * @return  @see Backbone.Model's fetch()
     */
    Backbone.Model.prototype.fetchOrig = Backbone.Model.prototype.fetch;
    Backbone.Model.prototype.fetch = function(options) {
        options = options || {};

        /**
         * @type {boolean} true if no error handler was provided by the caller
         */
        options.noErrorHandler = ! _.isFunction(options.error);

        /**
         *
         * @type {boolean} true for Backbone sync() CRUD operations
         */
        options.CRUD = true;

        return this.fetchOrig(options);
    };

    /**
     * add reset() to Backbone.Model.  Note 'id' attribute is kept.
     *
     * Unlike Backbone.Collection's native reset, no 'reset' event is fired.
     *
     * @param attrs {object} - hash of any new attributes to set, otherwise set to defaults
     * @param options {object} - options to pass to set()
     * @returns {this}
     */
    Backbone.Model.prototype.reset = function(attrs, options) {
        var opts = _.defaults(options || {}, {silent: true}),
            idkey = this.idAttribute,
            allAttrs = _.defaults(attrs || {}, this.defaults);

        // keep old id if none was specified
        if (!(idkey in allAttrs) && idkey in this.attributes) allAttrs[idkey] = this.attributes[idkey];

        return this.clear(opts).set(allAttrs, opts);
    };

    /**
     * helper method - calls super and merges results
     *
     * @param results {array|object} - results (typically from derived class) to be merged with super results
     * @param superFn {function} - the super to call. This is normally passed in as this._super, but
     *    can also be the base prototype method if you want to skip the intermediate supers.
     * @param super args, ...., options {object} - rest of args is passed to super.  Last arg is treated as options:
     *     options.allowEmpty - set to true to allow empty arrays (by default, arrays are compacted and
     *           empty results returned as null)
     * @returns {array|object|null}
     */
    Backbone.Collection.prototype.andSuper =
        Backbone.View.prototype.andSuper =
            Backbone.Model.prototype.andSuper = function andSuper(results, superFn /* superArgs, ... */) {
                var options = arguments.length > 2 && _.last(arguments) || {},
                    superResults = superFn.apply(this, _.rest(arguments, 2));

                if (_.isArray(results)) {
                    results = results.concat(superResults);
                    if (options.allowEmpty) return results;

                    // clear empties - return null if empty (this pattern is used by validate())
                    results = _.compact(results);
                    return results.length && results || null;
                }
                else if (_.isObject(results)) {
                    return _.extend(results, superResults);
                }
                else if (!results) {
                    return superResults;
                }

                // else: concat?
                return results + superResults;
            };

    /**
     * Redefine Backbone.View constructor
     *
     * 1 - add App event delegation
     * 2 - Attach options passed to the constructor as this.options since
     *     views no longer automatically attach it since version 1.1.0
     */
    var BackboneView = Backbone.View,
        BackboneView_remove = BackboneView.prototype.remove;


    Backbone.View = Backbone.View.extend({

        constructor: function (options) {

            //Give Backbone views this.options
            this.options = options || {};

            // pick template from options
            _.extend(this, _.pick(this.options, 'template'));

            // delegate app events before the constructor so
            // they can be stopListening() to in initialize().
            this.delegateAppEvents();

            // if we have a model passed to the constructor, handle model events
            if (this.options.model) {
                this.model = this.options.model;
                this.delegateModelEvents();
            }

            // delegate key events
            this.delegateKeyEvents();

            // cache of sub views to be cleaned up
            this._subViews = [];

            BackboneView.apply(this, arguments);
        }
    });


    _.extend(Backbone.View.prototype, {

        /**
         * the view template
         * @type {string|function}
         */
        template: '',

        /**
         * request animation frame method for Backbone views.
         * Requires shim for IE8 & IE9.
         */
        __frameTicks : {},

        /**
         * execute a method/function at next animation frame. Prevents queuing
         * multiple requests.
         *
         * Caveat: only one anonymous function can be used at a time.  Use a named function or method name.
         *
         * @param fn {string|function} - method name in current class to execute or a function
         * @param [context=this] {object} - context in which to execute fn
         * @param args... - additional arguments to pass to method
         * @return {number} request id
         * @example
         *     this.requestFrame('render')          // execute method render of current object
         *     this.requestFrame(this.render, this) // execute this.render in this context
         *     this.requestFrame(this.render)       // same as above
         *     this.requestFrame(function blah(){}) // execute immediate named function
         */
        requestFrame: function(fn, context /*, args */ ){
            var
                handler = fn,
                name = _.isString(fn) ? (handler = this[fn], fn)
                    : fn && fn.name ? fn.name
                        : '__anonymous_fn__',
                ticks = this.__frameTicks,
                args = _(arguments).rest(2), // drop first two
                self = this;

            // return if already requested
            if (name in ticks && ticks[name]) return;

            return ticks[ name ] = window.requestAnimationFrame(function(){
                // reset ticking flag
                delete ticks[ name ];

                // execute function
                handler.apply(context || self, args);
            });
        },

        /**
         * delegate App events -- reads view's 'appEvents' member and attaches to App.EventBus.
         * This is called by the overridden Backbone.View constructor.  Events are unlistenTo by remove().
         *
         * @param events {object} - {eventName: methodName} or {eventName: function},
         *                      eg. {'agreement:resize' : 'onResize'}  Method is bound to view.
         * @returns {Backbone.View}
         */
        delegateAppEvents: function(events) {
            if (!(events || (events = _.result(this, 'appEvents')))) return this;
            for (var key in events) {
                var method = events[key];
                if (!_.isFunction(method)) method = this[events[key]];
                if (!method) throw new Error('Method "' + events[key] + '" does not exist');
                var eventName = key;
                method = _.bind(method, this);
                this.listenTo(App.EventBus, eventName, method);
            }
            return this;
        },

        /**
         * delegate model events as defined in 'modelEvents' property of the view.
         * These are auto-cleaned up by remove().
         *
         * @param events {object} - same as appEvents.
         * @returns {Backbone.View}
         */
        delegateModelEvents: function(events) {
            if (!(events || (events = _.result(this, 'modelEvents')))) return this;
            for (var key in events) {
                var method = events[key];
                if (!_.isFunction(method)) method = this[events[key]];
                if (!method) throw new Error('Method "' + events[key] + '" does not exist');
                var eventName = key;
                method = _.bind(method, this);
                this.listenTo(this.model, eventName, method);
            }
            return this;
        },

        /**
         * delegate key events (Mousetrap must be loaded).  Will also log to
         * analytics unless this.disableKeyEventAnalytics is true.
         *
         * @param events {object} (optional) event hash to bind or uses this.keyEvents
         * @returns {Backbone.View}
         */
        delegateKeyEvents: function(events) {
            if (!window.Mousetrap) return this;
            if (!(events || (events = _.result(this, 'keyEvents')))) return this;

            if (!this._mousetrap) {
                this._mousetrap = new Mousetrap();
            }

            for (var key in events) {
                var method = events[key];
                if (!_.isFunction(method)) method = this[events[key]];
                if (!method) throw new Error('Method "' + events[key] + '" does not exist');
                method = _.bind(method, this);

                this._mousetrap.bind(key, this.disableKeyEventAnalytics
                    ? method
                    : _.compose(_.debounce(logEvent, 750, true), _.wrap(method, wrapper)));
            }

            // local wrapper function
            function wrapper(fn, ev, keyCombo) {
                fn.apply(null, _.rest(arguments));
                return keyCombo;
            }

            function logEvent(keyCombo) {
                // without defer can miss up page scroll events!
                _.defer(ScAnalytics.logEvent, ['shortcut:' + keyCombo.replace(/\s+/g, '_')]);
            }

            return this;
        },

        /**
         * undelegate all bound key events
         *
         * @returns {Backbone.View}
         */
        undelegateKeyEvents: function() {
            if (this._mousetrap) {
                this._mousetrap.reset();
                delete this._mousetrap;
            }
            return this;
        },

        // save original stop listening
        _stopListeningOrig: Backbone.View.prototype.stopListening,

        // override base class method to clear key events
        stopListening: function(){

            // call original
            this._stopListeningOrig.apply(this, arguments);

            // clean up keyEvents, if any
            this.undelegateKeyEvents();
            return this;
        },

        // remove sub views, if any
        remove: function() {
            if (this._subViews) {
                _(this._subViews).invoke('remove');
                this._subViews = [];
            }
            return BackboneView_remove.apply(this, arguments);
        },

        /**
         * equality check
         *
         * @param view {View} view to check against this
         * @return {boolean} true if views are the same (ie, have same cid)
         */
        is: function(view){
            return view && view.cid === this.cid;
        },

        /**
         * this will be called after view has been attached to DOM.
         * @return {this}
         */
        postRender: function(){
            return this;
        },

        /**
         * render and append to a container.  Calls postRender if defined. (inversion of control pattern).
         *
         * @param container {jQuery}
         * @param options {object} - if options.replace is true replace content of container rather than appending to it
         * @return {this}
         */
        renderInto: function(container, options){
            this.render();
            if (options && options.replace) {
                jQuery(container).replaceWith(this.el);
                this.postRender();
            } else {
                this.appendTo(container);
            }
            return this;
        },

        /**
         * append view to a container
         *
         * @param container (jQuery)
         * @return {this}
         */
        appendTo: function(container){
            jQuery(container).append(this.el);
            this.postRender();
            return this;
        },

        /**
         * base render function -- if a template is available, render it into the view's element.
         * Derived classes should not call this._super() unless they specifically want
         * this functionality.
         *
         * @returns {Backbone.View}
         */
        render: function(){
            var html;
            if (this.template) {
                html = this.toHTML();

                if (!this.options.el) {
                    this.$el.html(html);
                } else {
                    // existing element was given -- append
                    this.$el.append(html);
                }
            }
            return this;
        },

        /**
         * projection of view to data used in template
         *
         * @returns {object}
         */
        toTemplate: function(){
            return {};
        },

        /**
         * projection of view rendered to HTML via the template
         *
         * @returns {string}
         */
        toHTML: function(){
            var data = this.toTemplate();
            return _.isFunction(this.template) ? this.template(data) : _.template(this.template)(data);
        },

        /**
         * render a view and append to this.$el.  Alternatively replace a named <section />.
         * Added views are queued for clean up.
         *
         * @param view {View}
         * @param options {object | string | jQuery} - container element to add to, otherwise this.$el
         *   options.replaceSection {string} - if given, replaces <section name />
         * @return {this}
         */
        addView: function(view, options) {
            var container;

            if (!options) {
                container = this.$el;
                options = {};
            }
            // replace section
            else if (options.replaceSection) {
                container = this.$('section['+ options.replaceSection +']');
            }
            else {
                container = jQuery(options)
            }

            view.renderInto(container, {
                replace: !!options.replaceSection
            });
            this._subViews.push(view);
            return this;
        }

    });


    /**
     * iOS keyboard fix for position:fixed elements.
     *
     * This puts the 'keyboard-open' class on the body when the keyboard is open.  Use CSS
     * to fix broken elements.
     *
     * @see bug 35901
     */
    App.Env.feature.iOS && (function() {
        var KEYBOARD_OPEN_CLASS = 'keyboard-open',
            KEYBOARD_TOGGLE_DELAY = 50,
            last_keyboard_shown = null,
            keyboard_shown,
            handler;

        handler = _.debounce(function(ev) {

            // check 'focus' and 'focusin' events
            keyboard_shown = ev.type === 'focus' || ev.type === 'focusin';

            // don't trigger event if keyboard state didn't change
            if (last_keyboard_shown === keyboard_shown) return;
            //console.log(ev.type, 'keyboard is ' + (keyboard_shown ? 'up' : 'down'), ev.target.className);

            // if in an iframe, return
            if (window.top !== window.self) return;

            jQuery('body').toggleClass(KEYBOARD_OPEN_CLASS, keyboard_shown);
            last_keyboard_shown = keyboard_shown;

            App.Utils.fixiOSHeaderWidth();
            App.EventBus.trigger('device:keyboardChange', {visible: keyboard_shown});
        }, KEYBOARD_TOGGLE_DELAY);

        // on ready, attach event for keyboard
        // Signature panel opens in full screen mode on iOS -- don't trigger keyboard mode.
        jQuery(function() {
            jQuery('body').on('focus blur', 'input[type=text]:not([readonly]):not(.signature-name), textarea', handler);
        });

    })();


    /**
     * add class 'mobile', 'ieLt10', 'reduced-font-lang' & 'iOS' to html -- allows css filtering
     */
    jQuery(function(){
        var cssFilterClass = [];

        App.Env.feature.isMobileBrowser && cssFilterClass.push('mobile');
        App.Env.feature.isPhone && cssFilterClass.push('phone');
        App.Env.feature.ieLt10 && cssFilterClass.push('ieLt10');
        App.Env.feature.iOS && cssFilterClass.push('iOS');
        App.Env.feature.mozilla && cssFilterClass.push('moz');

        if (_.contains(['ja_JP','zh_CN','zh_TW','th_TH','ko_KR'], App.Env.resolvedLocale)) {
            cssFilterClass.push('reduced-font-lang');
        }
        jQuery('html').addClass(cssFilterClass.join(' '));


        // IE9 doesn't support transition which causes timing issues on some event callbacks (e.g., hidden.bs.modal).
        // Define a faux event to preserve timing.  This is used by Bootstrap.
        if (jQuery.support && ! jQuery.support.transition) {
            jQuery.support.transition = {end: 'transitionend_IE9_dummy'};
        }

    });

    /**
     * requestAnimationFrame shim for IE8 & IE9
     */
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    // MIT license
    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    /** override part of jQuery ui sortable widget method _contactContainers, causing 'flashing' of placeholder and
     *  sortable
     *  elements jumping to the top in nested containers. See line 682 for start of overriden calculation
     *
     *  Note: reused code from 11.9.2 as this is a regression bug
     * */
    (function ($) {

        $.widget( "ui.sortable", $.ui.sortable, {
            _contactContainers: function(event) {
                var i, j, dist, itemWithLeastDistance, posProperty, sizeProperty, base, cur, nearBottom, floating, axis,
                    innermostContainer = null,
                    innermostIndex = null;

                // get innermost container that intersects with item
                for (i = this.containers.length - 1; i >= 0; i--) {

                    // never consider a container that's located within the item itself
                    if($.contains(this.currentItem[0], this.containers[i].element[0])) {
                        continue;
                    }

                    if(this._intersectsWith(this.containers[i].containerCache)) {

                        // if we've already found a container and it's more "inner" than this, then continue
                        if(innermostContainer && $.contains(this.containers[i].element[0], innermostContainer.element[0])) {
                            continue;
                        }
                        innermostContainer = this.containers[i];
                        innermostIndex = i;

                    } else {
                        // container doesn't intersect. trigger "out" event if necessary
                        if(this.containers[i].containerCache.over) {
                            this.containers[i]._trigger("out", event, this._uiHash(this));
                            this.containers[i].containerCache.over = 0;
                        }
                    }

                }

                // if no intersecting containers found, return
                if(!innermostContainer) {
                    return;
                }

                // move the item into the container if it's not there already
                if(this.containers.length === 1) {
                    if (!this.containers[innermostIndex].containerCache.over) {
                        this.containers[innermostIndex]._trigger("over", event, this._uiHash(this));
                        this.containers[innermostIndex].containerCache.over = 1;
                    }
                } else {


                    // START OVERRIDE

                    //When entering a new container, we will find the item with the least distance and append our item near it
                    dist = 10000,
                        itemWithLeastDistance = null,
                        posProperty = this.containers[innermostIndex].floating ? 'left' : 'top',
                        sizeProperty = this.containers[innermostIndex].floating ? 'width' : 'height',
                        base = this.positionAbs[posProperty] + this.offset.click[posProperty];

                    for (j = this.items.length - 1; j >= 0; j--) {
                        if ((!$.contains(this.containers[innermostIndex].element[0], this.items[j].item[0])) && (this.items[j].item[0] == this.currentItem[0])) continue;

                        cur = this.items[j].item.offset()[posProperty];
                        nearBottom = false;

                        if(Math.abs(cur - base) > Math.abs(cur + this.items[j][sizeProperty] - base)){
                            nearBottom = true;
                            cur += this.items[j][sizeProperty];
                        }

                        if(Math.abs(cur - base) < dist) {
                            dist = Math.abs(cur - base); itemWithLeastDistance = this.items[j];
                            this.direction = nearBottom ? "up": "down";
                        }
                    }

                    // END OVERRIDE

                    //Check if dropOnEmpty is enabled
                    if(!itemWithLeastDistance && !this.options.dropOnEmpty) {
                        return;
                    }

                    if(this.currentContainer === this.containers[innermostIndex]) {
                        if ( !this.currentContainer.containerCache.over ) {
                            this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash() );
                            this.currentContainer.containerCache.over = 1;
                        }
                        return;
                    }

                    itemWithLeastDistance ? this._rearrange(event, itemWithLeastDistance, null, true) : this._rearrange(event, null, this.containers[innermostIndex].element, true);
                    this._trigger("change", event, this._uiHash());
                    this.containers[innermostIndex]._trigger("change", event, this._uiHash(this));
                    this.currentContainer = this.containers[innermostIndex];

                    //Update the placeholder
                    this.options.placeholder.update(this.currentContainer, this.placeholder);

                    this.containers[innermostIndex]._trigger("over", event, this._uiHash(this));
                    this.containers[innermostIndex].containerCache.over = 1;
                }


            }
        });
    })(jQuery);


})();