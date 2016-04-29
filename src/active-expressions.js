
import {ActiveDOMView} from './active-view.js';

export function select(selectorOrClass, filterFunction) {
  if (typeof selectorOrClass !== 'string') {
    throw 'activeExpressions.select: Classes are currently not supported';
  } else {
    let view = new ActiveDOMView(selectorOrClass, filterFunction);
    return view;
  }
}
