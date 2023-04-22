import _tmpl from "./singleLwcTwo.html";
import { registerComponent as _registerComponent, LightningElement } from "lwc";
class SingleLwcTwo extends LightningElement {
  renderedCallback() {
    console.warn('hello world');
  }
  /*LWC compiler v2.38.1*/
}
export default _registerComponent(SingleLwcTwo, {
  tmpl: _tmpl
});