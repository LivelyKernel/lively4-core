"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import Strings from 'src/client/strings.js';

import MCTS from './jumping-cubes-mcts.js';
import Matrix from './square-matrix.js';

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
    if (!this.jc.handleClickOn(this)) {
      shake(this.shaker);
    }
  }

  get neighbours() {
    if (this._neighbours) {
      return this._neighbours;
    }

    const cubes = this.jc.cubes;

    const index = cubes.indexOf(this);
    if (!index) {
      return [];
    }

    return this._neighbours = cubes.getNeighboursOf(index.i, index.j);
  }

  toJSON() {
    return {
      color: this.color,
      value: this.value
    };
  }
}

const EFFECT_DURATION = 400;

class Animation {
  constructor(jc) {
    this.jc = jc;
    this.gameNumber = jc.gameNumber;
  }
}

class Increment extends Animation {
  constructor(cube, color, jc) {
    super(jc);
    this.cube = cube;
    this.color = color;
  }

  async run() {
    const duration = this.jc.duration(EFFECT_DURATION);

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
    if (this.gameNumber < this.jc.gameNumber) {
      return;
    }
    this.cube.color = this.color;
    this.cube.value++;
    return lively.sleep(duration / 2);
  }
}

class Explode extends Animation {
  constructor(cube, jc) {
    super(jc);
    this.cube = cube;
  }

  async run() {
    const duration = this.jc.duration(EFFECT_DURATION);
    const jc = this.jc;

    const neighbours = this.cube.neighbours;
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

    this.cube.button.animate([{ backgroundColor: 'black' }, { backgroundColor: COLOR_MAP.get(jc.player.color) }], {
      duration,
      easing: 'ease-in-out',
      fill: 'both'
    }, 'accumulate');

    await lively.sleep(duration / 2);
    if (this.cube.value <= neighbours.length) {
      return;
    }
    if (this.gameNumber < this.jc.gameNumber) {
      return;
    }
    this.cube.color = jc.player.color;
    this.cube.value -= neighbours.length;
    neighbours.forEach(neighbour => {
      jc.addAnimation(new Increment(neighbour, this.cube.color, jc));
    });

    return lively.sleep(duration / 2);
  }
}

const COLOR_MAP = new Map([['red', 'rgba(255, 126, 126, 1.0)'], ['green', 'rgba(126, 255, 126, 1.0)'], ['gray', 'rgba(176, 176, 176, 1.0)']]);

class AnimationQueue {
  constructor(jc) {
    this.jc = jc;
    this.gameNumber = jc.gameNumber;
    this.inner = [];
  }

  add(animation) {
    this.inner.push(animation);
    this.resolveAnim && this.resolveAnim();
  }

  async process() {
    const TASK_DURATION = this.jc.duration(100);

    let lastAnim;
    while (true) {
      while (this.inner.length > 0) {
        // that.innerHTML = this.inner.length;
        const next = this.inner.shift();
        lastAnim = next.run();
        await lively.sleep(TASK_DURATION);
      }

      await Promise.race([lastAnim, new Promise(resolve => this.resolveAnim = resolve)]);

      if (this.inner.length === 0) {
        return;
      }
    }
  }

  clear() {
    this.inner.length = 0;
  }
}

class Player {
  constructor(color, ai) {
    this.color = color;
    this.ai = ai;
  }

  startTurn(jc) {
    if (this.ai) {
      jc.classList.add('noClickAllowed');
      this.gameNumber = jc.gameNumber;
      this.aiTurn(jc);
    } else {
      jc.classList.remove('noClickAllowed');
    }
  }

