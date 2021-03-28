export default class DiceRoller {
  
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
  
  onMouseOverBonus(evt, currentBonus) {
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
  }
  
  onMouseUp(evt) {
    if (this.amount && this.type) {
      var output = this.amount.value + this.type.value
      if (this.bonus){
        output = output + this.bonus.value
      }
      this.output.value = output;
    }
    [this.amount, this.type, this.bonus].forEach(e => {
      if (e) e.style.border = "1px lightgray solid";
    })
    this.amount = undefined;
    this.type = undefined;
    this.bonus = undefined;
  }
  
  create() {

    // amount
    var table = <table style="width:100%"></table>
    var amount = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          {table}
        </div>
      </div>

    for (var i = 1; i <= 4; i++) {
      var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">{i}</div>
      value.value = i;
      var del = <div style="width:max; text-align:right; cursor: pointer">X</div>;
      
      const currentAmount = value
      value.addEventListener('mousedown', (evt) => this.onMouseDownOverAmount(evt, currentAmount));
      
      var cell = 
          <tr>
            <td style="width: 33%"></td>
            <td style="width: 33%">{value}</td>
            <td style="width: 33%">{del}</td>
          </tr>
      table.appendChild(cell)
    }
    
    
    // type
    var typeTable = <table style="width:100%"></table>;
    var type = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          {typeTable}
        </div>
      </div>;
    
    ["d4", "d6", "d8", "d10", "d12", "d20"].forEach(e => {
      var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">{e}</div>
      value.value = e;
      var del = <div style="width:max; text-align:right; cursor: pointer">X</div>;
      
      const currentType = value
      
      value.addEventListener('mouseover', (evt) => this.onMouseOverType(evt, currentType));
      
      var cell = 
          <tr>
            <td style="width: 33%"></td>
            <td style="width: 33%">{value}</td>
            <td style="width: 33%">{del}</td>
          </tr>
      typeTable.appendChild(cell)
    })
    
    
    // bonus
    var bonusTable = <table style="width:100%"></table>;
    var bonus = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          {bonusTable}
        </div>
      </div>;
    
    ["-1", "0", "+1", "+2", "+3", "+4"].forEach(e => {
      var value = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">{e}</div>
      value.value = e;
      var del = <div style="width:max; text-align:right; cursor: pointer">X</div>;
      
      const currentBonus = value
      
      value.addEventListener('mouseover', (evt) => this.onMouseOverBonus(evt, currentBonus));
      
      var cell = 
          <tr>
            <td style="width: 33%"></td>
            <td style="width: 33%">{value}</td>
            <td style="width: 33%">{del}</td>
          </tr>
      bonusTable.appendChild(cell)
    })
    
    this.output = <input></input>
    
    var roller = 
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
          <tr>
            {this.output}
          </tr>
        </table>
    roller.addEventListener('mouseleave', (evt) => this.onMouseUp(evt));
    roller.addEventListener('mouseup', (evt) => this.onMouseUp(evt));
    
    return roller
  }
}