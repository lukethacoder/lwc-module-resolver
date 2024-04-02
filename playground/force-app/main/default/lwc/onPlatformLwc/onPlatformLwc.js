import { LightningElement } from 'lwc'
import { printText } from 'c/utils'

import { add } from 'multi/utils'

export default class OnPlatformLwc extends LightningElement {
  renderedCallback() {
    console.warn('hello world... from "on platform" LWC')
    printText('hello world')
    console.log('add(1, 2) ', add(1, 2))
  }
}
