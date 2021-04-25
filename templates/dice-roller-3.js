"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class DiceRoller3 extends Morph {
  async initialize() {
    this.bonusDigit = 1;
    this.bonus = [];
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
    return "" + diceResults.join("+") + "=" + diceResults.reduce((acc, val) => acc + val);
  }
  
  onMouseUp(evt) {
    if (this.amount && this.type) {
      var output = this.amount + this.type
      if (this.bonus){
        output = output + "+" + this.bonus.join('') // TODO: Vorzeichen
      }
      this.output = output;
      this.result = this.rollDice(output);
    }
    this.amount = undefined;
    this.type = undefined;
    this.bonus = [];
    this.bonusDigit = 1;
    this.updateView();
  }
  
  makeAmountCell(i) {
    var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid">{i}</div>
    value.value = i;
    if (value.value === this.amount) {
      value.style.border = "1px black solid";
    }
    var del = <div name="del" style="width:max; text-align:right; cursor: pointer">X</div>;

    const currentAmount = value.value;

    var cell = 
        <tr style="cursor: grab">
          <td style="width: 33%"></td>
          <td style="width: 33%">{value}</td>
          <td style="width: 33%">{del}</td>
        </tr>
    cell.addEventListener('mousedown', (evt) => this.onMouseDownOverAmount(evt, currentAmount));
    return cell;
  }
  
  makeTypeCell(e) {
    var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">{e}</div>
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
    var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">{e}</div>
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
  
  makeBonusStack(currentDigit) {
    var bonusStack = <table style="width:50px"></table>;
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach(e => {
      var cell = this.makeBonusCell(e, currentDigit);
      bonusStack.digit = currentDigit;
      bonusStack.appendChild(cell);
    })
    return bonusStack;
  }
  
  updateView(){
    var pane = this.get("#pane")
    
    // amount
    var table = <table style="width:100%; min-width: 120px"></table>
    var amount = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          {table}
        </div>
      </div>

    for (var i = 1; i <= 6; i++) {
      var cell = this.makeAmountCell(i);
      table.appendChild(cell)
    }
    // to add amounts
    var addAmountInput = <input type="number" style="width: 70%; margin-top: 5px"></input>
    var addAmountButton = 
      <button style="float: right" click={() => {
          var cell = this.makeAmountCell(addAmountInput.value);
          table.appendChild(cell);
        }}>add</button>
    var additionalAmount = 
        <div>
          {addAmountInput}
          {addAmountButton}
        </div>
    amount.appendChild(additionalAmount)

    // type
    var typeTable = <table style="width:100%; min-width: 120px"></table>;
    var type = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          {typeTable}
        </div>
      </div>;
    
    ["d4", "d6", "d8", "d10", "d12", "d20"].forEach(e => {
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
    var bonusStacks = <tr></tr>;
    var bonus = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          <table>{bonusStacks}</table>
        </div>
      </div>;
    
    for (i = 1; i <= this.bonusDigit; i++) {
      var stack = this.makeBonusStack(i);
      bonusStacks.appendChild(<td>{stack}</td>);
    }
    
    // result
    var output = <input></input>;
    if (this.output) { output.value = this.output }
    var result = <input></input>;
    if (this.result) { result.value = this.result }
    
    pane.innerHTML = ""
    var roller = 
      <div>
          <table style="width:100%, height:100%; border: 1px lightgray solid">
            <tr>
              <th style="width:33%">Amount</th>
              <th style="width:33%">Type</th>
              <th style="width:33%">Bonus</th>
            </tr>
            <tr>
              <td>{amount}</td>
              <td>{type}</td>
              <td>{bonus}</td>
            </tr>
          </table>
          <span>Roll: </span> {output} <span>Result: </span> {result}
        </div>
    roller.addEventListener('mouseleave', (evt) => this.onMouseUp(evt));
    roller.addEventListener('mouseup', (evt) => this.onMouseUp(evt));
    pane.appendChild(roller)
  }
  
  async livelyExample() {
    this.updateView()
  }
  
}