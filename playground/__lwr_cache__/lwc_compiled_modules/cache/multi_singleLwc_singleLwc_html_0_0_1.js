import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./singleLwc.css";

import _implicitScopedStylesheets from "./singleLwc.scoped.css?scoped=true";

import {parseFragment, registerTemplate} from "lwc";
const $fragment1 = parseFragment`<p${3}>single LWC</p>`;
function tmpl($api, $cmp, $slotset, $ctx) {
  const {st: api_static_fragment} = $api;
  return [api_static_fragment($fragment1(), 1)];
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
tmpl.stylesheetToken = "multi-singleLwc_singleLwc";
freezeTemplate(tmpl);
