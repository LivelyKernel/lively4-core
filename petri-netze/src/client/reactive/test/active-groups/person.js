"enable aexpr";

import { trackInstance } from 'active-group';

export default class Person {
  constructor(name, title) {
    this.name = name;
    this.setTitle(title);
    trackInstance.call(Person, this);
  }

  getName() {
    return this.name;
  }
  setTitle(title) {
    this.title = title || Person.NoTitle;
  }
}

Person.NoTitle = '';
Person.Dr = 'Dr.';
Person.Prof = 'Prof.';
