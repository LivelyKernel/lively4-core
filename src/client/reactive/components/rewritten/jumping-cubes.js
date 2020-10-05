"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import { shake } from 'utils';

class Cube {
  constructor(jc, { value, color }) {
    this.jc = jc;

    this.value = value;
    this.color = color;
    this.bindings = [];

  
  }
  dispose() {
    this.bindings.forEach(each => each.dispose());
  }
}

export default class JumpingCubes extends Morph {
  get field() { return this.get('#field'); }

  defaultStart() {
    return this.fieldSize.times(() => this.fieldSize.times(() => ({ value: 2, color: 'gray'})));
  }

  async initialize() {
    this.windowTitle = "Jumping Cubes";

    const colorMap = new Map([
      ['red', 'rgba(255, 126, 126, 1.0)'],
      ['green', 'rgba(126, 255, 126, 1.0)'],
      ['gray', 'rgba(176, 176, 176, 1.0)']
    ]);

    if (this.carryOver) {
      this.setPlayer(this.carryOver.player);
      this.fieldSize = this.carryOver.fieldSize;
      this.startingInfo = this.carryOver.matrix.map(line => line.map(cube => _.pick(cube, ['value', 'color'])))
    } else {
      this.fieldSize = 10;
      this.startingInfo = this.defaultStart();
      this.nextPlayer();
    }
    this.field.innerHTML = '';
    this.matrix = [];
    for (let i = 0; i < this.fieldSize; i++) {
      this.matrix[i] = [];
      for (let j = 0; j < this.fieldSize; j++) {
        const { value , color} = this.startingInfo[i][j];
        const cube = new Cube (this, { value, color });
        this.matrix[i][j] = cube;
        const button = <button class='cube' click={evt => this.clickCube(evt, cube, container)}>un-init</button>;
        const container = <div class='cube-container'><div class='shaker'>{button}</div></div>;
        cube.container = container;
        cube.bindings.push(
          aexpr(() => cube.value)
            .dataflow(value => button.innerHTML = value)
            .dataflow(value => {
              const neighbours = this.getNeighboursOf(i, j);
              if(value > neighbours.length) {
                cube.color = this.player;
                cube.value -= neighbours.length;
                neighbours.forEach(each => {
                  const neighbour = this.matrix[each.i][each.j];
                  neighbour.color = cube.color;
                  neighbour.value ++;
                });
              }
          })
        );
        cube.bindings.push(
          aexpr(() => cube.color).dataflow(value => button.style.background = colorMap.get(value))
        );

        this.field.appendChild(cube.container);
      }
    }
    
  }

  clickCube(evt, cube, container) {
    if (cube.color === this.player || cube.color === 'gray') {
      cube.color = this.player;
      cube.value++;
      this.nextPlayer();
    } else {
      shake(container.querySelector('.shaker'));
    }
  }

  nextPlayer() {
    if (this.player === 'green') {
      this.setPlayer('red');
    } else {
      this.setPlayer('green');
    }
  }
  
  setPlayer(color) {
    this.player = color;
    this.style.setProperty('--playerOnTurn', color);
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
    this.matrix.forEach(row => row.forEach(each => each.dispose()));
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
    this.carryOver = other;
  }
  
  async livelyExample() {
    this.style.backgroundColor = "lightgray"
  }

}
