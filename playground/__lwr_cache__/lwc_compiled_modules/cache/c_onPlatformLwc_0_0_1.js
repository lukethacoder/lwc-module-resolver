import _tmpl from "./onPlatformLwc.html";
import { registerComponent as _registerComponent, LightningElement } from "lwc";
class OnPlatformLwc extends LightningElement {
  renderedCallback() {
    console.warn('hello world... from "on platform" LWC');
  }
  /*LWC compiler v2.38.1*/
}
export default _registerComponent(OnPlatformLwc, {
  tmpl: _tmpl
});