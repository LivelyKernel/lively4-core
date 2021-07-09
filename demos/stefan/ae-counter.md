# A Simple Reactive Counter

With JSX and Active Expression shorthand notation:

```JavaScript
let counter = 0;
<div>
  <div>Starting at: {counter}</div>
  <div>Counter: {ae(counter)}</div> 
  <div>Colored Counter: {ae(<span style={'color: ' + (counter >= 3 ? 'blue' : 'red')}>{counter}</span>)}</div> 
  <button click={() => counter++}>inc</button>
</div>;
```

Running example:

<script>
let counter = 0;
<div style='border: dashed 1px black; background: lightgray; width: 200px'>
  <div>Starting at: {counter}</div>
  <div>Counter: {ae(counter)}</div> 
  <div>Colored Counter: {ae(<span style={'color: ' + (counter >= 3 ? 'blue' : 'red')}>{counter}</span>)}</div> 
  <button click={() => counter++}>increment</button>
</div>;
</script>