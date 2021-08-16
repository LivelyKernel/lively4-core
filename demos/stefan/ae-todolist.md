# Reactive TODO list

With JSX and Active Expression shorthand notation:

```JavaScript
const todos = ['finishing this example'];
const input = <input value='getting back to writing' keydown={evt => {
  if (evt.keyCode === 13) addTodo()
}}></input>;

function addTodo() {
  todos.push(input.value);
  input.value = '';
  input.focus();
}

<div style='border: dashed 1px black; background: lightgray; width: 400px'>
  New Todo: {input}
  <button click={addTodo}>Add</button>
  {ae(<ol>{...todos.map(t => <li>{t}</li>)}</ol>)}
</div>
```

Running example:

<script>
const todos = ['finishing this example'];
const input = <input value='getting back to writing' keydown={evt => {
  if (evt.keyCode === 13) addTodo()
}}></input>;

function addTodo() {
  todos.push(input.value);
  input.value = '';
  input.focus();
}

<div style='border: dashed 1px black; background: lightgray; width: 400px'>
  New Todo: {input}
  <button click={addTodo}>Add</button>
  {ae(<ol>{...todos.map(t => <li>{t}</li>)}</ol>)}
</div>
</script>