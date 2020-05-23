/**
 * This file contains environment specific variables
 *
 */

export function getEndpoints(env) {
  switch(env) {
    case 'prod':
      return {
        regularAnnualOfferPricingUrl: "https://bps-il.adobe.io/jil-api/offers/1F61C22FE9B64715930972A648B9DF78?service_providers=PRICING&country={0}&locale={1}&show_availability_dates=false&api_key=dc-prod-sign-jil",
        promoAnnualOfferPricingUrl: "https://bps-il.adobe.io/jil-api/offers/2A02777A415E0FBCF8E64199394D7CA6?service_providers=PRICING&country={0}&locale={1}&show_availability_dates=false&api_key=dc-prod-sign-jil"
      };
    case 'stage':
    case 'awspreview':
    case 'awsperf':
      return {
        regularAnnualOfferPricingUrl: "https://bps-il-stage.adobe.io/jil-api/offers/1F61C22FE9B64715930972A648B9DF78?service_providers=PRICING&country={0}&locale={1}&show_availability_dates=false&api_key=dc-stage-sign-jil",
        promoAnnualOfferPricingUrl: "https://bps-il-stage.adobe.io/jil-api/offers/2A02777A415E0FBCF8E64199394D7CA6?service_providers=PRICING&country={0}&locale={1}&show_availability_dates=false&api_key=dc-stage-sign-jil"
      };
    default:
      return {
        regularAnnualOfferPricingUrl: "https://bps-il-stage.adobe.io/jil-api/offers/1F61C22FE9B64715930972A648B9DF78?service_providers=PRICING&country={0}&locale={1}&show_availability_dates=false&api_key=dc-stage-sign-jil",
        promoAnnualOfferPricingUrl: "https://bps-il-stage.adobe.io/jil-api/offers/2A02777A415E0FBCF8E64199394D7CA6?service_providers=PRICING&country={0}&locale={1}&show_availability_dates=false&api_key=dc-stage-sign-jil"
      };
  }
}