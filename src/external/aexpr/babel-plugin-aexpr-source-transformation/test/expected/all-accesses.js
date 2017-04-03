import { getMember as _getMember } from "aexpr-source-transformation-propagation";
import { getLocal as _getLocal } from "aexpr-source-transformation-propagation";
import { getAndCallMember as _getAndCallMember } from "aexpr-source-transformation-propagation";
import { setMember as _setMember } from "aexpr-source-transformation-propagation";
let _scope = {};
var a = { b: 1, fn() {
    return {};
  } };
var c = {};

// Mixin everything together
_setMember(_getAndCallMember((_getLocal(_scope, "a"), a), "fn", []), _getMember((_getLocal(_scope, "c"), c), "d"), 1);