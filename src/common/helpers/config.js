import { Map } from 'immutable';

export const conf = Map(getGlobal().__CONFIG__);

function getGlobal() {
  // window-or-global helper:
  // returns global in Node.JS, returns window in browser
  // https://github.com/purposeindustries/window-or-global/blob/master/lib/index.js
  return (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global.global === global && global) ||
    this;
}
