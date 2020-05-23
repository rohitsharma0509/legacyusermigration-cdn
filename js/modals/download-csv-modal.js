/**
 * Migration modal shows when billing is about to expired or expired.
 * Modal appears after the user has logged in.
 *
 */
/* global App */
import '../../css/styles.css';
import UiStrings from '../nls/ui-strings';
import {logEvent} from "../util/log-util";

var ModalConfig = App.Env.esPluginConfig;

(function() {

  var DownloadCsvModal = App.Views.ModalView.extend({
    template: App.Templates.Esign.TeamMigrationDownloadCsvModal,

    defaults: {
      title: ' ',
      hasFooter: false,
      close: ModalConfig.isDismissible,
      hasHeaderDivider: false,
      backdrop: 'static',
      keyboard: false,
      enterSubmits: false,
      onClose: function() {
        logEvent("DownloadCsvModalClosed");
        App.Utils.loadPage(App.Utils.joinUrl(App.Env.root,'public/login'));
      }
    },

    events: {
      "click .download-link": "downloadUserList",
      "click .skip-download-link": "logEventForSkipDownload",
      "click .faq-content": "logEventForFaq"
    },

    initialize: function() {
      this.defaults.hasHeaderDivider = false;
      this._super();
    },

    toTemplate: function() {
      return {
        downloadCsvModalHeader: UiStrings.getTranslatedString('downloadCsvModalHeader'),
        downloadCsvMsg1: UiStrings.getTranslatedString('downloadCsvMsg1'),
        downloadCsvMsg2: UiStrings.getTranslatedString('downloadCsvMsg2'),
        licenseCount: ModalConfig.currentLicenseCount,
        downloadBtn: UiStrings.getTranslatedTemplateFn('downloadBtn')(ModalConfig.purchaseUrl),
        skipDownloadBtn: UiStrings.getTranslatedTemplateFn('skipDownloadBtn')(ModalConfig.purchaseUrl),
        faqContent: UiStrings.getTranslatedTemplateFn('faqContent')(ModalConfig.faqUrl)
      };
    },

    render: function() {
      this._super();
      this.$modalContent = this.$el.find('.modal-content');
      return this;
    },

    downloadUserList: function() {
      window.open(ModalConfig.downloadUserListUrl, '_blank');
    },

    logEventForFaq: function() {
      logEvent("TeamMigFaqLinkClicked");
    },

    logEventForSkipDownload: function() {
      logEvent("SkipDownloadBtnClicked");
    }
  });

  // export
  App.ns('Views.Esign').DownloadCsvModal = DownloadCsvModal;
}());