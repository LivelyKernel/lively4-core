export const AEXPR_IDENTIFIER_NAME = "aexpr";

export const GET_MEMBER = "getMember";
export const GET_AND_CALL_MEMBER = "getAndCallMember";

export const IGNORE_STRING = "aexpr ignore";
export const IGNORE_INDICATOR = Symbol("aexpr ignore");

export const SET_MEMBER_BY_OPERATORS = {
  '=': 'setMember',
  '+=': 'setMemberAddition',
  '-=': 'setMemberSubtraction',
  '*=': 'setMemberMultiplication',
  '/=': 'setMemberDivision',
  '%=': 'setMemberRemainder',
  //'**=': 'setMemberExponentiation',
  '<<=': 'setMemberLeftShift',
  '>>=': 'setMemberRightShift',
  '>>>=': 'setMemberUnsignedRightShift',
  '&=': 'setMemberBitwiseAND',
  '^=': 'setMemberBitwiseXOR',
  '|=': 'setMemberBitwiseOR'
};

export const SET_LOCAL = "setLocal";
export const GET_LOCAL = "getLocal";

export const SET_GLOBAL = "setGlobal";
export const GET_GLOBAL = "getGlobal";

// TODO: use multiple flag for indication of generated content, marking explicit scopes, etc.
export const FLAG_GENERATED_SCOPE_OBJECT = Symbol('FLAG: generated scope object');
export const FLAG_SHOULD_NOT_REWRITE_IDENTIFIER = Symbol('FLAG: should not rewrite identifier');
export const FLAG_SHOULD_NOT_REWRITE_MEMBER_EXPRESSION = Symbol('FLAG: should not rewrite member expression');
export const FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION = Symbol('FLAG: should not rewrite assignment expression');

export const GENERATED_IMPORT_IDENTIFIER = Symbol("generated import identifier");
