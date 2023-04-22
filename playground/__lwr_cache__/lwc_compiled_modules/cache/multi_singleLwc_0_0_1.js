import _tmpl from "./singleLwc.html";
import { registerComponent as _registerComponent, LightningElement } from "lwc";
class SingleLwc extends LightningElement {
  renderedCallback() {
    console.warn('hello world');
  }
  /*LWC compiler v2.38.1*/
}
export default _registerComponent(SingleLwc, {
  tmpl: _tmpl
});