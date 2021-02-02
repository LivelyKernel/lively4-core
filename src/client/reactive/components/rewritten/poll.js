"enable aexpr"
export default class Poll {
  constructor(amount) {
    this.options = [];
    for(let i = 0; i < amount; i++) {
      this.options.push(0);
    }
  }
  
  addVoteToOption(index) {
    this.options[index]++;
  }
  
  getBestOption() {
    let index = 0;
    let val = this.options[index];
    for(let i = 0; i < this.options.length; i++) {
      if(this.options[i] > val) {
        index = i;
        val = this.options[i];
      }
    }
    return index;
  }
}