  async aiTurn(jc) {
    function getInitialState(jc) {
      const cubes = jc.cubes;
      const color = jc.player.color;

      const field = cubes.toJSON();

      field.forEach((line, i) => line.forEach((cube, j) => {
        cube.neighbours = [];
        if (field[i - 1]) {
          cube.neighbours.push(field[i - 1][j]);
        }
        if (field[i][j - 1]) {
          cube.neighbours.push(field[i][j - 1]);
        }
        if (field[i + 1]) {
          cube.neighbours.push(field[i + 1][j]);
        }
        if (field[i][j + 1]) {
          cube.neighbours.push(field[i][j + 1]);
        }
      }));

      field.forEach(line => line.forEach(cube => cube.numNeighbours = cube.neighbours.length));

      return { field, color };
    }

    jc.aiProgressStart(jc.player.color);

    const mcts = new MCTS(getInitialState(jc));
    const move = await mcts.run(jc.getConfig().aiIterations, {
      progress: ::jc.aiProgressStep
    });

    if (this.gameNumber < jc.gameNumber) {
      return;
    }

    jc.aiProgressEnd();
    jc.processQueue(jc.cubes.get(move.i, move.j));
  }

  static fromJSON(json) {
    return new Player(json.color, json.ai);
  }
  toJSON() {
    return {
      color: this.color,
      ai: this.ai
    };
  }
}

export default class JumpingCubes extends Morph {

  get field() {
    return this.get('#field');
  }

  set energy(value) {
    return this.get('#energy').innerHTML = value;
  }

  defaultStart() {
    const { startingValue, fieldSize } = this.getConfig();
    return Matrix.init(fieldSize, () => ({
      value: startingValue,
      color: 'gray'
    }));
  }

  async initialize() {
    this.windowTitle = "Jumping Cubes";

    this.init();

    const state = this.getJSONAttribute('state');
    this.reset(state);

    this.get('#gameEnd-container').addEventListener('click', ::this.restart);
  }

