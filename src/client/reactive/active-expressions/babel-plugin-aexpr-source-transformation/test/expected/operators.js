import { setMemberAddition as _setMemberAddition } from "active-expression-rewriting";
import { getGlobal as _getGlobal } from "active-expression-rewriting";
import { setMemberUnsignedRightShift as _setMemberUnsignedRightShift } from "active-expression-rewriting";
_setMemberUnsignedRightShift((_getGlobal("a"), a), "a", (_getGlobal("i"), i));
_setMemberAddition((_getGlobal("a"), a), "b", 15);
