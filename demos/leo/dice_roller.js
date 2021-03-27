export default class DiceRoller {
  
  onMouseDownOverAmount(evt, element) {
    evt.preventDefault();
    evt.stopPropagation();
    this.amount = element.value;
    var all = element.parentElement.parentElement.parentElement.querySelectorAll("div[name='value']")
    all.forEach(e => e.style.border = "1px lightgray solid")
    lively.notify("ALL", all)
    element.style.border = "1px black solid";
  }
  
  onMouseOver(evt) {
    
  }
  
  create() {
    
    var value1 = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">1</div>
    value1.value = 1;
    
    var value2 = <div name="value" style="width:max; text-align:center; background-color: lightgray; border: 1px lightgray solid; cursor: grab">2</div>
    value2.value = 2;
    
    var del = <div style="width:max; text-align:right; cursor: pointer">X</div>;
    var del2 = <div style="width:max; text-align:right; cursor: pointer">X</div>;
    var amount = <div style="padding:5px">
        <div style="border: 1px solid black; margin:auto">
          <table style="width:100%">
            <tr>
              <td style="width: 33%"></td>
              <td style="width: 33%">{value1}</td>
              <td style="width: 33%">{del}</td>
            </tr>
            <tr>
              <td style="width: 33%"></td>
              <td style="width: 33%">{value2}</td>
              <td style="width: 33%">{del2}</td>
            </tr>
          </table>
        </div>
      </div>
    
    value1.addEventListener('mousedown', (evt) => this.onMouseDownOverAmount(evt, value1));
    value2.addEventListener('mousedown', (evt) => this.onMouseDownOverAmount(evt, value2));
    
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