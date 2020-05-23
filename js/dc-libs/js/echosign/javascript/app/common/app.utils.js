/**
 * App.Utils
 *
 * app-wide utility methods
 */

(function(){

    var haveInterstitial = false,
        // Variables used by textElementPixelWidth
        LAST_WIDTH_KEY = 'lastMeasuredWidth',
        LAST_VALUE_KEY = 'lastMeasuredValue',
        textElementPixelWidthAttributes = ['font-size', 'font-family', 'font-weight', 'padding-left', 'padding-right'],
        $textElementPixelWidthDiv,
        GOOGLE_API_URL = 'https://apis.google.com/js/api.js?onload=onGApiLoaded',
        CLOSE_LABEL = i18n.common.close(),
        DETAILS_LABEL = i18n.common.details(),
        ILLEGAL_REGEX_CHARS = /[|\\{}()[\]^$+*?.]/g; // characters that need to be escaped when using regex

    var U = App.Utils = {

        /**
         * Appends or updates the existing query parameter in a URL string.
         * @param url - original url to which this update needs to happen
         * @param param - key value map which is to be updated
         * @returns {String} URL updated with the required query params
         */
        appendOrUpdateUrlParam: function(url, param) {
            var
                parser = document.createElement('a'),
                currentQueryParams,
                currentPath;
            parser.href = url;
            //removing ? from the search query
            currentQueryParams = parser.search[0] === '?' ? parser.search.substring(1) : parser.search;
            currentQueryParams = jQuery.param(_.extend(_.fromQuery(currentQueryParams), param));
            currentPath = parser.pathname === '/' ? '' :((parser.pathname.charAt(0) === '/') ? parser.pathname : '/' + parser.pathname);
            return parser.protocol + '//' + parser.host + currentPath + '?' + currentQueryParams + parser.hash;
        },

        /**
         * load images in viewport and load remaining images sequentially or onScroll
         * @param options = { threshold : 800, effect : "fadeIn", delay : 500, loadStyle : "sequential", scrollableElementToWatch : "$elements-to-watch-onscroll"}
         */
        lazyLoad : function(options){

            var $w = jQuery(window),
                th = options.threshold || 0,
                attrib = "data-src",
                images = options.images,
                delay = options.delay || 500,
                loadStyle = options.loadStyle || "onScroll";

            // images liten to 'lazyload' event once!
            images.one("lazyLoad", function() {
                var source = this.getAttribute(attrib);
                source && this.setAttribute("src", source);
                options.effect ? jQuery(this)[options.effect]() : jQuery(this).show();
            });

            function lazyload() {
                var inview, loaded;

                inview = images.filter(function() {
                    var $e = jQuery(this),
                        wt = $w.scrollTop(),
                        wb = wt + $w.height(),
                        et = $e.offset().top,
                        eb = et + $e.height();

                    return eb >= wt - th && et <= wb + th;
                });

                loaded = inview.trigger("lazyLoad");
                images = images.not(loaded);
            }

            // get what's in view
            lazyload();

            // get the rest after delay or on scroll
            if(loadStyle === "sequential"){
                _.delay(function(){ images.trigger("lazyLoad"); }, delay);
            }else {
                // load image onScroll be default
                options.scrollableElementToWatch && jQuery(options.scrollableElementToWatch).scroll(lazyload);

                $w.scroll(lazyload);
                $w.resize(lazyload);
            }
        },

        /**
         * reload current page - calls appView's reload if defined, allowing
         * the view to do any necessary tasks (saving data, turning off warnings, etc.)
         * before reloading the page.
         *
         * @params forcedReload {boolean}- @see window.location.reload
         */
        reloadPage: function(forcedReload){
            forcedReload = _.isBoolean(forcedReload) && forcedReload;

            if (App.appView && _.isFunction(App.appView.reloadPage)) {
                App.appView.reloadPage(forcedReload);
            } else {
                window.location.reload(forcedReload);
            }
        },

        /**
         * load new page url -- calls appView's if defined
         *
         * @param url {string} - url to navigate to
         */
        loadPage: function(url){
            if (App.appView && _.isFunction(App.appView.loadPage)) {
                App.appView.loadPage(url);
            } else {
                window.location.href = url;
            }
        },

        /**
         * Redirect to unsupported browser page with Current URL as OriginalUrl
         *
         * @param url {string} - url to show the user in originalURL input field
         */
        redirectToUnsupportedBrowserPage: function(url) {
            var cleanURL = encodeURIComponent(jQuery.trim(url));
            App.Utils.loadPage(App.Utils.joinUrl(App.Env.root, 'public/static/browser.jsp?originalUrl=' + cleanURL));
        },

        /**
         * load a script
         *
         * @param url {string} - url of script to load
         */
        loadScript: function(url) {
            var script = document.createElement('script');
            script.src = url;
            jQuery('head').append(script);
        },

        /**
         * load the google API - fires 'utils:gapi-loaded'
         *
         * @return {boolean} true if already loaded, false otherwise
         */
        loadGoogleApi: function() {
            if (window.gapi) return true;

            // define callback
            window.onGApiLoaded = function() {
                App.EventBus.trigger('utils:gapi-loaded');
            };

            U.loadScript(GOOGLE_API_URL);
            return false;
        },

        /**
         * validate an email
         *
         * @param email {string} - email to validate
         * @returns {boolean} - true if it's a valid email
         * all uses of this regex need to be kept in sync with regex pattern in Utils.js:isValidEmail and TextFormat.java:EMAIL
         *
         * @ref:  https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
         */
        isValidEmail : function(email) {
            "use strict";
            var tester = /^[a-zA-Z0-9!#$%&'*+/=?^_{|}~-](\.?[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-])*\@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(\.[a-zA-Z](?:[a-zA-Z-]{0,61}[a-zA-Z]))$/;
            if (!email)
                return false;

            if (email.length > 254)
                return false;

            var valid = tester.test(email);
            if (!valid)
                return false;

            // Further checking of some things regex can't handle
            var parts = email.split('@');
            if (parts[0].length > 64)
                return false;

            var domainParts = parts[1].split('.');
            if (domainParts.some(function (part) {
                    return part.length > 63;
                })) {
                return false;
            }

            return true;
        },

        /**
         * FIXME -- needs docs
         *
         * @param prefix
         * @param suffix
         * @returns {*}
         */
        joinUrl : function(prefix, suffix){
            if((prefix.lastIndexOf("/") === prefix.length - 1) &&
                (suffix.indexOf("/") === 0)){
                return prefix + suffix.substring(1);
            }
            if((prefix.lastIndexOf("/") !== prefix.length - 1) &&
                (suffix.indexOf("/") !== 0)){
                return prefix + "/" + suffix;
            }
            return prefix + suffix;
        },

        /**
         * Trimming the trailing white space from a string
         *
         * @param {String} str - String to be trimmed of trailing white space
         * @returns {String} - Trimmed string
         */
        trimTrailingWhiteSpace: function(str) {
            return str.replace(/\s+$/, '');
        },

        /**
         * Calculate the pixel size of the textarea text.  If the text value has not
         * changed since the last measurement, it will return the same value without
         * re-measuring.
         *
         * This is different that textWidth() below in that this takes into account
         * padding and margin of the element, and doesn't collapse whitespace. This
         * will also fit the placeholder if the element is empty.
         *
         * This is semi-optimized in that the same text passed in the same element
         * will by default return the cached measure from the last time; if the
         * caller changes other factors that affect measurement (like padding or
         * font size or family), they need to pass in options.force.
         *
         * @param {jQuery.element} $el or $input the text-input element to measure
         * @param {Object} options options dictating how the function behaves, as follows.
         * @param {Number} options.minWidth minimum width to return, even if the measure size is less wide
         * @param {Number} options.maxWidth maximum width to return, even if the measure size is wider
         * @param {Boolean} options.force re-measure even if it's the same value.  Used when the size or
         * other attributes change, because only the text value is compared when deciding whether
         * or not to use the last measurement.
         * @param {Number} options.comfortZone extra pixels to add to the end (default 0)
         *
         * @returns {Number} width in pixels
         */
        textElementPixelWidth: function($el, options) {

            // Use the value... or the placeholder if there is no value.
            var valToCheck = $el.val() || $el.attr('placeholder') || '',
                escaped, newWidth, testerWidth;

            // Default parameters.
            options = $.extend({
                maxWidth: 10000,
                minWidth: 0,
                comfortZone: 0
            } , options);

            // If there isn't any change, don't bother doing anything unless we're forced.
            if (!options.force && ($el.data(this.LAST_VALUE_KEY) === valToCheck)) {
                return $el.data(LAST_WIDTH_KEY);
            }

            // Gotta test this one, remember it for next time.
            $el.data(LAST_VALUE_KEY, valToCheck);

            // We have to be in the DOM somewhere in order to be measured.
            // $textElementPixelWidthDiv is a module variable declared at the top of this file.
            if (!$textElementPixelWidthDiv) {
                $textElementPixelWidthDiv = jQuery('<div class="width-tester"/>')
                    .css({
                        position: 'absolute',
                        top: -9999,
                        left: -9999,
                        width: 'auto'
                    });
                jQuery('body').append($textElementPixelWidthDiv);
            }

            // Make sure the tester has all the same attributes that would contribute to
            // the element's width. textElementPixelWidthAttributes is a module variable.
            _.each(textElementPixelWidthAttributes, function(attr) {
                $textElementPixelWidthDiv.css(attr, $el.css(attr));
            });

            // Enter new content into widthDiv, escaping it and preserving multiple spaces
            escaped = _.escape(valToCheck).replace(/\s/g,'&nbsp;');
            $textElementPixelWidthDiv.html(escaped);
            testerWidth = $textElementPixelWidthDiv.width() + options.comfortZone;
            newWidth = Math.min(Math.max(testerWidth, options.minWidth), options.maxWidth);
            $el.data(LAST_WIDTH_KEY, newWidth);

            return newWidth;
        },

        /**
         * Trimming the leading white space
         *
         * @param {String} str - String to be trimmed of leading white space
         * @returns {String} - Trimmed string
         */
        trimLeadingWhiteSpace: function(str) {
            return str.replace(/^\s+/,'');
        },

        // make an object with key = value
        makeObj : function (arr){
            return _.object(arr, arr);
        },

        /**
         * splits a string of comma-separated emails
         *
         * @param {String} emails - One String of comma separated emails entered into recipient input field
         * @returns {Array} array of individual non-empty strings
         */
        splitEmails : function(emails) {
            return _.compact(emails.split(/[\s,;]/));
        },

        /**
         * Extension to _.unescape function.
         * This is put in place to handle unescaping HTML
         * decimal representation of apostrophe (&#39;).
         * UnderscoreJS unescapes apostrophe in hex format (&#x27;).
         *
         * @param {String} str - string that potential has special character to be un-escaped
         * @returns {String} - unescaped string
         */
        unescape: function(str) {

            // the regex /\&([#39;]+);/g is equivalent to: new RegExp('(&#39;)', 'g')
            return _.unescape(str).replace(/\&#39;/g, "'");
        },

        /**
         * Escape some characters to allow regex searching
         * @param {String} unescaped string
         * @return {String} string with escaped special characters to prepare for regex
         */
        escapeRegex: function(unescaped) {
            return unescaped.replace(ILLEGAL_REGEX_CHARS, '\\$&');
        },

        // courtesy of select2
        KEY : {
            TAB: 9,
            ENTER: 13,
            ESC: 27,
            SPACE: 32,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            SHIFT: 16,
            CTRL: 17,
            ALT: 18,
            PAGE_UP: 33,
            PAGE_DOWN: 34,
            HOME: 36,
            END: 35,
            BACKSPACE: 8,
            DELETE: 46,
            COMMA: 188,
            SEMICOLON:186,
            IMECOMPOSE: 229,
            isArrow: function (e) {
                e = e.which ? e.which : e;
                switch (e) {
                    case KEY.LEFT:
                    case KEY.RIGHT:
                    case KEY.UP:
                    case KEY.DOWN:
                        return true;
                }
                return false;
            },
            isUpDownArrow: function (e) {
                e = e.which ? e.which : e;
                switch (e) {
                    case KEY.UP:
                    case KEY.DOWN:
                        return true;
                }
                return false;
            },
            isEnter: function(e) {
                var which = e.which || e.keyCode;
                return which === KEY.ENTER;
            },
            isComma: function(e) {
                var which = e.which || e.keyCode;
                return which === KEY.COMMA;
            },
            isSpace: function(e) {
                var which = e.which || e.keyCode;
                return which === KEY.SPACE;
            },
            isTab: function(e) {
                var which = e.which || e.keyCode;
                return which === KEY.TAB;
            },
            isEsc: function(e) {
                var which = e.which || e.keyCode;
                return which === KEY.ESC;
            },
            isControl: function (e) {
                e = e.which ? e.which : e;
                switch (e) {
                    case KEY.SHIFT:
                    case KEY.CTRL:
                    case KEY.ALT:
                        return true;
                }
                if (e.metaKey) return true;
                return false;
            },
            isFunctionKey: function (e) {
                e = e.which ? e.which : e;
                return e >= 112 && e <= 123;
            },

            /**
             * keycode 229 means that user pressed down keys, but input method is still composing.
             * This is a standard behavior for some input methods like entering Japaneese or Chinese glyphs
             * http://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
             */
            isIMEComposing: function (e) {
                return e.which === KEY.IMECOMPOSE && e.type === 'keydown';
            },

            /* should the keystroke be interpreted as a delete action */
            isDeleteAction: function (e) {
                var which = e.which || e.keyCode;
                return which === KEY.DELETE || which === KEY.BACKSPACE;
            },

            /* field navigation -specific */

            isFieldNav: function(e) {
                return KEY.isEnter(e) || KEY.isRequiredNav(e);
            },

            isRequiredNav: function(e) {
                return e.shiftKey && KEY.isUpDownArrow(e);
            },

            isFieldNavUp: function(e) {
                var which = e.which || e.keyCode;
                return e.shiftKey && (KEY.isEnter(e) || which === KEY.UP);
            },

            isValidKeyForPDFPassword: function(e) {

                //Allow delete and navigation
                if(KEY.isDeleteAction(e) || KEY.isTab(e) || KEY.isArrow(e) || KEY.isEnter(e)) {
                    return true;
                }

                return KEY.isValidCharacterForPDFPassword(e);
            },

            isValidCharacterForPDFPassword: function(e) {
                //For PDF's of 40-bit RC4 encryption level, valid chars are space to ~ in the ascii table
                //which is hex 20 to 7E, html/decimal 32 to 126.
                e = e.which ? e.which : e;

                return (e >= 32 && e <= 126);
            },

            isKeyboardClick: function(e) {
                return e.type === 'click' ||
                    ((e.type === 'keydown' || e.type === 'keypress') &&
                        (KEY.isEnter(e) || KEY.isSpace(e)));
            },

            isSemicolon: function(e) {
                var which = e.which || e.keyCode;
                return which === KEY.SEMICOLON;
            }
        },

        /**
         * make Bootstrap modal dialog.
         *
         * Inside the event handler, 'this' is the element -- use jQuery(this).modal(...) to pass
         * commands to the modal.
         *
         * @param options {object} --
         *
         *    title {string} - modal title
         *    content {string} - html content of modal
         *    classes {string} - class name(s) to be applied to modal (space separated)
         *    close {boolean} - whether to show 'x' in header
         *    closeBtn {string} - text of close button
         *    primaryBtn {string} - text of primary button (default 'OK')
         *    autoDestroy {boolean} - set to true to destroy the modal on exit
         *    autoFocus {boolean|string} - set focus to first input (or selector if string) element
         *    fade {string} - set to null to disable fade animation, or add fade class
         *    hasHeaderDivider (boolean) - set to false to add special no-divider class
         *    hasFooter {boolean} - set to false to not render a footer
         *    dialogSize {string} - 'small', 'large' or blank for normal size
         *    enterSubmits {string|false} - hitting ENTER on selector will (e.g. 'input')
         *       be same as clicking the primary button.  Or add a "data-submit" attribute in markup.
         *       If  === false, disables all Enter to submit actions.
         *
         *    onClose {function} - on close handler.  Return false to prevent default.
         *    onClick {function} - on click handler (primary button only). Return false to prevent hide.
         *    eventProxy {node|context} - context in which to execute onClick and onClose.  Defaults
         *       to modal DOM node.
         *
         *    closeBtnAnalytics {string} - token for click tracking of close button
         *    primaryBtnAnalytics {string} - token for click tracking of primary button
         *
         *    + options supported by Bootstrap:
         *
         *    keyboard {boolean} - hide on escape (default: true)
         *    show {boolean} - show immediately (default: true)
         *    backdrop {boolean|string} - include a backdrop or 'static' for a backdrop
         *      that doesn't close modal on click (default: true).
         *
         *    @see http://getbootstrap.com/javascript/#modals
         *
         *
         * @return {jquery} - the created jquery object
         */
        createModal: function(options) {
            options = _.extend({}, U.modalDefaults, options);
            var
                analyticsTmpl = _.template('data-analytics-click="{{token}}"'),
                analytics = {
                    closeBtnAnalytics  : options.closeBtnAnalytics && analyticsTmpl({token: options.closeBtnAnalytics}),
                    primaryBtnAnalytics: options.primaryBtnAnalytics && analyticsTmpl({token: options.primaryBtnAnalytics})
                },
                sizeClass = ({small: 'modal-sm', large: 'modal-lg'})[options.dialogSize] || '',
                viewId = _.uniqueId('view'),
                html = U.modalTemplate(_.extend(options, analytics, {sizeClass: sizeClass, viewId: viewId})),
                $el = jQuery(html).appendTo('body'),
                el = $el.get(0),
                destroy = _.bind(function () {
                    jQuery(this).empty().removeData().remove();
                }, el),
                hide = _.bind(function (retValue) {
                    retValue !== false && jQuery(this).modal('hide');
                    return retValue;
                }, el),
                autoFocus = _.bind(function () {
                    var sel = options.autoFocus === true ? 'input,textarea,select' : options.autoFocus;
                    jQuery(this).find(sel).filter(':visible').eq(0).focus().moveCursorToEnd();
                }, el),
                keyDown = _.bind(function (e) {
                    if (U.KEY.isIMEComposing(e)) {
                        // Set flag to track IME composition event
                        imeCompositionActive = true;
                        return;
                    }
                    if (!U.KEY.isTab(e)) {
                        return;
                    }
                    var $target = jQuery(e.target),
                        $focusables = jQuery(this).find(':focusable'),
                        $tabbables = $focusables.filter(':tabbable'),
                        $first = $tabbables.first(),
                        $last = $tabbables.last(),
                        $tabbable;
                    if (e.shiftKey && ($target.is($first) || $target.is($focusables.first()))) {
                        $tabbable = $last;
                    } else if (($target.is($last) || $target.is($focusables.last()))) {
                        $tabbable = $first;
                    }
                    if ($tabbable) {
                        $tabbable.focus();
                        e.preventDefault();
                    }
                }, el),
                modalOn = _.bind(function () {
                    jQuery(this).setAriaHiddenOnSiblings(true);
                }, el),
                modalOff = _.bind(function () {
                    jQuery(this).setAriaHiddenOnSiblings(false);
                }, el),
                keyUp = _.bind(function (e) {
                    if (imeCompositionActive) {
                        // Reset flag that tracks IME composition event, don't allow Enter
                        // keystroke during IME composition to close dialog
                        imeCompositionActive = false;
                        return;
                    }
                    // Dispatch click event if primary button is enabled
                    U.KEY.isEnter(e) && jQuery(this).find('.btn-primary:enabled').click();
                }, el),
                imeCompositionEnd = function () {
                    // Set flag to track IME composition event (Firefox)
                    imeCompositionActive = true;
                },
                submittable = _.compact(['[data-submits]', _.isString(options.enterSubmits) && options.enterSubmits]).join(','),
                proxy = options.eventProxy || el,
                imeCompositionActive = false;

            // create the modal
            $el.modal(options);

            // click on default button or close 'x'
            if (options.onClose) {
                // override 'hide.bs.modal' event bound to [data-dismiss] elements
                $el.off('click.dismiss.bs.modal');
                $el.on('click', '.btn-default, [data-dismiss="modal"]', _.compose(hide, jQuery.proxy(options.onClose, proxy)));
            }

            // click on primary button -- default action is to hide
            if (options.onClick) {
                $el.on('click', '.btn-primary', _.compose(hide, jQuery.proxy(options.onClick, proxy)));
            }

            // handle ENTER key up
            if (options.enterSubmits !== false) {
                // Processing the Enter key within a text input requires some special
                // handling for IME input. Refer to use of imeCompositionActive. In
                // Firefox, we must listen for the compositionend event.
                $el.on('keyup.enterkey.bs.modal', submittable, keyUp);
                $el.on('compositionend.enterkey.bs.modal', submittable, imeCompositionEnd);
            }

            options.autoDestroy && $el.on('hidden.bs.modal', destroy);
            options.autoFocus && $el.on('shown.bs.modal', autoFocus);

            // keep keyboard focus within the dialog
            $el.on('keydown.trapfocus.bs.modal', keyDown);

            // prevent underlying content from being accessible to screen readers
            $el.on('shown.trapfocus.bs.modal', modalOn);
            $el.on('hide.trapfocus.bs.modal', modalOff);

            return $el;
        },

        /**
         * default values to use for modal creation in App.Utils.createModal() method.
         * All parameters used in the template App.Templates.modal must be defined.
         */
        modalDefaults: {
            title              : '',
            content            : '',
            classes            : '',
            id                 : '',
            close              : true,
            closeBtn           : '',
            primaryBtn         : i18n.common.ok(),
            autoDestroy        : false,
            autoFocus          : true,
            fade               : 'fade',
            onClick            : _.constant(true),  // default to hide
            closeBtnAnalytics  : '',  // click tracking
            primaryBtnAnalytics: '', // click tracking
            hasHeaderDivider   : true,
            hasFooter          : true,
            dialogSize         : '',
            enterSubmits       : true
        },

        /**
         * modal template -- needs to be defined here since not all bundles include the common templates dir.
         * Note: tabindex=-1 is required for escape key to work on Chrome/Firefox.
         */
        modalTemplate: _.template(
            '<div class="modal {{fade}} {{ classes }}" id="{{id}}" role="dialog" tabindex="-1"\
              <% if (title.length) { %> aria-labelledby="modal-title-{{viewId}}" <% } %>\
              <% if (content.length) { %> aria-describedby="modal-body-{{viewId}}" <% } %>>\
              <div class="modal-dialog {{sizeClass}}"><div class="modal-content">\
                <div class="modal-header <% if (!hasHeaderDivider) { %>no-divider<% } %> ">\
                  <% if (close) { %>\
                  <button type="button" class="close" data-dismiss="modal"\
                    title="' + CLOSE_LABEL + '" aria-label="' + CLOSE_LABEL + '">\
              <span aria-hidden="true">&times;</span>\
            </button>\
            <% } %>\
            <h3 class="modal-title" id="modal-title-{{viewId}}">{{% title }}</h3>\
          </div>\
          <div class="modal-body" id="modal-body-{{viewId}}">{{ content }}</div>\
          <% if (hasFooter) { %>\
          <div class="modal-footer">\
            <% if (closeBtn) { %> <button class="btn btn-default" data-dismiss="modal" {{closeBtnAnalytics}}>{{ closeBtn }}</button> <% } %>\
            <% if (primaryBtn) { %> <button class="btn btn-primary" {{primaryBtnAnalytics}}>{{ primaryBtn }}</button> <% } %>\
          </div>\
          <% } %>\
        </div>\
      </div>'
        ),

        /**
         * show an error modal - eg. App.Utils.showErrorModal(message) or App.Utils.showErrorModal({ title: 'foo', content: message, ... })
         *
         * @param options {object|string} any options valid for createModal(), or a simple string message
         * @returns {jquery} the modal DOM element
         */
        showErrorModal: function(options){
            if (_.isString(options)) {
                options = { content: options };
            }

            options = _.defaults(options || {}, {
                title : i18n.common.error(),
                autoDestroy: true,
                classes: 'error-dialog'
            });

            return U.createModal(options);
        },


        /**
         * @type {object} default values for alerts
         */
        alertDefaults: {
            container    : 'body',
            autoHide     : false,
            autoHideDelay: 3000,
            classes      : '',
            close        : false,
            key          : '',
            type         : 'danger',
            details      : false,
            popup        : true,
            _itemKeys    : '' // internal use
        },

        /**
         * template for alert box
         */
        alertTemplate: _.template(
            '<div class="alert alert-{{type}} {{classes}} fade in <%if (popup) { %> alert-popup <% } %><%if (close) {%>alert-dismissible<% } %>" role="alert" data-key="{{key}}" {{_itemKeys}} >' +
            '<% if (close) { %><button type="button" class="close" data-dismiss="alert" title="' + CLOSE_LABEL + '" aria-label="'
            + CLOSE_LABEL + '"><span aria-hidden="true">×</span></button><% } %>{{message}}' +
            '<%if (details) { %>' +
            ' <a href="#" onclick="event.preventDefault();" class="alert-link" data-toggle="collapse" data-target="#details-{{key}}">' +
            DETAILS_LABEL + ' <span class="caret"></span>' +
            '</a><div class="collapse" id="details-{{key}}"><div class="well well-sm">{{details}}</div></div>' +
            '<% } %>' +
            '</div>'
        ),

        /**
         * template for a list item
         */
        listItemTemplate: _.template('<li class="alert-error collapse in" data-itemkey="{{itemKey}}">{{message}}</li>'),

        /**
         * show one or more alert messages
         *
         * @param errors {array|object|string} string or array of strings to display.  If an object hash is given,
         *    individual errors can be cleared by passing itemKey to clearAlerts().
         * @param options {object} options --
         *
         *    animate {string|boolean} - 'collapse' or 'fade' if false, don't animate
         *    autoHide {boolean} - if true will dismiss error after autoHideDelay msecs
         *    autoHideDelay {number} - dismiss after (msecs)
         *    classes {string} - class name(s) to be applied to div (space separated)
         *    close {boolean} - whether to show dismiss 'x'
         *    container {jquery|selector} - container to hold the alerts
         *    enumerate {boolean} - if true, add <ol> markup to errors
         *    key {string} - unique key for message (useful for removing it or to prevent duplicate errors)
         *    type {string} - 'warning', 'danger', 'success', or 'info' (default: 'danger')
         *    details {string} - details text (click to show)
         */
        showAlerts: function(errors, options) {
            options = _.extend({}, U.alertDefaults, options);

            var container = jQuery(options.container);
            if (_.isString(errors)) {
                errors = [errors];
            }

            // no duplicate if key is given
            if (options.key) U.clearAlerts(options);

            // safeguard use of double quotes
            options.key = encodeURIComponent(options.key);


            if (options.enumerate && _.size(errors) > 1 || _isNested(errors[0] || errors)) {
                errors = ['<ol class="alert-errors">' + _.map(errors, _listItem).join('') + '</ol>'];
            } else {
                // decorate container with keys
                options._itemKeys = 'data-itemkey="' + _.keys(errors).join(',') + '"';
            }

            // append to * top * of container in order
            if (_.isArray(errors)) {
                errors.reverse();
            }

            // append to container
            _.each(errors, _addError);


            /**
             * local functions
             */
            function _listItem(error, key) {
                // handle nested errors
                if (_isNested(error)) {
                    return _.map(error, _listItem).join('');
                }

                return U.listItemTemplate({message: _getMessage(error), itemKey: key});
            }

            function _isNested(error) {
                return !error.message && !_.isString(error) && _.size(error) > 1;
            }

            function _getMessage(error) {
                return  error.message || _.values(error)[0] || error;
            }

            function _addError(error, key){
                options.message = _getMessage(error);
                var el = jQuery(U.alertTemplate(options)).prependTo(container);
                if (options.autoHide) {
                    _.delay(function (closure) {
                        closure.find('.close').click();
                    }, options.autoHideDelay, el);
                }
            }
        },

        /**
         * clear alert(s) -- pass options to limit to container or particular alert.
         *
         * @param options {object}
         *    container {jquery|selector} - container to clear alerts from
         *    key {string} - data-key to clear, if none given, clears all alerts from container
         *    itemKey {string} - for enumerated messages, clear only this one
         * @returns {jQuery} removed nodes
         */
        clearAlerts: function(options) {
            options = _.extend({}, U.alertDefaults, options);

            var container = jQuery(options.container),
                select = '.alert-danger',
                itemSelect = '';

            // clear key'd section?
            if (options.key) {
                // safeguard use of double quotes
                select += '[data-key="'+ encodeURIComponent(options.key) +'"]';
            }

            // remove individual items (fadeout)
            else if (options.itemKey) {
                itemSelect = '[data-itemkey|="' + encodeURIComponent(options.itemKey) + '"]';
                select += itemSelect + ','       // self
                    + select + ' ' + itemSelect;   // descendants

                // allow fade animation to finish, then remove the row.
                return container.find(select).collapse('hide').one('hidden.bs.collapse', function () {
                    var el = jQuery(this),
                        parent = el.closest('.alert-danger');
                    el.remove();

                    // remove container if last item
                    if (!parent.find('li').length) parent.alert('close');
                });
            }

            return container.find(select).remove();
        },

        /**
         * switches to sharer's view if email is not null otherwise switches back to logged in account
         * @param email {string}
         * @param clientCallback
         * @returns {null}
         */
        switchAccount:function(email, clientCallback) {
            App.Service.switchAccountAjaxService.switchAccount(email, {
                callback: function (result) {
                    if (result) {
                        parent.window.location = result;
                    }
                    if(clientCallback) clientCallback();
                },
                errorHandler: function (errorString, exception) {
                    if(clientCallback) clientCallback()
                }
            });
        },

        /**
         * on iOS header is unfixed when keyboard is open -- we adjust the header (and footer) width
         * to current max page width.
         */
        fixiOSHeaderWidth: function() {
            var header = jQuery('#header'),
                width;

            // If not iOS or header does not exist, return
            if (!App.Env.feature.iOS || !header.length) return;

            if (U.isKeyboardOpen()) {
                width = header.attr('data-maxPageWidth');
                if (width >= jQuery(window).width()) {

                    // fix footer also
                    header.add('#footer').css('width', width + 'px');
                } else {

                    //This is for the case when the viewport layout is changed with the keyboard open, as happens
                    //when the user rotates the device while editing.
                    header.add('#footer').css('width','');
                }
            } else {

                // reset width
                header.add('#footer').css('width','');
            }
        },

        /**
         * some mobile devices don't handle position:fixed header correctly.
         * This method is used to adjust the drift of fixed elements while scrolling.
         *
         * @param $el {jQuery} element to adjust
         * @returns {jQuery}
         */
        fixMobilePosition: function ($el) {
            var pos, offset, drift;

            // adjust fixed header drift, if any significant
            pos = $el.position();
            drift = Math.abs(pos.top) + Math.abs(pos.left);
            if (drift > 2) {
                offset = $el.offset();
                offset.top -= pos.top;
                offset.left -= pos.left;
                $el.offset(offset);
            }
            return $el;
        },

        /**
         * Determine if a modal dialog is currently open
         * @returns {Boolean} True if a modal dialog is currently open, false otherwise
         */
        isModalOpen: function() {
            return jQuery(document.body).hasClass('modal-open');
        },

        /**
         * determine if virtual keyboard is open (ie, an input field has focus)
         * @returns {boolean}
         */
        isKeyboardOpen: function(){
            return jQuery('body').hasClass('keyboard-open');
        },


        backdropTemplate : '<div class="modal-backdrop interstitial-backdrop white fade in"></div>',


        /**
         * prevent multiple execution of a function within a specified time period.
         *
         * @param fn {function} function to throttle
         * @param throttleTime {number} (optional) amount of throttle window (in msec)
         * @returns {function} the throttled function
         */
        safeThrottle: function(fn, throttleTime) {
            return _.throttle(fn, throttleTime || U.interstitialDelay, {trailing: false});
        },


        /**
         * @property {number} default time (in msec) to delay showing interstitial
         */
        interstitialDelay: 500,

        /**
         * show interstitial message and spinner
         *
         * @params options {object} (optional)
         *
         *    text {string} - the message to show, if any (default: Loading...)
         *    classes {string} - classes to add to backdrop
         *    delayed {boolean|number} - if true, delay the show.  If hideInterstitial is called while
         *       waiting, cancels the show.  If number, delay by that msec.
         */
        showInterstitial: function(options) {
            var $backdrop = U.getBackdrop(),
                $el = U.getInterstitial();

            options = _.extend({
                classes: '',
                text: i18n.common.loading(),
                delayed: false
            }, options);

            haveInterstitial = true;

            if (options.delayed) {
                var delay = _.isBoolean(options.delayed) ? U.interstitialDelay : options.delayed;
                delete options.delayed;

                _.delay(function(opt){
                    haveInterstitial && U.showInterstitial(opt);
                }, delay, options);

                return;
            }

            if (! $backdrop.length) {
                $backdrop = jQuery(_.template(U.backdropTemplate)()).appendTo(document.body);
            }

            // add text if any
            $el.find('h3').html(options.text);

            if (options.classes) {
                $backdrop.addClass(options.classes);
            }
            $el.show();
            $backdrop.show();
        },

        /**
         * hide interstitial
         */
        hideInterstitial: function() {
            U.getBackdrop().hide();
            U.getInterstitial().hide();
            haveInterstitial = false;
        },

        /**
         * get the interstitial node
         *
         * @returns {jQuery}
         */
        getInterstitial: function() {
            return jQuery('body > .interstitial');
        },

        /**
         * get the backdrop node (if it exists)
         *
         * @returns {jQuery}
         */
        getBackdrop: function() {
            return jQuery('body > .modal-backdrop.interstitial-backdrop');
        },

        /**
         * @property {string} alignment seperator
         */
        ALIGN_SEP : '<sp>',

        /**
         * alignLeft: converts
         *
         *  "foobar <sp> baz"
         *  "a <sp> b"
         *
         *  to:
         *
         *  "foobar baz"
         *  "a      b"
         *
         *  using an (approximate) text width measurement.
         *
         *  @params list {array|string} array of strings to align on '<sp>' marker.  Single string is accepted, but
         *    the result will be an array of 1.
         *  @paramm nspaces {number} number of additional 'spaces' to add at marker
         *  @return {array} array of aligned strings
         */
        alignLeft: function(list, nspaces) {
            if (_.isString(list)) list = [list];
            nspaces = nspaces || 1;

            var
                space = '&ensp;',
                hairSpace = '&#8202;',  // hair space has a width of 1
                spaceWidth = U.textWidth(space, undefined , false) || U.textWidth('c'), // IE10 returns 0 for space!! 'c' is a close approximate
                marker = new RegExp('\\s*' + U.ALIGN_SEP + '\\s*');

            var widths = _(list).map(function(line) {
                    var parts = line.split(marker);

                    // get text width of left parts.
                    // when line only has 1 part, do not include the part in max width calculation.
                    return U.textWidth(_.isEmpty(parts[1]) ? '' : line.split(marker)[0]);
                }),
                maxWidth = _(widths).max() + (nspaces * spaceWidth);

            return _(list).map(function (line, index) {
                var parts = line.split(marker);
                if (_.isEmpty(parts[1])) return parts[0];

                var
                    delta = maxWidth - widths[index],
                    nSpaces = Math.floor(delta / spaceWidth),
                    nHairSpaces = Math.floor(delta - nSpaces * spaceWidth),
                    sp = Array(1 + nSpaces).join(space) + Array(1 + nHairSpaces).join(hairSpace);

                return parts[0] + sp + parts[1];
            });
        },

        /**
         * get the (approximate) text width in fractional pixels of text
         *
         * @param text {string} text to measure
         * @param font {string} (optional) CSS font-spec to use, eg, '14px foo'
         * @param shouldEscapeText {boolean} (optional) True, by default to avoid XSS injections by escaping the text before appending to DOM
         * @returns {number} width of text in given font
         */
        textWidth: function(text, font, shouldEscapeText){
            // It is important to escape the text before appending it to the DOM to avoid XSS injection issues like:
            // DCES-4168882 and DCES-4169028
            var
                shouldEscapeText = !_.isUndefined(shouldEscapeText) ? shouldEscapeText : true,
                textToMeasure = shouldEscapeText ? _.escape(text) : text,
                f = font || '12px arial',
                o = jQuery('<div>' + Array(11).join(textToMeasure) + '</div>')
                    .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
                    .appendTo(jQuery('body')),
                w = o.width() / 10;
            o.remove();
            return w;
        },

        /**
         * Scale font size to height and apply cursive font mag if signed
         * @param options {Object} - width {Number}, height {Number}, field {Object}, signed {Boolean}, signatureFontPct {Number}, cursiveFontMag {Number}, text {String}
         * @returns {Number} font size in pixels
         */
        getSignatureFontSize: function(options) {
            var calcFontSize = function(height, isSigned, signatureFontPct, cursiveFontMag) {
                    var fs = height * signatureFontPct;
                    if(isSigned) {

                        //Apply a magnification for the signed typed font
                        fs = fs * cursiveFontMag;
                    }
                    return fs;
                },
                getFontSizeImpl = _.memoize(function(sigWidth, sigHeight, inputField, isSigned, signatureFontPct, cursiveFontMag, text) {
                    var fontSize = calcFontSize(sigHeight, isSigned, signatureFontPct, cursiveFontMag),
                        fontFamily = inputField.css('font-family'),
                        textWidth = U.textWidth(text, fontSize + 'px ' + fontFamily);

                    // if the resulted test is longer than the field width, downscale it.
                    if (textWidth > sigWidth) {
                        fontSize *= sigWidth / textWidth;
                    }

                    return fontSize;

                }, function hashFn(sigWidth, signHeight, text, isSigned, signatureFontPct, cursiveFontMag) {
                    return [sigWidth, signHeight, text, isSigned, signatureFontPct, cursiveFontMag].join();
                });

            return getFontSizeImpl(options.width,
                options.height, options.field, options.signed, options.signatureFontPct, options.cursiveFontMag, options.text);
        },

        /**
         * get the file name and extension {object} from the full file name
         * Assuming the check for file type is already done before it reaches this method.
         *
         * @param file {string} full file name
         *  e.g. 'testFileName.pdf'
         * @returns {object} name: file name; extension: file extension
         *  e.g. {name: 'testFileName', extension: 'pdf'}
         */
        getFileNameInfo : function(file) {
            var index = file.lastIndexOf('.'),
                fileExt = '',
                fileName;

            if (index !== -1) {
                fileExt = file.substr(index + 1);
                fileName = file.substring(0, index);
            }
            else {
                fileName = file;
            }

            return {
                name: fileName,
                extension: fileExt
            };
        },

        /*
         The MIT License
         Copyright (c) 2011 Esa-Matti Suuronen esa-matti@suuronen.org
         Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
         The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
         THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

         http://epeli.github.io/underscore.string/
         */
        naturalSort: function(str1, str2) {
            if (str1 == str2) return 0;
            if (!str1) return -1;
            if (!str2) return 1;

            var cmpRegex = /(\.\d+|\d+|\D+)/g,
                tokens1 = String(str1).match(cmpRegex),
                tokens2 = String(str2).match(cmpRegex),
                count = Math.min(tokens1.length, tokens2.length);

            for (var i = 0; i < count; i++) {
                var a = tokens1[i],
                    b = tokens2[i];

                if (a !== b) {
                    var num1 = +a;
                    var num2 = +b;
                    if (num1 === num1 && num2 === num2) {
                        return num1 > num2 ? 1 : -1;
                    }
                    return a < b ? -1 : 1;
                }
            }

            if (tokens1.length != tokens2.length)
                return tokens1.length - tokens2.length;

            return str1 < str2 ? -1 : 1;
        },

        // Force WAI-ARIA alert message to be announced by assistive technology
        // removing then restoring message content to the DOM
        announceMessage : function(selector, defer) {
            var $el = jQuery(selector),
                $prev,
                $next,
                $parent,
                timeoutInt;

            // if no error or message has text, do nothing
            if (!$el.text().length) {
                return;
            }

            // get previous sibling as jQuery element
            $prev = $el.prev();

            // with no previous sibling, get next sibling as jQuery element
            if (!$prev.length) {
                $next = $el.next();

                // with no next sibling, get parent as jQuery element
                if (!$next.length) {
                    $parent = $el.parent();
                }
            }

            // detach the message element from the DOM
            $el.detach();

            // utility method to re-attach element to the DOM
            function attach() {
                if ($prev.length) {
                    $prev.after($el);
                } else if ($next.length) {
                    $next.before($el);
                } else {
                    $parent.append($el);
                }
            }
            if (defer) {
                timeoutInt = setTimeout(attach, 25);
            } else {
                attach();
            }
        },

        /**
         * Replace the extension of the provided fileName with the specified
         * extension. The extension of a file name is defined as the the part
         * after the last dot in the file name. For example, the name
         * foo.bar.baz has the extension 'baz' instead 'bar.baz'.
         * If fileName is null or empty, an empty string will be returned.
         * If fileName has no extension, the supplied extension will be directly
         * appended to the fileName. Examples:
         * changeFileExtension('foo.txt', 'png') -> 'foo.png'
         * changeFileExtension('foo', 'png')     -> 'foo.png'
         * changeFileExtension(null, 'png')      -> ''
         * changeFileExtension('', 'png')        -> ''
         * @param {string}fileName  the original file name
         * @param {string} extension  the new extension with no leading dot
         * @returns {string} the file name with the new extension
         */
        changeFileExtension: function(fileName, extension) {
            if (!fileName) {
                return '';
            }

            var matches = /(.*)(\.[^.]+)$/.exec(fileName);
            return (matches ? matches[1] : fileName) + '.' + extension
        },

        /**
         * determine which bucket value is in
         *
         * e.g.  App.Utils.inBucket([0, 5, 10], 4) === 0
         *       App.Utils.inBucket([0, 5, 10], 5) === 0 // at boundary
         *       App.Utils.inBucket([0, 5, 10], 6) === 5
         *
         * with labels:
         *       App.Utils.inBucket([0, 5, 10], 6, ['a','b','c']) === 'b'
         *
         * @param buckets {number[]|string[]} array of SORTED bucket values
         * @param value {mixed} value to assess
         * @param [labels] {string[]} (optional) if given, returns label rather than bucket value
         * @returns {number|string} the buck value or label
         */
        inBucket: function(buckets, value, labels) {
            var at = _(buckets).sortedIndex(value) || 1;
            return (labels || buckets)[at - 1];
        },

        /**
         * @property {string} protection string for '[...]' json string
         * This must match string defined on back-end in Constants.java
         * (used in DocumentJSONUtils.java and FormField.java)
         */
        esBracketProtectionForJSONString : 'ESBracketProtectionForJSON',

        /**
         * add string addition that serves to protect brackets ([...])
         * from being converted into arrays by json-lib (on backend) and crashing
         * (Introduced in relation to issue: DCES-4197463 - Fields not being saved in library template)
         * This is used for radio button tooltips, because of smaller risk,
         * unlike tooltips of other fields which are protected on backend.
         * @param stringToProtect {string} text containing string that needs to be protected from [] brackets
         * @returns {string} text with protection string
         */
        addESBracketProtectionForJSON: function(stringToProtect) {
            var result = stringToProtect;
            if (result && result.indexOf('[') === 0) {
                result = U.esBracketProtectionForJSONString + result;
            }
            return result;
        },

        /**
         * remove string addition that serves to protect brackets ([...])
         * from being converted into arrays by json-lib (on backend) and crashing
         * (Introduced in relation to issue: DCES-4197463 - Fields not being saved in library template)
         * @param stringToClean {string} text containing string that server to protect brackets
         * @returns {string} text cleaned from protection string
         */
        cleanESBracketProtectionForJSON: function(stringToClean) {
            var result = stringToClean;

            if (result && result.indexOf(U.esBracketProtectionForJSONString) === 0) {
                result = result.substring(U.esBracketProtectionForJSONString.length);
            }
            return result;
        },

        // /**
        //  * Initialize the intl-tel-input component needed for the signature panel mobile tab
        //  * @returns {Promise}
        //  * @private
        //  */
        // initIntlTelInput: function() {
        //     var defer = jQuery.Deferred(),
        //         css = '../javascript/intl-tel-input/v11.0.10/css/intlTelInput.css',
        //         js = '../javascript/intl-tel-input/v11.0.10/js/intlTelInput.min.js',
        //         utils = '../javascript/intl-tel-input/v11.0.10/js/utils.js';
        //
        //     if (!App.Env.intlTelInputLoaded) {
        //         jQuery('<link>', {rel: 'stylesheet', type: 'text/css', 'href': css})
        //             .appendTo('head')
        //             .on('load', function () {
        //                 // dont use $.getScript as it prevents caching
        //                 jQuery.ajax({
        //                     type    : "GET",
        //                     url     : js,
        //                     complete: function () {
        //                         App.Env.intlTelInputLoaded = true;
        //                         // loadUtils will resolve defer
        //                         jQuery.fn.intlTelInput.loadUtils(utils);
        //                         defer.resolve();
        //                     },
        //                     dataType: "script",
        //                     cache   : true
        //                 });
        //             });
        //     }
        //     else {
        //         defer.resolve();
        //     }
        //
        //     return defer.promise();
        // }
    };

    // local var, referenced within in App.Utils.KEY as a shortcut to the values within
    var KEY = U.KEY;

    /**
     * define new Bootstrap popover2 -- this allows a popover()
     * and popover2() on the same element.
     *
     * This also takes an optional 'className' in the options.
     *
     * usage:  $el.popover2({ className : 'blah' })
     */
    (function($) {
        var Popover = function (element, options) {
            this.init('popover2', element, options);
        };

        Popover.prototype = $.extend({}, $.fn.popover.Constructor.prototype);

        $.fn.popover2 = function (option) {
            /*jshint laxcomma:true */
            return this.each(function () {
                var $this = $(this)
                    , data = $this.data('bs.popover2')
                    , options = typeof option === 'object' && option;

                if (!data && option === 'destroy') return;
                if (!data) $this.data('bs.popover2', (data = new Popover(this, options)));

                data.tip().addClass('popover2 ' + (options.className || ''));
                if (typeof option === 'string') data[option]();
            });
        };

        $.fn.popover2.Constructor = Popover;
        $.fn.popover2.defaults = $.extend({} , $.fn.popover.defaults, { });

    })(jQuery);


    /**
     * jQuery plugin -- move cursor to end of (first) input field
     */
    jQuery.fn.moveCursorToEnd = function() {
        var el = this[0];
        if (!el) return;
        try {
            // @see bug https://watsonexp.corp.adobe.com/#bug=3978793
            if (typeof el.selectionStart === 'number') {
                el.selectionStart = el.selectionEnd = el.value.length;
            } else if (typeof el.createTextRange !== undefined) {
                el.focus();
                var range = el.createTextRange();
                range.collapse(false);
                range.select();
            }
        } catch(e){}
    };

    /**
     * jQuery plugin -- hides/shows all other elements in DOM from assistive technology
     * by toggling aria-hidden on an element's siblings and its ancestors' siblings.
     *
     * @param toggle {boolean} when true, hides elements using the aria-hidden attribute
     * @returns {jQuery Object}
     */
    jQuery.fn.setAriaHiddenOnSiblings = function(toggle) {
        this.parentsUntil('body').addBack().each(function(i, parent) {
            jQuery(parent).siblings(':not(script,noscript,link,style)')
                .each(function (j, sibling) {
                    var $sibling = jQuery(sibling);
                    if (toggle) {
                        if ($sibling.is('[aria-hidden]')) {
                            $sibling.data('aria-hidden', $sibling.attr('aria-hidden'));
                        }
                        $sibling.attr('aria-hidden', 'true');
                    } else {
                        if ($sibling.data('aria-hidden')) {
                            $sibling.attr('aria-hidden', $sibling.data('aria-hidden'));
                            $sibling.removeData('aria-hidden');
                        } else {
                            $sibling.removeAttr('aria-hidden');
                        }
                    }
                });
        });
    };


})();
