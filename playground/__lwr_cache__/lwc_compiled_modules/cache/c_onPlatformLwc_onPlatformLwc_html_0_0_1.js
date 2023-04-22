import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./onPlatformLwc.css";

import _implicitScopedStylesheets from "./onPlatformLwc.scoped.css?scoped=true";

import {registerTemplate} from "lwc";
function tmpl($api, $cmp, $slotset, $ctx) {
  const {t: api_text} = $api;
  return [api_text("simulating an on platform LWC")];
  /*LWC compiler v2.38.1*/
}
export default registerTemplate(tmpl);
tmpl.stylesheets = [];


if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}
if (_implicitScopedStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitScopedStylesheets);
}
tmpl.stylesheetToken = "c-onPlatformLwc_onPlatformLwc";
freezeTemplate(tmpl);
