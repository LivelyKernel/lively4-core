"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class DiceRoller3 extends Morph {
  async initialize() {
    this.bonusDigit = 1;
    this.bonus = [];
    this.previousRolls = [];
    
    this.types = ["d4", "d6", "d8", "d10", "d12", "d20"];
    this.boni = ["-1", "+0", "+1", "+2", "+3", "+4"];
    this.updateView();
  }
  
  onMouseDownOverAmount(evt, currentAmount) {
    evt.preventDefault();
    evt.stopPropagation();
    
    this.amount = currentAmount;
    this.updateView();
  }
  
  onMouseOverType(evt, currentType) {
    evt.preventDefault();
    evt.stopPropagation();
    
    if (this.amount) {
      this.type = currentType;
      this.updateView();
    }
  }
  
  onMouseOverBonus(evt, currentBonus, currentDigit) {
    evt.preventDefault();
    evt.stopPropagation();
    
    if (this.amount) {
      if (this.bonus.length < currentDigit) {
        this.bonus.push(currentBonus);
      } else {
        this.bonus[currentDigit - 1] = currentBonus;
        this.bonus = this.bonus.slice(0, currentDigit);
      }
      this.bonusDigit = Math.min(currentDigit + 1, 3);
      this.updateView();
    }
  }
  
  rollDice(roll) {
    const regex = /(^| *[+-] *)(?:(\d*)d(\d+)|(\d+))/g;
    const matchArray = [...roll.matchAll(regex)];
    const diceResults = matchArray.map((array) => {
      const sign = array[1].trim() === "-" ? -1 : 1;
      if (array[2] !== undefined && array[3] !== undefined) {
        // die
        const faces = parseInt(array[3]);
        const count = array[2] === "" ? 1 : parseInt(array[2]);
        let result = 0;
        for (let i = 1; i <= count; i++) {
          result += Math.floor(Math.random() * faces) + 1;
        }
        result *= sign;
        return result;
      } else if (array[4]) {
        // mod
        const modifier = parseInt(array[4]) * sign;
        return modifier;
      }
    })
    var result =  "" + diceResults.join("+") + "=" + diceResults.reduce((acc, val) => acc + val);
    this.output = roll;
    this.result = result;
    this.previousRolls = this.previousRolls.filter(e => e != roll);  
    this.previousRolls.unshift(roll);
    if (this.previousRolls.length > 20) {this.previousRolls.pop()}
    this.updateView();
  }
  
  onMouseUp(evt) {
    if (this.amount && this.type) {
      var output = this.amount + this.type
      if (this.bonus != []){
        output = output + "+" + this.bonus.join('') // TODO: Vorzeichen
      }
      this.rollDice(output);
    }
    this.amount = undefined;
    this.type = undefined;
    this.bonus = [];
    this.bonusDigit = 1;
    this.updateView();
  }
  
  makeTypeCell(e) {
    var value = <center><button name="value" style="width: 80px">{e}</button></center>
    value.value = e;
    if (value.value === this.type) {
      value.style.border = "1px black solid"
    }
    var del = <div name="del" style="width:max; text-align:right; cursor: pointer">X</div>;

    const currentType = value.value;
    value.addEventListener('mouseover', (evt) => this.onMouseOverType(evt, currentType));

    var cell = 
        <tr>
          <td style="width: 33%"></td>
          <td style="width: 33%">{value}</td>
          <td style="width: 33%">{del}</td>
        </tr>
    return cell;
  }
  
  makeBonusCell(e, currentDigit) {
    var value = <center><button name="value" style="width: 80px">{e}</button></center>
    value.value = e;
    if (this.bonus[currentDigit - 1] === value.value) {
      value.style.border = "1px black solid"
    }
    
    const currentBonus = value.value;
    
    value.addEventListener('mouseover', (evt) => this.onMouseOverBonus(evt, currentBonus, currentDigit));

    var cell = 
        <tr>
          <td>{value}</td>
        </tr>
    return cell;
  }
  
  updateView(){
    var pane = this.get("#pane")
    
    // type
    var typeTable = <table style="width:100%; min-width: 120px"></table>;
    var type = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          {typeTable}
        </div>
      </div>;
    
    this.types.forEach(e => {
      var cell = this.makeTypeCell(e);
      typeTable.appendChild(cell)
    })
    // to add dice types
    var addTypeInput = <input type="number" min="0" style="width: 70%; margin-top: 5px"></input>
    var addTypeButton = 
      <button style="float: right" click={() => {
          var cell = this.makeTypeCell("d" + addTypeInput.value);
          typeTable.appendChild(cell);
        }}>add</button>
    var additionalType = 
        <div>
          {addTypeInput}
          {addTypeButton}
        </div>
    type.appendChild(additionalType)
    
    
    // bonus
    var bonusTable = <table style="width:100%"></table>;
    var bonus = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          {bonusTable}
        </div>
      </div>;
    
    this.boni.forEach(e => {
      var cell = this.makeBonusCell(e);
      bonusTable.appendChild(cell)
    })
    // to add bonuses
    var addBonusInput = <input type="number" style="width: 70%; margin-top: 5px"></input>
    var addBonusButton = 
      <button style="float: right" click={() => {
          var newBonus = addBonusInput.value;
          if (newBonus >= 0) {
            newBonus = "+" + newBonus;
          } else {
            newBonus = "" + newBonus;
          }
          var cell = this.makeBonusCell(newBonus);
          bonusTable.appendChild(cell);
        }}>add</button>
    var additionalBonus = 
        <div>
          {addBonusInput}
          {addBonusButton}
        </div>
    bonus.appendChild(additionalBonus)
    
    // ROLL IT button
    var rollButton = <button style="width: 100%; height: 150px">ROLL IT</button>
    
    // result
    var output = <input></input>;
    if (this.output) { output.value = this.output }
    var result = <input></input>;
    if (this.result) { result.value = this.result }
    
    // previous rolls
    var previousRolls = <div style="width: 100%"></div>;
    if (this.previousRolls) {
      for (var count in this.previousRolls) {
        const roll = this.previousRolls[count];
        var button = <button click={() => this.rollDice(roll)}>{roll}</button>;
        previousRolls.appendChild(button);
      }
    }
    
    var footer = 
        <div>
          <div>Previous Rolls: </div>
          {previousRolls}
        </div>
    
    pane.innerHTML = ""
    var roller = 
      <div style="width:66%">
          <table style="width:100%, height:100%; border: 1px lightgray solid">
            <tr>
              <th style="width:33%">Type</th>
              <th style="width:33%">Bonus</th>
            </tr>
            <tr>
              <td>{type}</td>
              <td>{bonus}</td>
              <td>{rollButton}</td>
            </tr>
          </table>
          <div><span>Roll: </span> {output} <span>Result: </span> {result}</div>
        </div>
    pane.appendChild(roller);
    pane.appendChild(footer);
  }
  
  async livelyExample() {
    this.previousRolls = ["1d20", "2d8+5"];
    this.updateView();
  }
  
}