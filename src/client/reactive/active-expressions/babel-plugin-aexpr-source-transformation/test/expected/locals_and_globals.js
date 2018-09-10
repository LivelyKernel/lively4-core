import { getLocal as _getLocal } from 'active-expression-rewriting';
import { getGlobal as _getGlobal } from 'active-expression-rewriting';
import { setLocal as _setLocal } from 'active-expression-rewriting';
import { getAndCallMember as _getAndCallMember } from 'active-expression-rewriting';
import { setGlobal as _setGlobal } from 'active-expression-rewriting';
let _scope = {};
var x = 5,
    z = 42;

glob3 = (glob = 'foo', _setGlobal('glob'), glob), _setGlobal('glob3'), glob3;
_getAndCallMember((glob = 42, _setGlobal('glob'), glob), 'toString', []);
x = (_getGlobal('glob'), glob) + 4, _setLocal(_scope, 'x'), x;
glob2 = (_getLocal(_scope, 'x'), x) + 3, _setGlobal('glob2'), glob2;
z = (_getLocal(_scope, 'x'), x), _setLocal(_scope, 'z'), z;
z = (_getGlobal('xGlobal'), xGlobal), _setLocal(_scope, 'z'), z;
(_getGlobal('func'), func)((_getGlobal('glob'), glob));
