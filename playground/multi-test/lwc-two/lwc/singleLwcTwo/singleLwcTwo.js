import { LightningElement } from 'lwc'

export default class SingleLwcTwo extends LightningElement {
  renderedCallback() {
    console.warn('hello world')
  }
}
