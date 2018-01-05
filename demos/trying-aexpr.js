"enable aexpr";
import * as u from "utils";

//debugger;
var a = 0;
aexpr(() => a).onChange(v => lively.notify(v))
a = 2;
lively.notify("123");
