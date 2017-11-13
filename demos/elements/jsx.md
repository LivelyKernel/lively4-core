# JS X

```JS
foo.bar('foo', 42)
```
<script>
var hello = "world1!"
var element = <button>hello</button>
element
</script>


<div>
Foo


<script>
var hello2 = "world2!" // this is shown when it does not work... hehe
var element = <button>hello2</button>
element
</script>

<script>
let div = <div></div>;
div.innerHTML = "";

div.appendChild(<button style="background-color: red" />);

let ty = { pe: "checkbox" };
div.appendChild(<input type={ty.pe} checked />);

let b2 = <button />;
div.appendChild(<div style="width: 100px; height: 100px; background-color: red">
Text<button />Text{b2}</ div>);

let but = { tons: [<button />, <button />, <button />]};
div.appendChild(<div style="width: 100px; height: 100px; background-color: yellow">
{...but.tons}</ div>);

let attribs = {
  style: "width: 100px; height: 100px; background-color: green"
}
div.appendChild(<div {...attribs} />);
div;
</script>

</div>