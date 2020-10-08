"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';

import { shake } from 'utils';

class Cube {

  constructor(jc, { value, color }) {
    this.jc = jc;

    this.value = value;
    this.color = color;

    this.initElement();
  }

  initElement() {
    this.button = <button class="cube" click={evt => this.onClick(evt)}>~</button>;
    this.shaker = <div class="shaker">{this.button}</div>;
    this.bouncer = <div class="bouncer">{this.shaker}</div>;
    this.exploder = <div class="exploder">{this.bouncer}</div>;
    this.container = <div class="cube-container" mouseleave={evt => {
      this.button.style.transform = 'rotateX(0deg) rotateY(0deg)';
      this.button.style.filter = 'brightness(1)';
    }} mousemove={evt => {
      const width = this.button.clientWidth;
      const height = this.button.clientHeight;
      const mouseX = evt.offsetX;
      const mouseY = evt.offsetY;
      const rotateY = mouseX.remap([0, width], [-35, 35], true);
      const rotateX = mouseY.remap([0, height], [35, -35], true);
      const brightness = mouseY.remap([0, height], [1.5, 0.5], true) * mouseX.remap([0, width], [1.25, 0.75], true);

      this.button.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      this.button.style.filter = `brightness(${brightness})`;
    }}>{this.exploder}</div>;
  }

  async onClick(evt) {
    const jc = this.jc;

    if (this.color === jc.player || this.color === 'gray') {
      if (!jc.classList.contains('noClickAllowed')) {
        jc.classList.add('noClickAllowed');
        jc.addAnimation(new Increment(this, jc.player, jc));
        await jc.processQueue().then(() => {
          jc.nextPlayer();
          jc.classList.remove('noClickAllowed');
        });
        jc.saveToAttribute();
        return;
      }
    }

    shake(this.shaker);
  }

  toJSON() {
    return {
      color: this.color,
      value: this.value,
    }
  }
}

const EFFECT_DURATION = 400;

class Increment {
  constructor(cube, color, jc) {
    this.cube = cube;
    this.color = color;
    this.jc = jc;
  }

  async run() {
    const duration = EFFECT_DURATION;
    // await lively.sleep(500);

    this.cube.bouncer.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-30px)' }, { transform: 'translateY(0px)' }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.bouncer.animate([{ transform: 'scale(1, 1.3)', offset: 0.35 }, { transform: 'scale(1.1, 0.9)', offset: 0.5 }, { transform: 'scale(1, 1.3)', offset: 0.65 }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.button.animate([{ backgroundColor: 'white' }, { backgroundColor: COLOR_MAP.get(this.color) }], {
      duration,
      easing: 'ease-in-out',
      fill: 'both'
    }, 'accumulate');

    await lively.sleep(duration / 2);
    this.cube.color = this.color;
    this.cube.value++;
    return lively.sleep(duration / 2);
  }
}

class Explode {
  constructor(cube, jc, i, j) {
    this.cube = cube;
    this.jc = jc;
    this.i = i;
    this.j = j;
  }

  async run() {
    const duration = EFFECT_DURATION;
    const jc = this.jc;

    const neighbours = jc.cubes.getNeighboursOf(this.i, this.j);
    if (this.cube.value <= neighbours.length) {
      return;
    }

    this.cube.exploder.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-20px)' }, { transform: 'translateY(0px)' }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.exploder.animate([{ transform: 'scale(1, 1.3)', offset: 0.35 }, { transform: 'scale(1.1, 0.9)', offset: 0.5 }, { transform: 'scale(1, 1.3)', offset: 0.65 }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.button.animate([{ backgroundColor: 'black' }, { backgroundColor: COLOR_MAP.get(jc.player) }], {
      duration,
      easing: 'ease-in-out',
      fill: 'both'
    }, 'accumulate');

    await lively.sleep(duration / 2);
    if (this.cube.value <= neighbours.length) {
      return;
    }
    this.cube.color = jc.player;
    this.cube.value -= neighbours.length;
    neighbours.forEach(each => {
      const neighbour = jc.cubes.get(each.i, each.j);
      jc.addAnimation(new Increment(neighbour, this.cube.color, jc));
    });

    return lively.sleep(duration / 2);
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

  sumBy(accessor) {
    const iter = iteratee(accessor);

    let sum = 0;
    this.forEach(item => sum += iter(item));
    return sum;
  }

  count(predicate) {
    const iter = iteratee(predicate);

    let counter = 0;
    this.forEach(item => {
      if (iter(item)) {
        counter++;
      }
    });
    return counter;
  }

  toJSON() {
    const json = [];
    this.forEach((item, i, j) => {
      json[i] = json[i] || [];
      json[i][j] = item.toJSON();
    });
    return json;
  }
}

