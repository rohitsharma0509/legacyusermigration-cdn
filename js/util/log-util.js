/**
 * This file contains functions to log events on Adobe Analytics
 *
 */

export function logEvent(msg) {
  try {
    window.ScAnalytics.logEvent([msg]);
  } catch (e) {
    console.log(e);
  }
}