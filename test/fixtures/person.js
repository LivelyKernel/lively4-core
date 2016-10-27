define(function module() {

  var Person = function() { this.initialize.apply(this, arguments); };

  Person.NoTitle = '';
  Person.Dr = 'Dr.';
  Person.Prof = 'Prof.';

  Person.prototype.initialize = function(name, title) {
    this.name = name;
    this.setTitle(title);
  };
  Person.prototype.getName = function() {
    return this.name;
  };
  Person.prototype.setTitle = function(title) {
    this.title = title || Person.NoTitle;
  };

  return {
    Person: Person
  };
});
