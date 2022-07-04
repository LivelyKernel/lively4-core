# `offsetParent`  Hierarchy Example

For [https://bugs.chromium.org/p/chromium/issues/detail?id=1334556](): fails in Chrome V102, reverted in V103

### Example

Click the button below to reveal the `offsetParent` hierarchy of that button (also shows all elements in hierarchy).

Elements will be displaced as:
<script>
<span>
  {lively.elementPrinter.tagName.id.classes.offset(<tag id='id' class='classes'/>)}
<i class="fa fa-arrow-right" style="color: gray"></i> its offsetParent
</span>
</script>
with `offsetLeft` and `offsetTop` rendered before the arrow.

<offset-parent>
<offset-parent-inner></offset-parent-inner>
</offset-parent>

### Relevant Files

**this example**
[ [**md**](edit://demos/offset-parent.md) ]

**offset-parent**
[ [**js**](edit://templates/offset-parent.js) | [**html**](edit://templates/offset-parent.html) | [**open**](open://offset-parent) ]

**offset-parent-inner**
[ [**js**](edit://templates/offset-parent-inner.js) | [**html**](edit://templates/offset-parent-inner.html) | [**open**](open://offset-parent-inner) ]


