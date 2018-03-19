import { isFunction } from 'utils';

export function scriptFolder() {
  return lively4url + '/src/client/vivide/scripts/';
}

export function config(conf) {
  if(!isFunction(this)) {
    throw new TypeError('config of vivide script can only be called on objects.');
  }
  
  return this;
}