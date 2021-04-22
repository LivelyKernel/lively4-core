# Dropdown

## Just a List
<div>
  <label for="fruits">Choose a Fruit</label>
  <select id="fruitList" name="fruits">
    <option value="a">Apple</option>
    <option value="b">Banana</option>
    <option value="c">Cherries</option>
    <option value="d">Dragon Fruit</option>
  </select>
</div>

## And with Input Field with Suggestion List

<div>
  <input type="text" name="product" list="productName"/>
  <datalist id="productName">
      <option value="Pen">Pen</option>
      <option value="Pencil">Pencil</option>
      <option value="Paper">Paper</option>
  </datalist>
</div>

The List does not allow to select from all choices.

<div>
  <input name="fruit" type="text" list="fruitList2" />
  <datalist id="fruitList2">
    <option value="Apple">Apple</option>
    <option value="Banana">Banana</option>
    <option value="Cherries">Cherries</option>
    <option value="Dragon Fruit">Dragon Fruit</option>
  </datalist>
</div>


## Alternative

based on <https://stackoverflow.com/questions/264640/how-can-i-create-an-editable-dropdownlist-in-html>

<style>
  .dropdown {
    position: relative;
    width: 200px;
  }

  .dropdown select {
    width: 100%;
  }

  .dropdown > * {
    box-sizing: border-box;
    height: 1.5em;
  }

  .dropdown input {
    position: absolute;
    width: calc(100% - 20px);
  }
</style>


<div class="dropdown">
  <input type="text" />
  <select  onchange="this.previousElementSibling.value=this.value; this.previousElementSibling.focus()">
    <option>This is option 1</option>
    <option>Option 2</option>
  </select>
</div>

