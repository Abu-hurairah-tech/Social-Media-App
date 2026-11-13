/**
 * tests/e2e/helpers/store_loader.js
 * Isolated LocalStorage mock and sandbox loader for ES6 store modules.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MockLocalStorage {
  constructor(initialData = {}) {
    this.store = { ...initialData };
    this._shouldThrowOnSet = false;
    this._shouldThrowOnGet = false;
  }

  getItem(key) {
    if (this._shouldThrowOnGet) {
      throw new Error('Simulated LocalStorage Read Error');
    }
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key, value) {
    if (this._shouldThrowOnSet) {
      const err = new Error('Simulated QuotaExceededError: LocalStorage quota exceeded.');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] || null;
  }

  simulateQuotaExceeded(enable = true) {
    this._shouldThrowOnSet = enable;
  }

  simulateReadError(enable = true) {
    this._shouldThrowOnGet = enable;
  }
}

/**
 * Creates a virtual browser environment with MockLocalStorage.
 */
function createVirtualBrowserEnv(initialStorage = {}) {
  const localStorage = new MockLocalStorage(initialStorage);
  const eventListeners = new Map();

  const fakeDocument = {
    addEventListener: (evt, cb) => {
      if (!eventListeners.has(evt)) eventListeners.set(evt, []);
      eventListeners.get(evt).push(cb);
    },
    getElementById: (id) => ({
      id,
      innerHTML: '',
      textContent: '',
      children: [],
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: (c) => c,
      addEventListener: () => {}
    }),
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      innerHTML: '',
      textContent: '',
      children: [],
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: (c) => c,
      addEventListener: () => {}
    }),
    body: {
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      }
    }
  };

  const fakeWindow = {
    localStorage,
    location: {
      href: 'http://localhost/index.html',
      pathname: '/index.html',
      search: ''
    },
    addEventListener: (evt, cb) => {
      fakeDocument.addEventListener(evt, cb);
    }
  };

  return {
    localStorage,
    window: fakeWindow,
    document: fakeDocument,
    eventListeners,
    fireEvent: (eventName, data) => {
      const handlers = eventListeners.get(eventName) || [];
      handlers.forEach(h => h(data));
    }
  };
}

/**
 * Transforms ES6 module source into executable sandbox code
 */
function transformEsmToSandbox(source) {
  let transformed = source;

  // Convert combined imports: import x, { a, b } from './x.js' -> const x = __requireModule('./x.js'); const { a, b } = x;
  transformed = transformed.replace(
    /import\s+([a-zA-Z0-9_$]+)\s*,\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
    'const $1 = __requireModule("$3"); const { $2 } = $1;'
  );

  // Convert namespace imports: import * as x from './x.js' -> const x = __requireModule('./x.js')
  transformed = transformed.replace(
    /import\s*\*\s*as\s+([a-zA-Z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
    'const $1 = __requireModule("$2");'
  );

  // Convert named imports: import { a, b } from './x.js' -> const { a, b } = __requireModule('./x.js')
  transformed = transformed.replace(
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
    'const { $1 } = __requireModule("$2");'
  );

  // Convert default imports: import x from './x.js' -> const x = __requireModule('./x.js')
  transformed = transformed.replace(
    /import\s+([a-zA-Z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
    'const $1 = __requireModule("$2");'
  );

  // Convert side-effect imports: import './x.js' -> __requireModule('./x.js')
  transformed = transformed.replace(
    /import\s*['"]([^'"]+)['"]\s*;?/g,
    '__requireModule("$1");'
  );

  // Convert export const / let / var: export const foo = ... -> const foo = ...; exports.foo = foo;
  transformed = transformed.replace(
    /export\s+(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g,
    '$1 $2 = exports.$2 ='
  );

  // Convert export function: export function foo(...) -> function foo(...); exports.foo = foo;
  transformed = transformed.replace(
    /export\s+function\s+([a-zA-Z0-9_$]+)/g,
    'function $1'
  );
  // Match exported function names to assign to exports
  const fnMatches = source.matchAll(/export\s+function\s+([a-zA-Z0-9_$]+)/g);
  for (const m of fnMatches) {
    transformed += `\nexports.${m[1]} = ${m[1]};`;
  }

  // Convert export class: export class Bar -> class Bar; exports.Bar = Bar;
  transformed = transformed.replace(
    /export\s+class\s+([a-zA-Z0-9_$]+)/g,
    'class $1'
  );
  const classMatches = source.matchAll(/export\s+class\s+([a-zA-Z0-9_$]+)/g);
  for (const m of classMatches) {
    transformed += `\nexports.${m[1]} = ${m[1]};`;
  }

  // Convert export default
  transformed = transformed.replace(
    /export\s+default\s+/g,
    'exports.default = module.exports = '
  );

  return transformed;
}

/**
 * Loads a JavaScript module file in a virtualized browser sandbox.
 * @param {string} filePath - Absolute path to .js module
 * @param {Object} env - Virtual browser env created by createVirtualBrowserEnv()
 * @param {Object} loadedModulesCache - Cache of already-evaluated modules
 */
function loadModuleInEnv(filePath, env, loadedModulesCache = new Map()) {
  const resolvedPath = path.resolve(filePath);
  if (loadedModulesCache.has(resolvedPath)) {
    return loadedModulesCache.get(resolvedPath);
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Module file not found: ${resolvedPath}`);
  }

  const rawSource = fs.readFileSync(resolvedPath, 'utf8');
  const transformed = transformEsmToSandbox(rawSource);

  const mod = { exports: {} };
  loadedModulesCache.set(resolvedPath, mod.exports);

  const __requireModule = (relativeImportPath) => {
    const dir = path.dirname(resolvedPath);
    const targetPath = path.resolve(dir, relativeImportPath);
    return loadModuleInEnv(targetPath, env, loadedModulesCache);
  };

  const sandbox = {
    module: mod,
    exports: mod.exports,
    __requireModule,
    localStorage: env.localStorage,
    window: env.window,
    document: env.document,
    console,
    Date,
    Math,
    JSON,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Promise,
    Error,
    TypeError,
    RangeError,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set
  };

  const ctx = vm.createContext(sandbox);
  vm.runInContext(transformed, ctx, { filename: resolvedPath });

  // If module.exports is the store instance itself (via export default state)
  if (mod.exports && typeof mod.exports.getCurrentUser === 'function') {
    mod.exports.store = mod.exports;
    mod.exports.state = mod.exports;
    if (mod.exports.data && !mod.exports.state.data) {
      mod.exports.state = mod.exports;
    }
  }

  // Update cache in case exports were replaced (e.g., module.exports = ...)
  if (mod.exports.state && !mod.exports.store) {
    mod.exports.store = mod.exports.state;
  }
  if (mod.exports.StateManager && !mod.exports.Store) {
    mod.exports.Store = mod.exports.StateManager;
  }

  const inst = mod.exports.store || mod.exports.state || mod.exports;
  if (inst && typeof inst === 'object') {
    if (inst.data && !inst.state) {
      Object.defineProperty(inst, 'state', {
        get() { return this.data; },
        set(v) { this.data = v; },
        configurable: true
      });
    }
  }

  loadedModulesCache.set(resolvedPath, mod.exports);
  return mod.exports;
}

module.exports = {
  MockLocalStorage,
  createVirtualBrowserEnv,
  transformEsmToSandbox,
  loadModuleInEnv
};
