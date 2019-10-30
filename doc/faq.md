# FAQ for WebDev and Lively4 Programming

## Web Components

### Q: How does the system look for web-components to load?

A: The copmponent load paths are computed in [component-loader](browse://src/client/morphic/component-loader.js) >> `getTemplatePaths`. Currently the following paths are searched:

<script>
import ComponentLoader from "src/client/morphic/component-loader.js";

<ul>
{...ComponentLoader.getTemplatePaths().map(path => <li>{path}</li>)}
</ul>
</script>


## Q: Is it possible to use other languages/dialects that are compiled to JavaScript? (e.g. TypeScript, PureScript, …)

A: Every language can be used, as long as it can be edited in Lively4 at runtime and does not require server side compilation. 
