export class Config {
  constructor(config) {
    // https://github.com/purposeindustries/window-or-global/blob/master/lib/index.js
    // Establish the root object, `window` in the browser, or `global` on the server.
    let root = typeof self == 'object' && self.Object == Object && self;
    // root is window, we expect it to have config
    if (root && !root.__CONFIG__) {
      throw new ReferenceError('Client config: no config defined.');
    }
    // root is not window; test for node global and assign to avoid ref error
    // we don't expect config here, this is client side only, but we can set it
    // for unit tests
    root = root || (typeof global == 'object' && global.Object == Object && global);

    this._store = config || root.__CONFIG__;
  }

  get(key) {
    let target = this._store;
    const path = this._path(key);

    while (path.length > 0) {
      key = path.shift();

      if (target && target.hasOwnProperty(key)) {
        target = target[key];
        continue;
      }
      return undefined;
    }

    return target;
  }

  _path(key) {
    return (key == null) ? [] : key.split(':');
  }
}

export default new Config();
