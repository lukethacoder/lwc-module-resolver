import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./app.css";

import _implicitScopedStylesheets from "./app.scoped.css?scoped=true";

import _cOnPlatformLwc from "c/onPlatformLwc";
import _multiSingleLwc from "multi/singleLwc";
import _multiSingleLwcTwo from "multi/singleLwcTwo";
import {parseFragment, registerTemplate} from "lwc";
const $fragment1 = parseFragment`<h1${3}>Playground</h1>`;
const $fragment2 = parseFragment`<h2${3}>Showcase module resolution</h2>`;
const stc0 = {
  key: 0
};
const stc1 = {
  key: 5
};
const stc2 = {
  key: 6
};
const stc3 = {
  key: 7
};
function tmpl($api, $cmp, $slotset, $ctx) {
  const {st: api_static_fragment, c: api_custom_element, h: api_element} = $api;
  return [api_element("main", stc0, [api_static_fragment($fragment1(), 2), api_static_fragment($fragment2(), 4), api_custom_element("c-on-platform-lwc", _cOnPlatformLwc, stc1), api_custom_element("multi-single-lwc", _multiSingleLwc, stc2), api_custom_element("multi-single-lwc-two", _multiSingleLwcTwo, stc3)])];
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
tmpl.stylesheetToken = "playground-app_app";
freezeTemplate(tmpl);
