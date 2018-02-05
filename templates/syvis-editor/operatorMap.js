/* eslint-disable indent */
const binary = {
    ',': 'comma',
    '...': 'spread',

   '||': 'or',
   '&&': 'and',

   '==': 'equals',
   '!=': 'equals-not',
  '===': 'equals-strict',
  '!==': 'equals-strict-not',

    '<': 'less-than',
    '>': 'greater-than',
   '<=': 'less-than-equals',
   '>=': 'greater-than-equals',

   '<<': 'shift-left',
   '>>': 'shift-right',
   '>>>': 'shift-right-zero-fill',

   '?': 'ternary',

    '+': 'add',
    '-': 'subtract',
    '*': 'multiply',
    '/': 'divide',
    '%': 'remainder',
   '**': 'exponent',

   '&': 'bit-and',
   '|': 'bit-or',
   '^': 'bit-xor',

     '=': 'assign',
    '+=': 'assign-add',
    '-=': 'assign-subtract',
    '*=': 'assign-multiply',
    '/=': 'assign-divide',
    '%=': 'assign-remainder',
   '**=': 'assign-exponent',
   '<<=': 'assign-shift-left',
   '>>=': 'assign-shift-right',
  '>>>=': 'assign-shift-right-unsigned',
    '&=': 'assign-bit-and',
    '^=': 'assign-bit-xor',
    '|=': 'assign-bit-or',

   instanceof: 'instanceof',
   in: 'in',
}


const unary = {
   '!': 'not',

   '+': 'plus',
   '-': 'negate',

  '++': 'increment',
  '--': 'decrement',

   '~': 'bit-not',

  delete: 'delete',
  new: 'new',
  typeof: 'typeof',
  void: 'void',
  yield: 'yield',
}

export {unary, binary}
