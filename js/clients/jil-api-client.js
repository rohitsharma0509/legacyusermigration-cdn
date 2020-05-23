/**
 * This contains method to call JIL API for product pricing details
 *
 */
/* global App */
import {getEndpoints} from '../api-urls';
import UiStrings from '../nls/ui-strings';
import Backbone from '../dc-libs/js/xlibs/backbone/backbone.js';
import {logEvent} from "../util/log-util";

var ModalConfig = App.Env.esPluginConfig;

var getOffers = function (apiUrl) {
  var Offers = Backbone.Model.extend({
    urlRoot: apiUrl
  });

  var OfferCollection = Backbone.Collection.extend({
    model: Offers,
    url: apiUrl
  });

  var collection = new OfferCollection();
  return collection.fetch({
    headers: {
      "Accept": "application/json"
    },
    success: function (response) {
      return response;
    },
    error: function (response, xhr) {
      console.log("Failed to call JIL API with response: "+xhr.status);
      logEvent("FailedToGetTeamOfrPrice");
      return response;
    }
  });
};

var getPriceFromResponse = function(response) {
  var offerPrices = {
    price: "",
    taxLabel: ""
  }, offerDetail, displayRules, currencyDetail;

  offerDetail = ((response || [])[0] || {});
  displayRules = ((((((offerDetail || {}).pricing || {}).prices || [])[0] || {}).price_details || {}).display_rules || {});
  currencyDetail = (((offerDetail || {}).pricing || {}).currency || {});
  var price = (displayRules.price || "");
  price =  price != "" ? price.toFixed(2).toString() : "";

  if(Object.keys(currencyDetail).length > 0) {
    var delimiter = (currencyDetail.delimiter || "");
    var formatString = (currencyDetail.format_string || "");

    if(delimiter != "") {
      price = price.replace('.', delimiter);
    }
    if(formatString.indexOf('#') == 0) {
      price = price.concat(' ').concat(currencyDetail.symbol);
    } else {
      price = currencyDetail.symbol.concat(price);
    }
  }
  offerPrices.price = price;
  offerPrices.taxLabel = displayRules.tax == 'included' ? UiStrings.getTranslatedString("includingTax") : UiStrings.getTranslatedString("excludingTax");
  return offerPrices;
};

function getFormattedUrl(url) {
    return (...values) => {
        return url.replace(/{(\d)}/g, (_, index) => values[Number(index)]);
    };
}

export function getPrices(callback) {
    var offerPrices = {
        annualPromoPrice: "",
        taxLabelAnnualPromo: "",
        annualRegularPrice: "",
        taxLabelAnnualRegular: ""
    };

    var locale = ModalConfig.country.toUpperCase() + "_" + ModalConfig.language;

    var promoPricingApiUrl = getEndpoints(ModalConfig.environment).promoAnnualOfferPricingUrl;
    var regularPricingApiUrl = getEndpoints(ModalConfig.environment).regularAnnualOfferPricingUrl;

    var formattedPromoPricingApiUrl = getFormattedUrl(promoPricingApiUrl)(ModalConfig.country.toUpperCase(), locale);
    var formattedRegularPricingApiUrl = getFormattedUrl(regularPricingApiUrl)(ModalConfig.country.toUpperCase(), locale);

    Promise.all([getOffers(formattedPromoPricingApiUrl), getOffers(formattedRegularPricingApiUrl)]).then(response => {
        //if all loaded
        var annualPromoPrices = getPriceFromResponse(response[0]);
        offerPrices.annualPromoPrice = annualPromoPrices.price;
        offerPrices.taxLabelAnnualPromo = annualPromoPrices.taxLabel;

        var annualRegularPrices = getPriceFromResponse(response[1]);
        offerPrices.annualRegularPrice = annualRegularPrices.price;
        offerPrices.taxLabelAnnualRegular = annualRegularPrices.taxLabel;

        callback(offerPrices);
    }, response => {
        console.log(response);
        callback(offerPrices);
    });
}