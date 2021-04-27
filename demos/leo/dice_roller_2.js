import Morph from 'src/components/widgets/lively-morph.js';

export default class DiceRoller extends Morph {
  
  constructor() {
    super();
  }
  
  async initialize() {
    this.updateView();
  }
  
  onMouseDownOverAmount(evt, currentAmount) {
    evt.preventDefault();
    evt.stopPropagation();
    
    // reset
    var all = currentAmount.parentElement.parentElement.parentElement.querySelectorAll("div[name='value']")
    all.forEach(e => e.style.border = "1px lightgray solid")
    // mark and save new
    currentAmount.style.border = "1px black solid";
    this.amount = currentAmount;
  }
  
  onMouseOverType(evt, currentType) {
    evt.preventDefault();
    evt.stopPropagation();
    
    if (this.amount) {
      // reset
      var all = currentType.parentElement.parentElement.parentElement.querySelectorAll("div[name='value']")
      all.forEach(e => e.style.border = "1px lightgray solid")
      // mark and save new
      currentType.style.border = "1px black solid";
      this.type = currentType;
    }
  }
  
  onMouseOverBonus(evt, currentBonus, currentDigit) {
    evt.preventDefault();
    evt.stopPropagation();
    
    if (this.amount) {
      // reset
      var all = currentBonus.parentElement.parentElement.parentElement.querySelectorAll("div[name='value']")
      all.forEach(e => e.style.border = "1px lightgray solid")
      // mark and save new
      currentBonus.style.border = "1px black solid";
      this.bonus = currentBonus;
    }
    
    this.bonusDigit = currentDigit + 1;
    this.pane = <div></div>
    var roller = this.updateView();
    this.pane.appendChild(roller);
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
      var output = this.amount.value + this.type.value
      if (this.bonus){
        output = output + this.bonus.value
      }
      this.output.value = output;
      this.result.value = this.rollDice(output);
    }
    [this.amount, this.type, this.bonus].forEach(e => {
      if (e) e.style.border = "1px lightgray solid";
    })
    this.amount = undefined;
    this.type = undefined;
    this.bonus = undefined;
  }
  
  makeAmountCell(i) {
    var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid">{i}</div>
    value.value = i;
    var del = <div name="del" style="width:max; text-align:right; cursor: pointer">X</div>;

    const currentAmount = value

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
    var del = <div name="del" style="width:max; text-align:right; cursor: pointer">X</div>;

    const currentType = value

    value.addEventListener('mouseover', (evt) => this.onMouseOverType(evt, currentType));

    var cell = 
        <tr>
          <td style="width: 33%"></td>
          <td style="width: 33%">{value}</td>
          <td style="width: 33%">{del}</td>
        </tr>
    return cell;
  }
  
  makeBonusCell(e) {
    var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">{e}</div>
    value.value = e;
    
    const currentBonus = value
    const currentDigit = this.bonusDigit;

    value.addEventListener('mouseover', (evt) => this.onMouseOverBonus(evt, currentBonus, currentDigit));

    var cell = 
        <tr>
          <td>{value}</td>
        </tr>
    return cell;
  }
  
  makeBonusStack() {
    var bonusStack = <table style="width:50px"></table>;
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach(e => {
      var cell = this.makeBonusCell(e);
      bonusStack.digit = this.bonusDigit;
      bonusStack.appendChild(cell);
    })
    return bonusStack;
  }
  
  create() {
    this.pane = <div></div>;
    this.bonusDigit = 1;
    var roller = this.updateView();
    this.pane.appendChild(roller);
    return this.pane;
  }
  
  updateView(){
    var pane = this.get("#pane")
    
    // amount
    var table = <table style="width:100%"></table>
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
    var typeTable = <table style="width:100%"></table>;
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
    
    lively.notify("DIGIT", this.bonusDigit)
    for (i = 0; i < this.bonusDigit; i++) {
      var stack = this.makeBonusStack();
      bonusStacks.appendChild(<td>{stack}</td>);
    }
    
    // result
    this.output = <input></input>
    this.result = <input></input>
    
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
          <span>Roll: </span> {this.output} <span>Result: </span> {this.result}
        </div>
    roller.addEventListener('mouseleave', (evt) => this.onMouseUp(evt));
    roller.addEventListener('mouseup', (evt) => this.onMouseUp(evt));
    pane.appendChild(roller)
  }
  
  livelyExample() {
    this.updateView()
  }
}