  get fieldSize() {
    return this.cubes.size;
  }
  init() {
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);
    this.gameNumber = 0;
    this.aexprs = new Set();
  }

  reset(state) {
    this.blinkOut();
    const aiProgress = this.aiProgress;
    aiProgress.animate([{ 'opacity': 0 }], {
      duration: 0,
      fill: 'forwards'
    });

    this.gameNumber++;
    this.animationSpeed = this.getConfig().animationSpeed;
    this.animations = new AnimationQueue(this);

    let startingInfo;
    if (state) {
      this.players = state.players.map(Player.fromJSON);
      this.setPlayerForIndex(state.currentPlayerIndex);
      startingInfo = Matrix.fromJSON(state.cubes, cubeDesc => _.pick(cubeDesc, ['value', 'color']));
    } else {
      this.createPlayers();
      this.initStartingPlayer();
      startingInfo = this.defaultStart();
    }

    this.buildFieldOfCubes(startingInfo);

    // #TODO connect: this.energy <= this.cubes.sumBy('value')
    this.ae(() => this.cubes.sumBy('value')).dataflow(v => this.energy = v);

    const checkEnd = (color, v) => {
      const numCubes = this.fieldSize * this.fieldSize;
      if (v >= numCubes) {
        this.win(color);
      }
    };

    const greenCubes = this.ae(() => this.cubes.count(cube => cube.color === 'green'));
    greenCubes.dataflow(v => this.updatePlayerWidget('green', v));
    greenCubes.onChange(v => checkEnd('green', v));
    const redCubes = this.ae(() => this.cubes.count(cube => cube.color === 'red'));
    redCubes.dataflow(v => this.updatePlayerWidget('red', v));
    redCubes.onChange(v => checkEnd('red', v));

    this.saveToAttribute();
    this.startTurnForCurrentPlayer();
  }

  updatePlayerWidget(color, value) {
    const widget = this.get(`#${color}Player`);

    const numCubes = this.fieldSize * this.fieldSize;
    const currentValue = value / numCubes;

    const label = widget.querySelector('.score-label');
    label.innerHTML = value;
    if (widget.previousValue !== undefined) {
      const idleForm = { 'filter': 'brightness(1)', 'transform': '' };
      if (currentValue > widget.previousValue) {
        label.animate([idleForm, { 'filter': 'brightness(3)', 'transform': 'rotate(2deg) scale(1.3, 1.7)' }, idleForm], {
          duration: 300,
          easing: 'ease-in-out',
          fill: 'forwards',
          composite: 'accumulate'
        });
      } else if (currentValue < widget.previousValue) {
        label.animate([idleForm, { 'filter': 'brightness(0.5)', 'transform': 'rotate(-5deg) scale(1.5, 0.5)' }, idleForm], {
          duration: 400,
          easing: 'ease-in-out',
          fill: 'forwards',
          composite: 'accumulate'
        });
      }
    }

    const percentage = `${currentValue * 100}%`;

    const background = widget.querySelector('.background');
    const foreground = widget.querySelector('.foreground');
    if (widget.previousValue === undefined) {
      background.style.width = percentage;
      foreground.style.width = percentage;
    } else if (currentValue > widget.previousValue) {
      background.animate([{ 'width': percentage }], {
        duration: 0,
        fill: 'both'
      });
      foreground.animate([{ 'width': percentage }], {
        duration: 400,
        easing: 'ease-in-out',
        fill: 'both'
      });
    } else if (currentValue < widget.previousValue) {
      foreground.animate([{ 'width': percentage }], {
        duration: 0,
        fill: 'both'
      });
      background.animate([{ 'width': percentage }], {
        duration: 400,
        easing: 'ease-in-out',
        fill: 'both'
      });
    } else {
      background.style.width = percentage;
      foreground.style.width = percentage;
    }
    widget.previousValue = currentValue;
  }

  createPlayers() {
    this.currentPlayerIndex = 0;
    this.players = this.getConfig().players.map(Player.fromJSON);
  }

  buildFieldOfCubes(startingInfo) {
    this.field.innerHTML = '';
    this.cubes = startingInfo.map(info => {
      const cube = new Cube(this, info);

      this.field.appendChild(cube.container);

      return cube;
    });

    this.cubes.forEach(cube => {
      this.ae(() => cube.value).dataflow(value => cube.button.innerHTML = value).dataflow(value => {
        if (value > cube.neighbours.length) {
          this.addAnimation(new Explode(cube, this));
        }
      });
      this.ae(() => cube.color).dataflow(value => cube.button.style.background = COLOR_MAP.get(value));
    });

    const fieldSize = this.cubes.size;
    this.field.style.setProperty('grid-template-columns', `repeat(${fieldSize}, 40px)`);
    this.field.style.setProperty('grid-template-rows', `repeat(${fieldSize}, 40px)`);
  }

  initStartingPlayer() {
    this.setPlayerForIndex(0);
  }
  nextPlayer() {
    this.setPlayerForIndex(this.currentPlayerIndex + 1);
  }
  setPlayerForIndex(index) {
    this.currentPlayerIndex = index % this.players.length;
    this.player = this.players[this.currentPlayerIndex];
    this.style.setProperty('--playerOnTurn', this.player.color);
  }

  startTurnForCurrentPlayer() {
    this.player.startTurn(this);
  }
  clickRandomCube() {
    const color = this.player.color;
    function canClick(cube) {
      return cube.color === color || cube.color === 'gray';
    }

    const clickables = [];
    this.cubes.forEach(cube => {
      if (canClick(cube)) {
        clickables.push(cube);
      }
    });

    this.processQueue(clickables.sample());
  }

  ae(fn, ...opts) {
    const ae = aexpr(fn, ...opts);
    this.aexprs.add(ae);
    return ae;
  }

  handleClickOn(cube) {
    if (cube.color === this.player.color || cube.color === 'gray') {
      if (!this.classList.contains('noClickAllowed')) {
        this.processQueue(cube);
        return true;
      }
    }
    return false;
  }

  // #important
  async processQueue(cube) {
    this.animationSpeed = this.getConfig().animationSpeed;
    this.classList.add('noClickAllowed');
    this.addAnimation(new Increment(cube, this.player.color, this));

    const animationQueue = this.animations;
    await animationQueue.process();
    if (animationQueue.gameNumber < this.gameNumber) {
      return;
    }
    this.nextPlayer();
    this.saveToAttribute();
    this.startTurnForCurrentPlayer();
  }
  addAnimation(animation) {
    this.animations.add(animation);
  }
  duration(duration) {
    const speed = this.animationSpeed;
    if (speed === 'Instantaneous') {
      return 0;
    }
    if (_.isNumber(speed)) {
      return duration / speed;
    }
    return 1;
  }

  detachedCallback() {
    this.disposeBindings();
  }

  disposeBindings() {
    this.aexprs.forEach(ae => ae.dispose());
    this.aexprs.clear();
  }

  defaultConfig() {
    return {
      fieldSize: 5,
      startingValue: 2,
      animationSpeed: 1,
      players: [{
        color: 'green',
        ai: false
      }, {
        color: 'red',
        ai: true
      }],
      aiIterations: 1000,
    };
  }
  getConfig() {
    function loadJSON(key) {
      const stringValue = this.getItem(key);
      if (!stringValue) {
        return undefined;
      }
      return JSON.parse(stringValue);
    }

    const config = localStorage::loadJSON('JumpingCubes');
    if (config) {
      return config;
    }
    return this.defaultConfig();
  }
  setConfig(config) {
    function saveJSON(key, json) {
      const stringValue = JSON.stringify(json, undefined, 2);
      return this.setItem(key, stringValue);
    }

    return localStorage::saveJSON('JumpingCubes', config);
  }
  resetConfig() {
    return localStorage.removeItem('JumpingCubes');
  }
  configure(callback) {
    const config = this.getConfig();
    callback(config);
    this.setConfig(config);
  }

  onContextMenu(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    function fa4(classes) {
      return '<i class="fa fa-' + classes + '" aria-hidden="true"></i>';
    }

    const players = this.getConfig().players.map((player, index) => {
      function checkIcon(enabled) {
        return enabled ? fa4('check-square-o') : fa4('square-o');
      }

      return [`player ${player.color}`, (evt, item) => {
        evt.stopPropagation();
        evt.preventDefault();

        let isAI;
        this.configure(conf => isAI = conf.players[index].ai = !conf.players[index].ai);
        item.querySelector(".icon").innerHTML = checkIcon(isAI);
      }, '', { toString: () => checkIcon(this.getConfig().players[index].ai) }];
    });

    const radioButtonList = (values, configProperty) => {
      function radioIcon(enabled) {
        return enabled ? fa4('dot-circle-o') : fa4('circle-o');
      }

      return values.map((value, index) => [value + '', (evt, item) => {
        evt.stopPropagation();
        evt.preventDefault();

        this.configure(conf => conf[configProperty] = value);
        item.parentElement.querySelectorAll(".icon").forEach((icon, iconIndex) => {
          icon.innerHTML = radioIcon(index === iconIndex);
        });
      }, '', { toString: () => radioIcon(value === this.getConfig()[configProperty]) }]);
    };
    const fieldSizes = radioButtonList(2 .to(13), 'fieldSize');
    const startingValues = radioButtonList([1, 2], 'startingValue');
    const animationSpeed = radioButtonList([0.5, 0.75, 1, 1.25, 1.5, 2, 4, 'Instantaneous'], 'animationSpeed');
    const aiIterations = radioButtonList([1E2, 1E3, 1E4, 1E5, 1E6, 1E7, 1E8], 'aiIterations');

    const items = [];
    items.push(["restart game", ::this.restart, '', fa4('undo')]);
    items.push(["new game", () => lively.openComponentInWindow('jumping-cubes'), '', fa4('plus')]);
    items.push(["players", players, '', fa4('users')]);
    items.push(["field size", fieldSizes, '', fa4('cubes')]);
    items.push(["starting value", startingValues, '', fa4('cube')]);
    items.push(["animation speed", animationSpeed, '', fa4('hourglass')]);
    items.push(["ai iterations", aiIterations, '', fa4('reddit-alien')]);
    items.push(["reset to default", ::this.resetConfig, '', fa4('trash-o')]);
    

    const menu = new ContextMenu(this, items);
    menu.openIn(document.body, evt, this);
  }

  restart() {
    this.cleanup();
    this.reset();
  }

  async blinkOut() {
    if (!this.blinked) {
      return;
    }
    this.blinked = false;

    const container = this.get('#gameEnd-container');
    const winText = this.get('#gameEnd-message');
    const clickText = this.get('#gameEnd-newGame');

    const mainDuration = 300;
    container.animate([{ 'backgroundColor': 'rgba(255, 255, 255, 0.1)' }, { 'backgroundColor': 'rgba(255, 255, 255, 0)' }], {
      duration: mainDuration,
      easing: 'ease-out',
      fill: 'forwards'
    });
    winText.animate([{ 'opacity': 1, 'transform': 'scaleY(1)' }, { 'opacity': 0, 'transform': 'scaleY(0.5)' }], {
      duration: mainDuration,
      easing: 'ease-out',
      fill: 'forwards'
    });
    clickText.style.setProperty('opacity', 0);
    clickText.animate([{ 'opacity': 1 }, { 'opacity': 0 }], {
      duration: mainDuration,
      easing: 'ease-out',
      fill: 'forwards'
    });

    await lively.sleep(mainDuration);
    container.style.setProperty('display', 'none');
  }

  blinkIn(color) {
    if (this.blinked) {
      return;
    }
    this.blinked = true;

    const container = this.get('#gameEnd-container');
    const winText = this.get('#gameEnd-message');
    const clickText = this.get('#gameEnd-newGame');

    winText.innerHTML = `Player ${Strings.toUpperCaseFirst(color)} Wins!`;
    winText.style.setProperty('background-color', COLOR_MAP.get(color));

    const mainDuration = 300;
    container.style.setProperty('display', 'grid');
    container.animate([{ 'backgroundColor': 'rgba(255, 255, 255, 0)' }, { 'backgroundColor': 'rgba(255, 255, 255, 0.7)' }, { 'backgroundColor': 'rgba(255, 255, 255, 0.1)' }], {
      duration: mainDuration * 1.5,
      easing: 'ease-out',
      fill: 'forwards'
    });
    winText.animate([{ 'opacity': 0, 'transform': 'scaleY(0.5)' }, { 'opacity': 1, 'transform': 'scaleY(1)' }], {
      duration: mainDuration,
      easing: 'cubic-bezier(0.34, 2.56, 0.64, 1)',
      fill: 'forwards'
    });
    clickText.style.setProperty('opacity', 0);
    clickText.animate([{ 'opacity': 0 }, { 'opacity': 1 }], {
      duration: 1000,
      easing: 'ease-out',
      delay: mainDuration,
      fill: 'forwards'
    });
  }

  cleanup() {
    this.disposeBindings();
    this.classList.remove('noClickAllowed');
    this.gameNumber++;
  }

  win(color) {
    this.cleanup();
    this.blinkIn(color);
  }

  get aiProgress() {
    return this.get('#ai-progress');
  }

  get aiProgressLabel() {
    return this.get('#ai-progress-label');
  }

  aiProgressStart(color) {
    const aiProgress = this.aiProgress;
    aiProgress.style.display = 'block';
    aiProgress.style.backgroundImage = ``;
    aiProgress.style.setProperty('opacity', 0);
    aiProgress.animate([{ 'opacity': 0 }, { 'opacity': 1 }], {
      duration: 1000,
      easing: 'ease-out',
      fill: 'forwards'
    });

    const aiProgressLabel = this.aiProgressLabel;
    aiProgressLabel.style.color = color;
  }

  aiProgressStep(color, progress) {
    const aiProgress = this.aiProgress;
    let cssColor;
    if (color === 'red') {
      cssColor = '255, 0, 0';
    } else if (color === 'green') {
      cssColor = '0, 255, 0';
    } else {
      cssColor = '0, 0, 255';
    }
    const progressPercentage = progress * 100;
    aiProgress.style.backgroundImage = `linear-gradient( 
      to right,
      rgba(${cssColor}, 0.45), 
      rgba(${cssColor}, 0.45) ${progressPercentage}%,
      rgba(0,0,0,0) ${progressPercentage}%,
      rgba(0,0,0,0)
    )`;

    const aiProgressLabel = this.aiProgressLabel;
    aiProgressLabel.style.color = color;
  }

  aiProgressEnd() {
    const aiProgress = this.aiProgress;
    aiProgress.animate([{ 'opacity': 1 }, { 'opacity': 0 }], {
      duration: 500,
      easing: 'ease-out',
      fill: 'forwards'
    });
  }

  /* Lively-specific API */

  toJSON() {
    return {
      currentPlayerIndex: this.currentPlayerIndex,
      players: this.players.map(p => p.toJSON()),

      fieldSize: this.cubes.size,
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