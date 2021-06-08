# Import HTML Example


## Use HTML like Images

like this:

```markdown
![](../../src/parts/ConnectorExample.html)
```


![](../../src/parts/ConnectorExample.html)


Make sure, that the content int this HTML file can be positioned either automatically or relative.
E.g. if there are "absolute" positioned element. User "position:relative" to ensure a new coordinates origin.

The included HTML has to look like this in the top level element:

```html
<div style="position: relative; left: 0px; top: 0px; width: 500px; height: 300px;">
...
</div>
```

## And import the same again...

![](../../src/parts/ConnectorExample.html)

