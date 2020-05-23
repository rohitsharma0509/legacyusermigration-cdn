/**
 * Migration modal shows when billing is about to expired or expired.
 * Modal appears after the user has logged in.
 *
 */
/* global App */

import './templates/modal-templates.js';
import UiStrings from './nls/ui-strings';
import './modals/purchase-modal';
import './modals/create-adobe-id-modal';

var ModalConfig = App.Env.esPluginConfig;

var supportedLocales = ["ca_ES", "cs_CZ", "da_DK", "de_DE", "en_GB", "es_ES", "eu_ES", "en_US", "fi_FI", "fr_FR", "hr_HR", "hu_HU", "in_ID", "is_IS", "it_IT", "ja_JP", "ko_KR", "ms_MY", "nb_NO", "nl_NL", "nn_NO", "no_NO", "pl_PL", "pt_BR", "pt_PT", "ro_RO", "ru_RU", "sk_SK", "sl_SI", "sv_SE", "th_TH", "tr_TR", "uk_UA", "vi_VN", "zh_CN", "zh_TW", "zz_ZZ"];

window.fnTeamMigrationPluginStart = function startApp() {
  var locale = ModalConfig.language.toLowerCase() + "_" + ModalConfig.country.toUpperCase();
  var language = supportedLocales.indexOf(locale) > -1 ? locale : 'en_US';

  // loadLanguage need to be called only once (once language is selected)
  UiStrings.loadTranslations(language).then(function () {
    if(ModalConfig.showLegacyTeamMigrationPurchaseOptionModal) {
      var PurchaseModal = new App.Views.Esign.PurchaseModal({
        close: ModalConfig.isDismissible
      });
      PurchaseModal.render();
      PurchaseModal.show();
    } else if(ModalConfig.showLegacyTeamMigrationAdobeIdOptionModal) {
      var AdobeIdModal = new App.Views.Esign.AdobeIdModal({
        close: ModalConfig.isDismissible
      });
      AdobeIdModal.render();
      AdobeIdModal.show();
    }
  });
};