import { getGlobal as _getGlobal } from "active-expression-rewriting";
import { aexpr as _aexpr } from "active-expression-rewriting";
import { getAndCallMember as _getAndCallMember } from "active-expression-rewriting";
_getAndCallMember(_aexpr(() => _getAndCallMember((_getGlobal("r1"), r1), "area", []), (_getGlobal("foo"), foo)), "onChange", [() => _getAndCallMember((_getGlobal("console"), console), "log", ["changed"])]);
