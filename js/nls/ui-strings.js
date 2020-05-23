/**
 * Module that handles lazy loading translated strings as json object and provide helper method to return translated string
 * for a given key.
 *
 * Peforms two functions:
 *  - at compiel/bundle time, uses 'bundle-loader' to generate lazy-loadable chunks for each locale.
 *  - at run time, provides loadTranslations() method that lazy load locale and helper method to get translated string by key
 */

/* global require, module, jQuery, App */

var Promise = require('es6-promise').Promise;

// Module level variable that stores translations (as key/value object)
var loadedTranslations = null;

/**
 * Loads tranlsations based on the locale and stores it as loadedTranslations variable, that later can be used
 * via getTranslatedString() method.
 * @param {String} locale to be loaded
 * @returns {Promise} the promise that is resolved when translated file is loaded and getTranslatdString can be used.
 */
function loadTranslations(locale) {
  var loc = (locale === 'en_US') ? 'root' : locale;
  return new Promise(function (resolve) {
    jQuery.ajax ({
      url: App.Env.esPluginConfig.pluginHostDomain + '/__VERSION__/nls/' + loc + '/ui-strings.json',
      success: function (jsonBundle) {
        loadedTranslations = jsonBundle;
        resolve(jsonBundle);
      },
      error: function (xhr) {
        console.log("Failed to load nls files with status: "+ xhr.status);
      }
    });
  });
}

/**
 * Returns translated string for a given key
 * @param {String} key that identifies translated string
 * @returns {String} translated string
 */
function getTranslatedString(key) {
  if (loadedTranslations) {
    return loadedTranslations[key];
  }
}

function getTranslatedTemplateFn(key) {
  const template = this.getTranslatedString(key);
  return (...values) => {
    return template.replace(/{(\d)}/g, (_, index) => values[Number(index)]);
  };
}

module.exports = {
  loadTranslations: loadTranslations,
  getTranslatedString: getTranslatedString,
  getTranslatedTemplateFn: getTranslatedTemplateFn
};
