import { getMember as _getMember } from "aexpr-source-transformation-propagation";
import { getAndCallMember as _getAndCallMember } from "aexpr-source-transformation-propagation";
import { setMember as _setMember } from "aexpr-source-transformation-propagation";
var a = { b: 1, fn() {
    return {};
  } };
var c = {};

// Mixin everything together
_setMember(_getAndCallMember(a, "fn", []), _getMember(c, "d"), 1);