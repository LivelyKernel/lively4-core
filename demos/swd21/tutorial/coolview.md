## Generating JSX/HTML in Scripts

- (A) Importing JavaScript modules 
- (B) Constructing repository absolute URLs with `lively4url`

- Las
- Fetching content from URLs
- Generating HTML/JSX content in scripts

### Script

```javascript
<script id="script">
  import CoolView from "./coolview.js" // (A)
  var url = lively4url + "/demos/swd21/tutorial/list.txt"; // (B)
  CoolView.render(url) // (C)
</script>
```

### Result
<script id="script">
  import CoolView from "./coolview.js"
  var url = lively4url + "/demos/swd21/tutorial/list.txt"; 
  CoolView.render(url) 
</script>