function iteratee(value) {
  if (typeof value == 'function') {
    return value;
  }

  if (value == null) {
    return Function.identity;
  }

  if (typeof value == 'string') {
    return function (object) {
      return object == null ? undefined : object[value];
    };
  }

  return () => {};
}

const COLOR_MAP = new Map([['red', 'rgba(255, 126, 126, 1.0)'], ['green', 'rgba(126, 255, 126, 1.0)'], ['gray', 'rgba(176, 176, 176, 1.0)']]);

export default class JumpingCubes extends Morph {

  get field() {
    return this.get('#field');
  }

  set energy(value) {
    return this.get('#energy').innerHTML = value;
  }

  defaultStart() {
    return this.fieldSize.times(() => this.fieldSize.times(() => ({
      value: 2,
      color: 'gray'
    })));
  }

  async initialize() {
    this.windowTitle = "Jumping Cubes";

    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);

    this.aexprs = new Set();
    this.animations = [];

    const state = this.getJSONAttribute('state');
    if (state) {
      this.setPlayer(state.player);
      this.fieldSize = state.fieldSize;
      this.startingInfo = state.cubes.map(line => line.map(cubeDesc => _.pick(cubeDesc, ['value', 'color'])));
    } else {
      this.fieldSize = 10;
      this.startingInfo = this.defaultStart();
      this.nextPlayer();
    }

    this.field.innerHTML = '';
    this.cubes = Matrix.init(this.fieldSize, (i, j) => {
      const cube = new Cube(this, this.startingInfo[i][j]);

      this.field.appendChild(cube.container);

      return cube;
    });

    this.cubes.forEach((cube, i, j) => {
      this.ae(() => cube.value).dataflow(value => cube.button.innerHTML = value).dataflow(value => {
        const neighbours = this.cubes.getNeighboursOf(i, j);
        if (value > neighbours.length) {
          this.addAnimation(new Explode(cube, this, i, j));
        }
      });
      this.ae(() => cube.color).dataflow(value => cube.button.style.background = COLOR_MAP.get(value));
    });

    // #TODO connect: this.energy <= this.cubes.sumBy('value')
    this.ae(() => this.cubes.sumBy('value')).dataflow(v => this.energy = v);

    this.saveToAttribute();
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

  addAnimation(animation) {
    this.animations.push(animation);
    this.resolveAnim && this.resolveAnim();
  }
  async processQueue() {
    const TASK_DURATION = 100;

    let lastAnim;
    while (true) {
      while (this.animations.length > 0) {
        const next = this.animations.shift();
        lastAnim = next.run();
        await lively.sleep(TASK_DURATION);
      }

      await Promise.race([lastAnim, new Promise(resolve => {
        this.resolveAnim = () => resolve();
      })]);

      if (this.animations.length === 0) {
        return;
      }
    }
  }

  detachedCallback() {
    this.disposeBindings();
  }

  disposeBindings() {
    this.aexprs.forEach(ae => ae.dispose());
  }

  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();

      // #Hack #Workaround weired browser scrolling behavior
      if (lively.lastScrollLeft || lively.lastScrollTop) {
        document.scrollingElement.scrollTop = lively.lastScrollTop;
        document.scrollingElement.scrollLeft = lively.lastScrollLeft;
      }
      var items = [];

      items.push(...[["<b>Enable Annotations</b>", () => this.enableAnnotations()]]);

      const menu = new ContextMenu(this, items);
      menu.openIn(document.body, evt, this);
    }
  }

  static preferenceEntry(preferenceKey) {
    let enabledIcon = function (enabled) {
      return enabled ? '<i class="fa fa-check-square-o" aria-hidden="true"></i>' : '<i class="fa fa-square-o" aria-hidden="true"></i>';
    };

    return [lively.preferences.shortDescription(preferenceKey), (evt, item) => {
      evt.stopPropagation();
      evt.preventDefault();

      if (lively.preferences.get(preferenceKey)) {
        lively.preferences.disable(preferenceKey);
      } else {
        lively.preferences.enable(preferenceKey);
      }
      item.querySelector(".icon").innerHTML = enabledIcon(lively.preferences.get(preferenceKey));
    }, "", enabledIcon(lively.preferences.get(preferenceKey))];
  }

  /* Lively-specific API */

  toJSON() {
    return {
      player: this.player,
      fieldSize: this.fieldSize,
      cubes: this.cubes.toJSON()
    };
  }

  saveToAttribute() {
    this.setJSONAttribute('state', this.toJSON());
  }

  // store something that would be lost
  livelyPrepareSave() {
    // this.setAttribute("data-mydata", this.get("#textField").value);
  }

  livelyPreMigrate() {
    this.disposeBindings();
  }

  livelyMigrate(other) {
    const state = other.getJSONAttribute('state');
    this.setJSONAttribute('state', state);
    this.classList.remove('noClickAllowed');
  }

  async livelyExample() {
    this.style.backgroundColor = "lightgray";
  }

}