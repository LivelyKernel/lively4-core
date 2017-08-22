// #TODO: through!!!!
//Promise.resolve([123])
//::through(s=>{ "s is 123" })
//.then

export * from './lodash-bound.js';

export function through(func, ...args) {
  func(this, ...args);
  return this;
}
