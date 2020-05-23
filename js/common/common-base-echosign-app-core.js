/*
 * ************************************************************************
 *  ADOBE CONFIDENTIAL
 *  ___________________
 *
 *   Copyright 2018 Adobe Systems Incorporated
 *   All Rights Reserved.
 *
 *  NOTICE:  All information contained herein is, and remains
 *  the property of Adobe Systems Incorporated and its suppliers,
 *  if any.  The intellectual and technical concepts contained
 *  herein are proprietary to Adobe Systems Incorporated and its
 *  suppliers and are protected by all applicable intellectual property
 *  laws, including trade secret and copyright laws.
 *  Dissemination of this information or reproduction of this material
 *  is strictly forbidden unless prior written permission is obtained
 *  from Adobe Systems Incorporated.
 * ************************************************************************
 */
/* global App */

import '../../js/dc-libs/js/echosign/javascript/app/app.js';
import '../../js/dc-libs/init-env';
import 'as-ui-common/dist/as-ui-common';

// override the method defined in app-utils.js in the monolith which changes the width
// of the header and footer when the iOS keyboard is opened. This causes an issue since
// the #mainContent width doesn't change width. The problem is even worst when the content
// is zoomed since it makes the header/footer even longer which result is a 'Done' button
// hard to reach (require a lot of horizontal scrolling)
export const Modal = App.Views.ModalView;
