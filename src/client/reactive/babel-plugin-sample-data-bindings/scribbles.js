const target = document.getElementById('target');

target.style.width <~ that.style.width






ae(that.style.width).onChange(v => target.style.width = v)
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js'
AExprRegistry.allAsArray().last.dispose()