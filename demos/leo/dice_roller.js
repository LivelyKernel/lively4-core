export default class DiceRoller {
  
  onMouseDownOverAmount(evt, currentAmount) {
    evt.preventDefault();
    evt.stopPropagation();
    var all = currentAmount.parentElement.parentElement.parentElement.querySelectorAll("div[name='value']")
    all.forEach(e => e.style.border = "1px lightgray solid")
    lively.notify("ELEMENT", currentAmount.value)
    currentAmount.style.border = "1px black solid";
    this.amount = currentAmount.value;
  }
  
  onMouseOver(evt) {
    
  }
  
  create() {
    this.amounts = []
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
      
      this.amounts.push(value)
      
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
    
    amount.addEventListener('mouseover', (evt) => this.onMouseOver(evt));
    
    var roller = 
        <table style="width:100%">
          <tr>
            <th style="width:33%">Amount</th>
            <th style="width:33%">Type</th>
            <th style="width:33%">Bonus</th>
          </tr>
          <tr>
            <td>{amount}</td>
          </tr>
        </table>
    
    return roller
  }
}