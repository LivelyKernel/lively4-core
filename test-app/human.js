// es6 application code

export default class Human {
    constructor (firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    };
    toString () {
        return this.firstName + " " + this.lastName;
    }
}
