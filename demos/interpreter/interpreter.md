
<script>
import { ensureJSInterpreter } from 'src/client/preload-gs.js'

</script>

<lively-code-mirror id='code1'>
var x = 42
x
</lively-code-mirror>


<script>
const i = new Interpreter(lively.query(this, '#code1').value);

</script>