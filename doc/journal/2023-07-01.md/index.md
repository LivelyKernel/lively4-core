## 2023-07-01 UBG Half Card Costs and Effects
*Author: @onsetsu*

```javascript
// find all occurences of the regex pattern /\(\d*x?\)/ in card texts. then, replace these patterns with half the number rounded up. Assign via setText method. 
that.cards.forEach(card => {
  const text = card.getText();
  if (typeof text !== 'string') {
    return;
  }

  const regex = /\((\d*)(x?)([+-]?)\)/g;
  const replacer = (match, num, scaling, sign) => {
    let newNum = ''
    if (num) {
      newNum = (parseInt(num) / 2).ceil()
      if (newNum === 1 && scaling) {
        newNum = ''
      }
    }

    return `(${newNum}${scaling}${sign})`
  }

  const newText = text.replaceAll(regex, replacer)
  card.setText(newText);
});
```