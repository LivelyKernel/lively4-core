import { setMemberAddition as _setMemberAddition } from "aexpr-source-transformation-propagation";
import { getGlobal as _getGlobal } from "aexpr-source-transformation-propagation";
import { setMemberUnsignedRightShift as _setMemberUnsignedRightShift } from "aexpr-source-transformation-propagation";
_setMemberUnsignedRightShift((_getGlobal("a"), a), "a", (_getGlobal("i"), i));
_setMemberAddition((_getGlobal("a"), a), "b", 15);