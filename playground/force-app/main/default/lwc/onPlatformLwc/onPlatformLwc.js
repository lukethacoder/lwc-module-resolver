import { LightningElement } from 'lwc'

export default class OnPlatformLwc extends LightningElement {
  renderedCallback() {
    console.warn('hello world... from "on platform" LWC')
  }
}
