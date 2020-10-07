"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import { shake } from 'utils';

class Cube {

  constructor(jc, { value, color }) {
    this.jc = jc;

    this.value = value;
    this.color = color;

    this.initElement();
  }

  initElement() {
    this.button = <button class="cube butto" click={evt => this.onClick(evt)}>~</button>;
    this.shaker = <div class="shaker">{this.button}</div>;
    this.container = <div class="cube-container"
      mouseleave={evt => {
        this.button.style.transform = 'rotateX(0deg) rotateY(0deg)';
        this.button.style.filter = 'brightness(1)';
      }}
      mousemove={evt => {
        const width = this.button.clientWidth;
        const height = this.button.clientHeight;
        const mouseX = evt.offsetX;
        const mouseY = evt.offsetY;
        const rotateY = mouseX.remap([0, width], [-35, 35], true);
        const rotateX = mouseY.remap([0, height], [35, -35], true);
        const brightness = mouseY.remap([0, height], [1.5, 0.5], true) * mouseX.remap([0, width], [1.25, 0.75], true);

        this.button.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        this.button.style.filter = `brightness(${brightness})`;
      }}
    >{this.shaker}</div>;
  }

  onClick(evt) {
    const jc = this.jc;

    if (this.color === jc.player || this.color === 'gray') {
      this.color = jc.player;
      this.value++;
      jc.nextPlayer();
    } else {
      shake(this.shaker);
    }
  }

}

class Matrix {

  constructor(size) {
    this.size = size;
    this.inner = size.times(() => []);
  }

  get(i, j) {
    return this.inner[i][j];
  }

  set(i, j, value) {
    return this.inner[i][j] = value;
  }

  static init(size, fn) {
    const result = new Matrix(size);
    result.forEach((_, i, j) => {
      result.set(i, j, fn(i, j));
    });
    return result;
  }

  forEach(fn) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        fn(this.get(i, j), i, j, this);
      }
    }
  }

  map(fn) {
    const result = new Matrix(this.size);
    this.forEach((item, i, j) => {
      result.set(i, j, fn(item, i, j, this));
    });
    return result;
  }

  getNeighboursOf(i, j) {
    return [{ i: i - 1, j }, { i, j: j - 1 }, { i: i + 1, j }, { i, j: j + 1 }].filter(({ i, j }) => i >= 0 && i < this.size && j >= 0 && j < this.size);
  }

}

const COLOR_MAP = new Map([['red', 'rgba(255, 126, 126, 1.0)'], ['green', 'rgba(126, 255, 126, 1.0)'], ['gray', 'rgba(176, 176, 176, 1.0)']]);

export default class JumpingCubes extends Morph {

  get field() {
    return this.get('#field');
  }

  defaultStart() {
    return Matrix.init(this.fieldSize, () => ({
      value: 2,
      color: 'gray'
    }));
  }

  async initialize() {
    this.windowTitle = "Jumping Cubes";

    this.aexprs = new Set();

    if (this.carryOver) {
      this.setPlayer(this.carryOver.player);
      this.fieldSize = this.carryOver.fieldSize;
      this.startingInfo = this.carryOver.matrix.map(cube => _.pick(cube, ['value', 'color']));
    } else {
      this.fieldSize = 10;
      this.startingInfo = this.defaultStart();
      this.nextPlayer();
    }
    this.field.innerHTML = '';
    this.matrix = Matrix.init(this.fieldSize, (i, j) => {
      const cube = new Cube(this, this.startingInfo.get(i, j));

      this.field.appendChild(cube.container);

      return cube;
    });
    this.matrix.forEach((cube, i, j) => {
      this.ae(() => cube.value).dataflow(value => cube.button.innerHTML = value).dataflow(value => {
        const neighbours = this.matrix.getNeighboursOf(i, j);
        if (value > neighbours.length) {
          cube.color = this.player;
          cube.value -= neighbours.length;
          neighbours.forEach(each => {
            const neighbour = this.matrix.get(each.i, each.j);
            neighbour.color = cube.color;
            neighbour.value++;
          });
        }
      });
      this.ae(() => cube.color).dataflow(value => cube.button.style.background = COLOR_MAP.get(value));
    });
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

  ae(fn, ...opts) {
    const ae = aexpr(fn, ...opts);
    this.aexprs.add(ae);
    return ae;
  }

  detachedCallback() {
    this.disposeBindings();
  }

  disposeBindings() {
    this.aexprs.forEach(ae => ae.dispose());
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value);
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
    this.style.backgroundColor = "lightgray";
  }

}