/**
 * Migration modal shows when billing is about to expired or expired.
 * Modal appears after the user has logged in.
 *
 */
/* global App */
import '../../css/styles.css';
import UiStrings from '../nls/ui-strings';
import './download-csv-modal';
import {logEvent} from '../util/log-util';

var ModalConfig = App.Env.esPluginConfig;
var migrationWindowEnded = (ModalConfig.migrationStatus == 'MIGRATION_WINDOW_ENDED_FOR_TEAM_ACCOUNT' || ModalConfig.migrationStatus == 'MIGRATION_WINDOW_ENDED_FOR_MULTIUSER_PRO_ACCOUNT') ? true : false;
var isDowngraded = (ModalConfig.migrationStatus == 'DOWNGRADED_TEAM_TO_FREE' || ModalConfig.migrationStatus == 'DOWNGRADED_MULTIUSER_PRO_TO_FREE') ? true : false;

(function() {

  var AdobeIdModal = App.Views.ModalView.extend({

    template: App.Templates.Esign.CreateAdobeIdModal,

    defaults: {
      title: '',
      hasFooter: false,
      close: ModalConfig.isDismissible,
      hasHeaderDivider: false,
      backdrop: 'static',
      keyboard: false,
      enterSubmits: false,
      onClose: function() {
        logEvent("CreateAdobeIdModalClosed");
        App.Utils.loadPage(App.Utils.joinUrl(App.Env.root,'public/login'));
      }
    },

    initialize: function() {
      this._super();
      this.defaults.hasHeaderDivider = false;
    },

    toTemplate: function() {
      return {
        adobeIdModalHeader: UiStrings.getTranslatedString('adobeIdModalHeader'),
        contactAdminMsg: UiStrings.getTranslatedString('contactAdminMsg'),
        getStartedBtn: UiStrings.getTranslatedTemplateFn('getStartedBtn')(ModalConfig.createAdobeIDUrl)
      };
    },

    render: function() {
      this._super();
      this.$modalContent = this.$el.find('.modal-content');
      if(isDowngraded || migrationWindowEnded) {
        this.$(".migration-modal-content").html("<p>"+UiStrings.getTranslatedString('createAdobeIdMsgAfterDowngraded')+"</p>");
      } else {
        this.$(".migration-modal-content").html("<p>"+UiStrings.getTranslatedString('createAdobeIdMsg')+"</p>");
      }
      return this;
    }

  });

  // export
  App.ns('Views.Esign').AdobeIdModal = AdobeIdModal;
}());