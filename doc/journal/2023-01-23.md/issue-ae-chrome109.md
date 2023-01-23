# Issue AE chrome 109
```javascript
let widget, shadow, checkedCheckbox, checkedRadio, selection;

(async function() {
  widget = await lively.create('matches-in-shadow', document.body);
  shadow = widget.shadowRoot;
  shadow.appendChild(<input type="checkbox"></input>);
  checkedCheckbox = shadow.appendChild(<input type="checkbox" checked></input>);
  shadow.appendChild(<input type="radio"></input>);
  checkedRadio = shadow.appendChild(<input type="radio" checked></input>);
  selection = widget.select('input:checked');
  widget.select("input").now()
})();


```