"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import Poll from 'src/client/reactive/components/rewritten/poll.js';

class Angle {
  constructor(radians) {
    this.radianMode = true;
    this.radians = radians;
    always: this.degrees = 
      this.radianMode ? this.radians * 180 / Math.Pi : this.degrees;
    always: this.radians = 
      this.radianMode ? this.radians : this.degrees * Math.Pi / 180;
  }
  
  setDegrees(degrees) {
    this.radianMode = false;
    this.degrees = degrees;
  }
  
  setRadians(radians) {
    this.radianMode = true;
    this.radians = radians;
  }
}


export default class PollComponent extends Morph {
  async initialize() {
    this.windowTitle = "Poll Monitor";
    this.aexprs = [];
    
    
    let x = new Angle(1);
    aexpr(() => x.degrees).onChange((v) => lively.notify("Degrees:" + v));
    aexpr(() => x.radians).onChange((v) => lively.notify("Radians:" + v));
    x.setDegrees(180);
    x.setRadians(2);
    
    /*this.poll = this.poll || new Poll();
    
    this.addSuggestion.addEventListener("click", () => {      
      const option = this.poll.options.length;
      const newOptionName = this.colorSuggestion.value;
      this.poll.addOption(newOptionName);
      this.addOption(option);
    })

    always: this.maxVotes = Math.max(1, this.poll.options[this.poll.getBestOption()]);
    
    for (let i = 0; i < this.poll.options.length; i++) {
      this.addOption(i);
    }
    this.replaceMigratableAEs();*/
  }

  addOption(option) {
    const optionName = this.poll.getName(option);
    const div = <div style="width: 100%; height: 30px; display: flex;  align-items: center">       
      <p style="width:80px">{optionName}</p>
    </div>;
    const button = <button click={() => this.poll.addVoteToOption(option)}>
      Add Vote
    </button>;

    const input = <input type="number" name="Votes" min="0" value="0" style="width:40px"></input>;

    always: input.value = this.poll.options[option].toString();
    always: this.poll.options[option] = parseInt(input.value);
    
    const bar = <div style="background-color:#555; height: 20px"></div>;
    this.aexprs.push(aexpr(() => this.poll.options[option] / this.maxVotes).dataflow(percentage => {
      if (!(percentage >= 0 && percentage <= 1)) lively.error('Percentage is not between 0 and 1: ' + percentage);
      bar.style.width = percentage * 300 + "px";
    }));
    div.append(button);
    div.append(input);

    div.append(bar);
    this.main.append(div);
  }

  get main() {
    return this.get("#main");
  }

  get colorSuggestion() {
    return this.get("#colorSuggestion");
  }

  get addSuggestion() {
    return this.get("#addSuggestion");
  }

  async livelyExample() {}

  registerDatabinding(aexpr, name) {
    this.aexprs.push(aexpr);
  }

  livelyPreMigrate(other) {
    this.disposeBindings();
  }

  livelyMigrate(other) {
    this.migratedAexprs = other.aexprs;
    this.poll = other.poll;
  }

  replaceMigratableAEs() {
    if (!this.migratedAexprs) return;
    if (this.migratedAexprs.length === this.aexprs.length) {
      for (let i = 0; i < this.aexprs.length; i++) {
        const ae = this.aexprs[i],
              migrated = this.migratedAexprs[i];
        if (ae.func.toString() === migrated.func.toString()) {
          ae.migrateEvents(migrated);
        }
      }
    }
    this.migratedAexprs = undefined;
    return;
  }

  detachedCallback() {
    this.disposeBindings();
  }

  disposeBindings() {
    this.aexprs.forEach(ae => ae.dispose());
  }
}