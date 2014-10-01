module.exports = {
  string: module.require('./string').string,
  num: module.require('./number').num,
  arr: module.require('./collection').arr,
  grid: module.require('./collection').grid,
  interval: module.require('./collection').interval,
  arrayProjection: module.require('./collection').arrayProjection,
  obj: module.require('./object').obj,
  properties: module.require('./object').properties,
  path: module.require('./object').path,
  fun: module.require('./function').fun,
  date: module.require('./date').date
}
