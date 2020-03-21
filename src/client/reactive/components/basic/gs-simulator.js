"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import { uuid } from "https://lively-kernel.org/lively4/aexpr/src/client/utils.js";

import ColorHash from 'https://raw.githubusercontent.com/zenozeng/color-hash/master/dist/color-hash.js';
const colorHash = new ColorHash({ saturation: 0.8, lightness: 0.3 });
function colorForString(str) {
  return colorHash.hex(str);
}

const UNIT_DIR = lively4url + '/src/client/reactive/components/basic/units/';

async function statsFile(type) {
  return System.import(`${UNIT_DIR}${type}-stats.js`);
}

const TURN_DURATION = 10000;

class Battler {
  constructor(type) {
    this.id = uuid();
    this.type = type;
  }

  // temp
  async applyStats() {
    const module = await statsFile(this.type);
    const stats = module.default();
    Object.assign(this, stats);
  }

  static async create(type) {
    const battler = new Battler(type);

    await battler.applyStats();

    return battler;
  }
  toString() {
    return `<span style='color: ${this.color()}'>${this.type} (spd: ${this.spd})</span>`;
  }

  color() {
    return colorForString(this.type);
  }

  toLogTag() {}
  static deserialize(json) {}
}

export default class GsSimulator extends Morph {

  get battleLog() {
    return this.get('#log');
  }
  get battleField() {
    return this.get('#field');
  }
  get battleFieldParty() {
    return this.get('#party');
  }
  get battleFieldEnemies() {
    return this.get('#enemies');
  }
  get ctb() {
    return this.get('#ctb');
  }

  async initialize() {
    this.windowTitle = "GS";

    this.registerButtons();
    lively.html.registerKeys(this); // automatically installs handler for some methods
    lively.addEventListener("template", this, "dblclick", evt => this.onDblClick(evt));
    this.getJSONAttribute('battle');
    this.get("#textField").value = this.getAttribute("data-mydata") || 0;

    this.log('>> init simulator');
    await this.setupBattle();
    // to next turn
    await this.advanceToTurn();
    await this.updateField();
    await this.updateCTB();
  }

  log(msg) {
    this.battleLog.prepend(<div class="entry">{msg}</div>);
  }

  async setupBattle() {
    this.log('>> new battle');

    // lively.files.walkDir()
    this.battle = await Promise.all(['orcus', 'slime', 'slime', 'slime', 'slime'].map(async type => Battler.create(type)));
    this.ensureUniqueNames();
    this.initWaitTimes();
    await this.updateField();
  }

  initWaitTimes() {
    this.battle.forEach(battler => battler.waitTime = TURN_DURATION);
  }

  // lively.openInspector(counts)
  // lively.notify(counts[namePref] >= 2)
  ensureUniqueNames() {
    const counts = this.battle.countBy(battler => battler.namePref);
    const nameIds = new Map();
    this.battle.forEach(battler => {
      const namePref = battler.namePref;
      if (counts[namePref] >= 2) {
        const nameId = nameIds.getOrCreate(namePref, () => 1);
        battler.name = namePref + nameId;
        nameIds.set(namePref, nameId + 1);
      } else {
        battler.name = namePref;
      }
    });
  }

  async updateField() {
    this.battleFieldEnemies.innerHTML = '';
    this.battleFieldParty.innerHTML = '';
    this.battle.forEach(battler => {
      const element = this.elementForBattler(battler);
      (battler.align === 'party' ? this.battleFieldParty : this.battleFieldEnemies).appendChild(element);
    });
  }

  elementForBattler(battler) {
    return <span class="battler-container">
      <div class="battler" style={battler.onTurn ? `background-color: limegreen;` : ''}>
        <div class="battler-name" style={`color: ${battler.color()};`}>{battler.name}</div>
        <div class="" style={'color: red'}>{battler.hp}/{battler.maxhp}</div>
        <div class="hp-bar" data-percentage={battler.hp / battler.maxhp}></div>
        <div class="" style={'color: blue'}>{battler.mp}/{battler.maxmp}</div>
        <div class="mp-bar" data-percentage={battler.mp / battler.maxmp}></div>
        <div class="spd">{battler.waitTime}@{battler.spd} SPD</div>
        <div class="sp">{battler.sp} SP</div>
      </div>
    </span>;
  }

  advanceToTurn() {
    this.battle.forEach(battler => battler.onTurn = false);
    const numTicks = battler => battler.waitTime / battler.spd;

    const nextBattler = this.battle.minBy(numTicks);
    nextBattler.onTurn = true;

    const ticksTaken = numTicks(nextBattler);
    this.battle.forEach(battler => battler.waitTime -= ticksTaken * battler.spd);
  }

  onDblClick() {
    this.animate([{ backgroundColor: "lightgray" }, { backgroundColor: "red" }, { backgroundColor: "lightgray" }], {
      duration: 1000
    });
  }
  
  async updateCTB() {
    this.ctb.innerHTML = ''
    const actors = this.battle.reverse().map(battler => {
      const { waitTime, spd } = battler;
      return {
        totalTime: 0,
        waitTime,
        spd,
        battler
      }
    });
    
    let shownTurns = 30;
    shownTurns.times(() => {
      const numTicks = actor => actor.waitTime / actor.spd;

      const nextActor = actors.minBy(numTicks);

      const ticksTaken = numTicks(nextActor);
      actors.forEach(actor => {
        actor.waitTime -= ticksTaken * actor.spd;
        actor.totalTime += ticksTaken * actor.spd
      });
      
      this.ctb.innerHTML += nextActor.totalTime/ nextActor.spd + `/${nextActor.totalTime/TURN_DURATION}: `+nextActor.battler.name + '<br />'
      nextActor.waitTime = TURN_DURATION;
    })
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode);
  }

  // this method is automatically registered as handler through ``registerButtons``
  onPlusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) + 1;
  }

  onMinusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) - 1;
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value);
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty;
    this.log(">> sIMULATOR MIGRATED");
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray";
    this.someJavaScriptProperty = 42;
    this.appendChild(<div>This is my content</div>);
    this.log('>> example');
  }

}