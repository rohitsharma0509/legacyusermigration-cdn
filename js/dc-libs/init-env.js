/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2016 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by all applicable intellectual property laws,
 * including trade secret and or copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

/* eslint  new-cap:0*/


// load 3rd party libs, we load echosign versions of the libs, because we focus on OnlyISign for now
// but in theory we can just use default unmodified libs
import "./js/xlibs/underscore/underscore";
import "./js/xlibs/underscore/underscoreSettings";
import "./js/xlibs/jquery2/jquery2";
import "./js/xlibs/jquery2/jquery2-ui-core-interactions";
import "./js/xlibs/jquery2/jquery.browser";
import "./js/xlibs/backbone/backbone";
import "./js/xlibs/backbone/backbone-super";
import "./js/xlibs/mobile-detect/mobile-detect";

import "as-ui-bootstrap-spectrum/dist/css/bootstrap-spectrum.css";
import "as-ui-bootstrap-spectrum/dist/js/bootstrap";

import "./js/echosign/javascript/i18n1";
import "./js/echosign/javascript/app/i18n";

import "./js/echosign/javascript/app/common/app.env";
import "./js/echosign/javascript/app/common/app.utils";
import "./js/echosign/javascript/app/common/common";

// we don't import as-ui-common lib into dc-bundle but still need one class for as-ui-agreement to work
// so manually pull this file here
import "./js/echosign/javascript/backgrid/backgrid";
import "./js/echosign/javascript/backgrid/plugins/backgrid-select-all.js";
import "./js/echosign/javascript/backgrid/plugins/backgrid-filter.js";
