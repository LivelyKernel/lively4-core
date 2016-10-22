import { getLocal as _getLocal } from 'aexpr-source-transformation-propagation';
import { getGlobal as _getGlobal } from 'aexpr-source-transformation-propagation';
import { setLocal as _setLocal } from 'aexpr-source-transformation-propagation';
import { getAndCallMember as _getAndCallMember } from 'aexpr-source-transformation-propagation';
import { setGlobal as _setGlobal } from 'aexpr-source-transformation-propagation';
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