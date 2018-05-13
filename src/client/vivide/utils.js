import { isFunction } from 'utils';

export const contentFolder = lively4url + '/src/client/vivide/scripts/';
export const scriptFolder = contentFolder + 'scripts/';
export const stepFolder = contentFolder + 'steps/';

export function config(conf) {
  if(!isFunction(this)) {
    throw new TypeError('config of vivide script can only be called on objects.');
  }
  
  this.__vivideStepConfig__ = conf;
  
  return this;
}