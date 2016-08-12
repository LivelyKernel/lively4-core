import { getMember as _getMember } from "aexpr-source-transformation-propagation";
import { setMember as _setMember } from "aexpr-source-transformation-propagation";
// nested left side of assignment
_setMember(_getMember(a, "b"), "c", "=", _getMember(y, "z"));