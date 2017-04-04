export default class Person {
  constructor() { this.initialize.apply(this, arguments); }

  initialize(name, title) {
    this.name = name;
    this.setTitle(title);
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