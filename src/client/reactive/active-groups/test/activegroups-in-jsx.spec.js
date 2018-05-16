"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select, { trackInstance } from 'active-groups';

describe('Active Groups in JSX support', function() {
  it('list example', function() {
    class Person {
      constructor(name) {
        this.name = name;
        trackInstance.call(Person, this);
      }
      toString() { return this.name; }
    }

    let alex = new Person("Alex"),
        adam = new Person("Adam"),
        bernd = new Person("Bernd");
    let startLetter = "A";

    let personList = select(Person)
      .filter(p => p.name.startsWith(startLetter))
      .map(p => <li>{p.name}</li>);

    let list = <ul>
      <li>First Element</li>
      {...personList}
      <li>Last Element</li>
     </ul>;
           
    function labels() {
      return Array.from(list.querySelectorAll("li"))
        .map(i => i.innerHTML);
    }

    expect(labels()).to.have.length(4);
    expect(labels()[0]).to.equal("First Element");
    expect(labels()[1]).to.equal("Alex");
    expect(labels()[2]).to.equal("Adam");
    expect(labels()[3]).to.equal("Last Element");

    new Person("Alister");
    expect(labels()).to.have.length(5);
    expect(labels()[0]).to.equal("First Element");
    expect(labels()[1]).to.equal("Alex");
    expect(labels()[2]).to.equal("Adam");
    expect(labels()[3]).to.equal("Alister");
    expect(labels()[4]).to.equal("Last Element");

    
    adam.name = "Brian";
    expect(labels()).to.have.length(4);
    expect(labels()[0]).to.equal("First Element");
    expect(labels()[1]).to.equal("Alex");
    expect(labels()[2]).to.equal("Alister");
    expect(labels()[3]).to.equal("Last Element");

    startLetter = "B";
    expect(labels()).to.have.length(4);
    expect(labels()[0]).to.equal("First Element");
    expect(labels()[1]).to.equal("Brian");
    expect(labels()[2]).to.equal("Bernd");
    expect(labels()[3]).to.equal("Last Element");
  });
});
