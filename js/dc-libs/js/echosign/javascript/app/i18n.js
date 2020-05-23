/**
 * i18n helper
 *
 * usage: i18n('some_key', param, ...) === i18n.js.some_key(param, ...)
 *
 * Returns 'some_key' if translation is not found.  Looks up in i18n.js and
 * i18n.common.
 */

/* global i18n:true */

(function() {

  var i18nTemp = function (key) {
    return (i18n.js[key] || i18n.common[key]).apply(null, _.rest(arguments));
  };
  _.extend(i18nTemp, i18n);

  i18n = i18nTemp;

  // get an i18n function for key
  i18n.curry = function (key) {
    if (_.isFunction(key)) return key;
    return _.partial(i18n, key);
  };

})();
