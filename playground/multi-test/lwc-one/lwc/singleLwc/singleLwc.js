import { LightningElement } from 'lwc'

export default class SingleLwc extends LightningElement {
  renderedCallback() {
    console.warn('hello world')
  }
}
