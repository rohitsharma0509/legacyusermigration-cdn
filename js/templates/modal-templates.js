/* global App, _ */
(function() {
  var tmpl = {};

  tmpl.PurchaseModalWithCreateAdobeIdOption =
      '<div align="left">' +
      '<div class="migration-header"><div class="warning-icon"></div><div class="header-warn-msg">{{purchaseModalHeader}}</div></div>' +
      '<div class="migration-modal-content"><p>{{purchaseMsg}}</p><p id="price-msg"></p></div>' +
      '<div class="rounded-btn"><a class="buy-now-btn" href="#">{{buyNowBtnText}}</a></div>' +
      '<div class="migration-action"><p class="migration-action-content"></p></div>' +
      '<div class="faq-content">{{faqContent}}</div>' +
      '<div class="billing-detail"><span id="billing-msg2"></span> <span id="billing-msg3"></span></div></div>';

  tmpl.PurchaseModalWithoutCreateAdobeIdOption =
      '<div align="left">' +
      '<div class="migration-header"><div class="header-msg">{{welcomeMsgForFreeAccount}}</div></div>' +
      '<div class="migration-modal-content"><p>{{purchaseMsg}}</p><p id="price-msg"></p></div>' +
      '<div class="rounded-btn"><a class="buy-now-btn" href="#">{{buyNowBtnText}}</a></div>' +
      '<div class="faq-content">{{faqContent}}</div>' +
      '<div class="billing-detail"><span id="billing-msg2"></span> <span id="billing-msg3"></span></div></div>';

  tmpl.TeamMigrationDownloadCsvModal =
      '<div align="left">' +
      '<div class="migration-header"><div class="header-msg">{{downloadCsvModalHeader}}</div></div>' +
      '<div class="migration-modal-content"><p>{{downloadCsvMsg1}}</p><p>{{downloadCsvMsg2}}{{licenseCount}}</p></div>' +
      '<div class="download-options">' +
      '<div class="rounded-primary-inline-btn">{{skipDownloadBtn}}</div>' +
      '<div class="rounded-inline-btn">{{downloadBtn}}</div>' +
      '</div>' +
      '<div class="faq-content">{{faqContent}}</div>' +
      '</div>';

  tmpl.CreateAdobeIdModal =
      '<div align="left">' +
      '<div class="migration-header"><div class="warning-icon"></div><div class="header-warn-msg">{{adobeIdModalHeader}}</div></div>' +
      '<div class="migration-modal-content"></div>'+
      '<div class="rounded-btn">{{getStartedBtn}}</div>'+
      '</div>';

  App.Templates.Esign = _.extend(App.Templates.Esign || {}, tmpl);
})();