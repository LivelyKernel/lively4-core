import { getGlobal as _getGlobal } from "aexpr-source-transformation-propagation";
import { aexpr as _aexpr } from "aexpr-source-transformation-propagation";
import { getAndCallMember as _getAndCallMember } from "aexpr-source-transformation-propagation";
_getAndCallMember(_aexpr(() => _getAndCallMember((_getGlobal("r1"), r1), "area", []), (_getGlobal("foo"), foo)), "onChange", [() => _getAndCallMember((_getGlobal("console"), console), "log", ["changed"])]);