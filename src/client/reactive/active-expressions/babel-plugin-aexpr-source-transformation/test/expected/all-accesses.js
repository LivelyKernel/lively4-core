import { getMember as _getMember } from "active-expression-rewriting";
import { getLocal as _getLocal } from "active-expression-rewriting";
import { getAndCallMember as _getAndCallMember } from "active-expression-rewriting";
import { setMember as _setMember } from "active-expression-rewriting";
let _scope = {};
var a = { b: 1, fn() {
    return {};
  } };
var c = {};

// Mixin everything together
_setMember(_getAndCallMember((_getLocal(_scope, "a"), a), "fn", []), _getMember((_getLocal(_scope, "c"), c), "d"), 1);
