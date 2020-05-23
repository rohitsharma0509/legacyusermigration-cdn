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

/**
 * List of dependencies on EchoSign javascript code
 */

/* global require */

export const $ = window.$ = require('jquery');
export const jQuery = window.jQuery = require('jquery');

// use backbone defined by es code to avoid version mismatch issues, for ex. when submitting an agreement
// and calling into Collection.reset() that depends on isModel that uses "model instanceof Model" call to
// check if an instance is
export const Backbone = window.Backbone  = require('backbone');

// use underscore defined by es code, for now mostly to keep template interpolation the same ( use {{ }} for data)
export const _ = window._ = require('underscore');