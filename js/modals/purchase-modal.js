/**
 * Migration modal shows when billing is about to expired or expired.
 * Modal appears after the user has logged in.
 *
 */
/* global App */
import '../../css/styles.css';
import UiStrings from '../nls/ui-strings';
import './download-csv-modal';
import {getPrices} from '../clients/jil-api-client';
import {logEvent} from '../util/log-util';

var ModalConfig = App.Env.esPluginConfig;
var migrationWindowEnded = (ModalConfig.migrationStatus == 'MIGRATION_WINDOW_ENDED_FOR_TEAM_ACCOUNT' || ModalConfig.migrationStatus == 'MIGRATION_WINDOW_ENDED_FOR_MULTIUSER_PRO_ACCOUNT') ? true : false;
var isDowngraded = (ModalConfig.migrationStatus == 'DOWNGRADED_TEAM_TO_FREE' || ModalConfig.migrationStatus == 'DOWNGRADED_MULTIUSER_PRO_TO_FREE') ? true : false;

(function() {

  var PurchaseModal = App.Views.ModalView.extend({

    defaults: {
      title: '',
      hasFooter: false,
      close: ModalConfig.isDismissible,
      hasHeaderDivider: false,
      backdrop: 'static',
      keyboard: false,
      enterSubmits: false,
      onClose: function() {
        logEvent("PurchaseModalClosed");
        App.Utils.loadPage(App.Utils.joinUrl(App.Env.root,'public/login'));
      }
    },

    events: {
      "click .buy-now-btn": "buyNow",
      "click .faq-content": "logEventForFaq"
    },

    initialize: function() {
      this._super();
      this.template = this.getModalTemplate();
    },

    toTemplate: function() {
      return {
          welcomeMsgForFreeAccount: UiStrings.getTranslatedString('welcomeMsgForFreeAccount'),
          purchaseModalHeader: UiStrings.getTranslatedString('purchaseModalHeader'),
          purchaseMsg: UiStrings.getTranslatedString('purchaseMsg'),
          buyNowBtnText: UiStrings.getTranslatedString('buyNowBtnText'),
          faqContent: UiStrings.getTranslatedTemplateFn('faqContent')(ModalConfig.faqUrl)
      };
    },

    render: function() {
      this._super();
      getPrices(this.setOfferPrices.bind(this));
      this.$modalContent = this.$el.find('.modal-content');
      this.$(".migration-action-content").html(UiStrings.getTranslatedTemplateFn('migrationActionMsg')(ModalConfig.createAdobeIDUrl));
      if(migrationWindowEnded) {
        this.$("#billing-msg3").text(UiStrings.getTranslatedString('billingMsg1'));
      } else {
        if(ModalConfig.isAdobeIdCreated) {
            this.$(".migration-action").html("");
        }
        this.$("#billing-msg3").html(UiStrings.getTranslatedTemplateFn('billingMsg3')(ModalConfig.faqUrl));
      }
      return this;
    },

    buyNow: function() {
      if(ModalConfig.numOfActiveUsers == 1){
        window.location.href = ModalConfig.purchaseUrl;
      } else {
        this.hide();
        var DownloadCsvModal = new App.Views.Esign.DownloadCsvModal({
          close: this.close
        });
        DownloadCsvModal.render();
        DownloadCsvModal.show();
      }
    },

    getModalTemplate: function() {
      var tmpl;

      if((migrationWindowEnded || isDowngraded) && ModalConfig.isAdobeIdCreated) {
        tmpl = App.Templates.Esign.PurchaseModalWithoutCreateAdobeIdOption;
      } else {
        tmpl = App.Templates.Esign.PurchaseModalWithCreateAdobeIdOption;
      }
      return tmpl;
    },

    setOfferPrices: function(offerPrices) {
      var priceMsg;
      if(migrationWindowEnded) {
        priceMsg = this.getPriceMessage(UiStrings.getTranslatedTemplateFn('regularPriceMsg')(offerPrices.annualRegularPrice, offerPrices.taxLabelAnnualRegular), offerPrices.annualRegularPrice);
      } else {
        priceMsg = this.getPriceMessage(UiStrings.getTranslatedTemplateFn('promotionalPriceMsg')(offerPrices.annualPromoPrice, offerPrices.taxLabelAnnualPromo), offerPrices.annualPromoPrice);
        var billingMsg = this.getPriceMessage(UiStrings.getTranslatedTemplateFn('billingMsg2')(offerPrices.annualRegularPrice, offerPrices.taxLabelAnnualRegular), offerPrices.annualRegularPrice);
        this.$("#billing-msg2").text(billingMsg);
      }
      this.$("#price-msg").text(priceMsg);
    },

    getPriceMessage: function(msg, price) {
      if(price == "") {
        return "";
      } else {
        return msg;
      }
    },

    logEventForFaq: function() {
      logEvent("TeamMigFaqLinkClicked");
    }
  });

  // export
  App.ns('Views.Esign').PurchaseModal = PurchaseModal;
}());