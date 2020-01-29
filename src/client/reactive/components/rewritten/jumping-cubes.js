"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class JumpingCubes extends Morph {
  get field() { return this.get('#field'); }

  async initialize() {
    this.windowTitle = "JumpingCubes";

    const colorMap = new Map([
      ['red', 'rgba(255, 126, 126, 1.0)'],
      ['green', 'rgba(126, 255, 126, 1.0)'],
      ['gray', 'rgba(176, 176, 176, 1.0)']
    ]);

    this.player = 'red';
    this.fieldSize = 10;
    this.field.innerHTML = '';
    this.field.matrix = [];
    for (let i = 0; i < this.fieldSize; i++) {
      const div = <div></div>;
      this.field.matrix[i] = [];
      for (let j = 0; j < this.fieldSize; j++) {
        const cube = { value: 2, color: 'gray' , bindings: []};
        this.field.matrix[i][j] = cube;
        const button = <button style="border-color:red" click={evt => {cube.value++; this.nextPlayer()}}>un-init</button>;
        cube.bindings = [
          aexpr(() => cube.value)
            .dataflow(value => button.innerHTML = value)
            .dataflow(value => {
              const neighbours = this.getNeighboursOf(i, j);
              if(value > neighbours.length) {
                cube.color = this.player;
                cube.value -= neighbours.length;
                neighbours.forEach(each => {
                  let neighbour = this.field.matrix[each.i][each.j];
                  neighbour.color = cube.color;
                  neighbour.value ++;
                })
              }
          }),
          aexpr(() => cube.color).dataflow(value => button.style.background = colorMap.get(value)),
          aexpr(() => this.player).dataflow(value => button.style.borderColor = colorMap.get(value))
        ];
        cube.dispose = () => cube.bindings.forEach(each => each.dispose());
        div.appendChild(button);
      }
      this.field.appendChild(div);
    }
    
  }
  
  nextPlayer() {
    if(this.player === 'red')this.player = 'green';
    else if(this.player === 'green')this.player = 'red';
  }
  
  getNeighboursOf(i, j) {
    return [
      {i : i - 1, j},
      {i, j : j - 1},
      {i : i + 1, j},
      {i, j : j + 1},
    ].filter(each => each.i >= 0 && each.i < this.fieldSize && each.j >= 0 && each.j < this.fieldSize)
  }
  
  detachedCallback() {
    this.disposeBindings();
  }
  
  disposeBindings() {
    this.field.matrix.forEach(row => row.forEach((each => {
      each.dispose();
    })));
  }
  

  

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
  livelyPreMigrate() {
    this.disposeBindings();
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {
    this.style.backgroundColor = "lightgray"
  }
  
  
}