import { getGlobal as _getGlobal } from "aexpr-source-transformation-propagation";
import { getMember as _getMember } from "aexpr-source-transformation-propagation";
import { setMember as _setMember } from "aexpr-source-transformation-propagation";
// nested left side of assignment
_setMember(_getMember((_getGlobal("a"), a), "b"), "c", _getMember((_getGlobal("y"), y), "z"));