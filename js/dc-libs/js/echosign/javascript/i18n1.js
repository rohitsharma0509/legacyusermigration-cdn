;(function () {
    function r(val, args) {
        for (var x = 0; x < args.length; x++) {
            val = val.replace('{' + x + '}', args[x]);
        }
        return val;
    }

    function p() {
        var val = arguments[0];
        var ret;
        if (val.indexOf('{0}') != -1)
            ret = function () {
                return r(val, arguments);
            }
        else ret = function () {
            return val;
        }
        for (var x = 1; x < arguments.length; x++) {
            for (var a in arguments[x])
                ret[a] = arguments[x][a];
        }
        return ret;
    }

    function getFSLocaleStr(key) {
       return window.i18n.fs_locale_strings ? window.i18n.fs_locale_strings[key] || key : key;
    }

    window.i18n = (
        {
            "country": {},
            "common": {
                ok: function() {return getFSLocaleStr('OK');},
                cancel: function() {return getFSLocaleStr('CANCEL');},
                clear: function() {return getFSLocaleStr('CLEAR');},
                close: function() {return getFSLocaleStr('CLOSE');},
                details: function() {return getFSLocaleStr('DETAILS');},
                error: function() {return getFSLocaleStr('ERROR');},
                loading: function() {return getFSLocaleStr('LOADING');},
                search: function() {return getFSLocaleStr('SEARCH');},
                pDFForms_page: function() {return getFSLocaleStr('PDFFORMS_PAGE');},
                esign_HUD_pageUp: function() {return getFSLocaleStr('ESIGN_HUD_PAGEUP');},
                esign_HUD_pageDown: function() {return getFSLocaleStr('ESIGN_HUD_PAGEDOWN');},
                esign_HUD_zoomOut: function() {return getFSLocaleStr('ESIGN_HUD_ZOOMOUT');},
                esign_HUD_zoomIn: function() { return getFSLocaleStr('ESIGN_HUD_ZOOMIN');},
                esign_HUD_close_button: function() {return getFSLocaleStr('ESIGN_HUD_CLOSE_BUTTON');},
                specific_page: function() {return getFSLocaleStr('SPECIFIC_PAGE');},

                // Functions returning a hardcoded value are called before the localized string bundle is ready.
                shortcuts_toolbar: function() {return 'Toolbar';},
                shortcuts_zoom_in_out: function() {return 'zoom in/out';},
                shortcuts_next_prev_page: function() {return 'next/prev page';},
                shortcuts_jump_to_last_first_page: function() {return 'jump to last/first page';},
                shortcuts_jump_to_page_no: function() {return 'jump to page &lt;number&gt;';},
                shortcuts_move_next_previous_toolbar_item: function() {return 'move to next/previous toolbar item';},
            },
            "js": {
            },
            "api": {},
            "locale": {}
        }
    )
})();