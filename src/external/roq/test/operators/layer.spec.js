import withLogging from '../../src/withlogging.js';
import select from '../../src/select.js';
import Person from '../fixtures/person.js';

describe('.layer operators', function() {
    xit('Person layer example', function() {

        withLogging.call(Person);

        var jenkinsName = 'Jenkins';
        var travisName = 'Travis';
        var jenkins = new Person(jenkinsName);
        var travis = new Person(travisName, Person.Dr);

        console.log(jenkins, travis);

        var drRefinement = {
            getName: function() {
                return Person.Dr + ' ' + cop.proceed();
            }
        };

        var TestLayer = new Layer('WHAT?')
            .refineObject(travis, drRefinement);
        console.log(TestLayer);
        //TestLayer.beGlobal();
        var doctors = select(Person, function(p) {
            return p.title === Person.Dr;
        }, locals)
            .layer(drRefinement);

        expect(jenkins.getName()).to.equal(jenkinsName);
        expect(travis.getName()).to.equal(Person.Dr + ' ' + travisName);
        console.log(travis.getName());
        travis.setTitle(Person.NoTitle);
        expect(travis.getName()).to.equal(travisName);
        console.log(travis.getName());

        var herukoName = 'Heruko';
        var heruko = new Person(herukoName, Person.Dr);

        console.log(heruko);
        expect(heruko.getName()).to.equal(Person.Dr + ' ' + herukoName);
    });
});
