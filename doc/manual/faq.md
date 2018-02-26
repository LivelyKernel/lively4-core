# FAQ for WebDev and Lively4 Programming

## Web Components

### Q: Wo ist konfiguriert, welche Ordner zum Laden von WebComponents in Betracht gezogen werden?

A: Im [Componentloader](https://lively-kernel.org/lively4/lively4-core/src/client/morphic/component-loader.js) wird das durch die Methode `getTemplatePaths` spezifiziert.
Gerade sind das:

<script>
import ComponentLoader from "src/client/morphic/component-loader.js";

<ul>
{...ComponentLoader.getTemplatePaths().map(path => <li>{path}</li>)}
</ul>
</script>


## Q: Können auch compile to JavaScript sprachen verwendet werden? (z.B. TypeScript, PureScript, …)

Every language can be used, as long as it can be edited in Lively4 at runtime and does not require server side compilation. 
