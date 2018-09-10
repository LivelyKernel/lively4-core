import { getGlobal as _getGlobal } from "active-expression-rewriting";
import { getMember as _getMember } from "active-expression-rewriting";
import { setMember as _setMember } from "active-expression-rewriting";
// nested left side of assignment
_setMember(_getMember((_getGlobal("a"), a), "b"), "c", _getMember((_getGlobal("y"), y), "z"));
