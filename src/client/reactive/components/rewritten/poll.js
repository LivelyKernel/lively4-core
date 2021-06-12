"enable aexpr"
export default class Poll {
  constructor() {
    this.options = [];
    this.names = [];
  }
  
  getName(index) {
    return this.names[index];  
  }
  
  addOption(name) {
    this.options.push(0);
    this.names.push(name);
  }
  
  addVoteToOption(index) {
    this.options[index]++;
  }
  
  getBestOption() {
    let index = 0;
    let val = this.options[index];
    let i = 0;
    for(; i < this.options.length; i++) {
      if(this.options[i] > val) {
        index = i;
        val = this.options[i];
      }
    }
    return index;
  }
}