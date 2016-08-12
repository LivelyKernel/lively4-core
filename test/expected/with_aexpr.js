import { aexpr as _aexpr } from "aexpr-source-transformation-propagation";
import { getAndCallMember as _getAndCallMember } from "aexpr-source-transformation-propagation";
_getAndCallMember(_aexpr(() => _getAndCallMember(r1, "area", []), foo), "onChange", [() => _getAndCallMember(console, "log", ["changed"])]);