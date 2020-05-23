/**
 * App.Env
 *
 * app-wide Env settings
 */

(function(){

  var UA = navigator.userAgent;
  var mobileDetect = new MobileDetect(UA); // Device detection using the mobile-detect.js library
  var queryParams;

  App.Env = {

    /**
    * Also expose it as App.Env.mobileDetect, so that pages can use it for advanced tests
    */
    mobileDetect: mobileDetect,

    /**
     * browser feature detection
     */
    feature: {

      /**
       * native html5 input/textarea placeholder
       */
      placeholder: ('placeholder' in document.createElement('input')),

      isMobileBrowser: (mobileDetect.mobile() !== null),

      isPhone: (mobileDetect.phone() !== null),

      isTablet: (mobileDetect.tablet() !== null),

      ipad: mobileDetect.is('iPad'),

      iOS: mobileDetect.is('iOS'),

      iOSChrome: mobileDetect.is('iOS') && mobileDetect.is('Chrome'),
      
      mobileSafari: mobileDetect.is('iOS') && mobileDetect.is('Safari'),
      
      android: mobileDetect.is('Android'),
      
      ieLt10: jQuery.browser.msie && jQuery.browser.version < 10,

      ie9: jQuery.browser.msie && jQuery.browser.version == 9,

      ie10: jQuery.browser.msie && jQuery.browser.version === 10,

      ie: jQuery.browser.msie,

      isFramed: window.location !== window.parent.location,

      msedge: jQuery.browser.msedge,

      chrome: jQuery.browser.chrome
    },

    /**
     *
     * @param width - window width
     * @returns viewportType - various bootstrap supported viewport breakpoints
     * @url http://getbootstrap.com/css/#responsive-utilities
     */
    responsiveType: function( width ) {
      var viewportType;

      if (width <= 399) {
        viewportType = 'vsmallDevice';

      } else if (width >= 400 && width <= 479) {
        viewportType = 'xxsmallDevice';

      } else if (width >= 480 && width <= 767) {
        viewportType = 'xsmallDevice';

      } else if (width >= 768 && width <= 991) {
        viewportType = 'smallDevice';

      } else if (width >= 992 && width <= 1199) {
        viewportType = 'mediumDevice';

      } else {
        viewportType = 'largeDevice';

      }

      return viewportType;

    },

    /**
     * get a query param from the URL
     *
     * @param param {string} parameter name.  If omitted, returns all query parameters.
     * @returns {*} value of parameter
     */
    queryParam: function(param){
      if (!queryParams) {
        queryParams = _.parseQuery(location.search);
      }

      return param ? queryParams[param] : queryParams;
    },

    /**
     * detect if CSS property passed is supported by the browser
     * @param {string} propertyName - CSS property name
     * @returns {boolean}
     */
    browserSupportsCSSProperty: function(propertyName){
      var elm = document.createElement('div');
      propertyName = propertyName.toLowerCase();

      if (elm.style[propertyName] !== undefined){
        return true;
      }

      var propertyNameCapital = propertyName.charAt(0).toUpperCase() + propertyName.substr(1),
        domPrefixes = 'Webkit Moz ms O'.split(' ');

      for (var i = 0; i < domPrefixes.length; i++) {
        if (elm.style[domPrefixes[i] + propertyNameCapital] !== undefined)
          return true;
      }

      return false;
    }
  };

})();
