"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
class Node {
  constructor(value) {
    this.value = value;
  }
}
class LinkedList {
  constructor() {
    this.length = 0;
  }
  pushBack(value) {
    // this.length++; // increasing the length here produces an invalid internal state
    if(!this.start) {
      this.start = new Node(value);
      this.end = this.start;
    } else {
      this.end.child = new Node(value);
      this.end = this.end.child;
    }    
    this.length++; // This is the correct position for increasing the length
  }
  
  average() {
    let sum = 0;
    let current = this.start;
    for(let i = 0; i < this.length; i++) {
      if(!current) break;
      sum += current.value;
      current = current.child;
    }
    return sum / this.length;
  }
  
  median() {
    if(!this.start) return undefined;
    let list = [];
    let current = this.start;
    for(let i = 0; i < this.length; i++) {
      if(!current) break;
      list[i] = current.value;
      current = current.child;
    }
    list.sort();
    if(list.length % 2 === 1) {
      return list[(list.length - 1) / 2];
    } else {
      return (list[list.length / 2 - 1] + list[list.length / 2]) / 2;
    }
  }
  
  map(f) {
    if(!this.start) return [];
    let current = this.start;
    let list = [];
    const l = this.length;
    for(let i = 0; i < l; i++) {
      list[i] = f(current.value);
      current = current.child;
    }
    return list;
  }
  
  mininum() {
    if(!this.start) return undefined;
    let min = this.start.value;
    let current = this.start;
    // Missing dependency if we do not extract this
    const l = this.length;
    for(let i = 0; i < l; i++) {
      if(!current) break;
      if(current.value < min) {  
        min = current.value;
      }      
      current = current.child;
    }
    return min;
  }
}

export default class ThesisDemo extends Morph {
  async initialize() {
    this.windowTitle = "ThesisDemo";
    
    const data = new LinkedList();
    data.pushBack(4);
    data.pushBack(1);
    let mean, median, sd, skew;
       
    aexpr(() => (mean - median) / sd) // Wrong order, as this is now prioritized leading to wrong intermediate values
      .onChange(v => skew = v);
    aexpr(() => data.average())
      .onChange(v => mean = v);    
    aexpr(() => data.median())
      .onChange(v => median = v);
    aexpr(() => {
      return Math.sqrt(data.map(x => (x - mean) * (x - mean)).reduce((s, a) => s + a, 0) / data.length)
    }).onChange(v => sd = v);

    
    aexpr(())
    data.pushBack(1);
    
  }
  
  
  async livelyExample() {
    
  }
  
  
}