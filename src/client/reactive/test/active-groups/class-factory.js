"enable aexpr";

import { trackInstance } from 'active-groups';

export function getValueClass() {
  return class ValueClass {
    constructor(value) {
      this.value = value;
      trackInstance.call(ValueClass, this);
    }
  }
}
