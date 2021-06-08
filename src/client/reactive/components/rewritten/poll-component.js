"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import Poll from 'src/client/reactive/components/rewritten/poll.js';


export default class PollComponent extends Morph {
  async initialize() {
    lively.notify("init");
    this.windowTitle = "Poll Monitor";
    this.aexprs = [];
    this.poll = this.poll || new Poll(3);
    
    // always: let maxVotes = Math.max(...this.poll.options);
    // always: let maxVotes = this.poll.getBestOption();
    // always: let maxVotes = this.poll.values[this.poll.getBestOption()];
    // always: let maxVotes = this.poll.options[this.poll.getBestOption()];
    always: this.votes = Math.max(1, this.poll.options[this.poll.getBestOption()]);
    // = () => maxVotes;
    for (let i = 0; i < this.poll.options.length; i++) {
      this.addOption(i);
    }
    this.replaceMigratableAEs();
  }
  
  addOption(option) {
    const div = <div style="width: 100%; height: 30px; display: flex;  align-items: center">       
      Option {option}
      
    </div>;
    const button = <button click={() => this.poll.addVoteToOption(option)}>
      Add Vote
    </button>;
    
    const bar = <div style="background-color:#555; height: 20px"></div>;
    this.aexprs.push(aexpr(() => this.poll.options[option] / this.votes).dataflow((percentage) => {
      if(!(percentage >= 0 && percentage <= 1)) lively.error('Percentage is not between 0 and 1: ' + percentage);
      bar.style.width = (percentage * 300) + "px";
    }));
    div.append(button)
    
    div.append(bar)
    this.main.append(div);
  }
  
  get main() {
    return this.get("#main");
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
    if(!this.migratedAexprs) return;
    if(this.migratedAexprs.length === this.aexprs.length) {
      for(let i = 0; i < this.aexprs.length; i++) {
        const ae = this.aexprs[i], migrated = this.migratedAexprs[i];
        if(ae.func.toString() === migrated.func.toString()) {
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