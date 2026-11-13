/**
 * tests/e2e/helpers/assert.js
 * Lightweight, zero-dependency assertion library for the E2E test suite.
 */

class AssertionError extends Error {
  constructor(message, actual, expected, operator) {
    super(message || 'Assertion failed');
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
    this.operator = operator;
  }
}

function ok(value, message) {
  if (!value) {
    throw new AssertionError(
      message || `Expected truthy value, got ${JSON.stringify(value)}`,
      value,
      true,
      'ok'
    );
  }
}

function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      actual,
      expected,
      'strictEqual'
    );
  }
}

function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    throw new AssertionError(
      message || `Expected values to be strictly non-equal: ${JSON.stringify(actual)}`,
      actual,
      expected,
      'notStrictEqual'
    );
  }
}

function deepStrictEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual, Object.keys(actual || {}).sort());
  const expectedStr = JSON.stringify(expected, Object.keys(expected || {}).sort());
  if (actualStr !== expectedStr) {
    throw new AssertionError(
      message || `Deep strict equality failed.\nExpected: ${expectedStr}\nActual:   ${actualStr}`,
      actual,
      expected,
      'deepStrictEqual'
    );
  }
}

function match(string, regex, message) {
  if (typeof string !== 'string' || !regex.test(string)) {
    throw new AssertionError(
      message || `String did not match regular expression ${regex}:\n"${string ? string.slice(0, 100) : string}..."`,
      string,
      regex.toString(),
      'match'
    );
  }
}

function includes(container, item, message) {
  if (!container) {
    throw new AssertionError(
      message || `Container is nil or undefined`,
      container,
      item,
      'includes'
    );
  }
  if (typeof container === 'string') {
    if (!container.includes(item)) {
      throw new AssertionError(
        message || `Expected string to contain "${item}".\nSnippet: "${container.slice(0, 120)}..."`,
        container,
        item,
        'includes'
      );
    }
  } else if (Array.isArray(container)) {
    if (!container.includes(item)) {
      throw new AssertionError(
        message || `Expected array to contain ${JSON.stringify(item)}`,
        container,
        item,
        'includes'
      );
    }
  } else {
    throw new AssertionError(
      message || `Unsupported container type for includes: ${typeof container}`,
      container,
      item,
      'includes'
    );
  }
}

function throws(fn, expectedRegexOrType, message) {
  let threw = false;
  let thrownError = null;
  try {
    fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }
  if (!threw) {
    throw new AssertionError(
      message || `Expected function to throw an error, but it returned cleanly.`,
      null,
      expectedRegexOrType,
      'throws'
    );
  }
  if (expectedRegexOrType) {
    if (expectedRegexOrType instanceof RegExp) {
      if (!expectedRegexOrType.test(thrownError.message)) {
        throw new AssertionError(
          message || `Thrown error message "${thrownError.message}" did not match ${expectedRegexOrType}`,
          thrownError.message,
          expectedRegexOrType.toString(),
          'throws'
        );
      }
    } else if (typeof expectedRegexOrType === 'function') {
      if (!(thrownError instanceof expectedRegexOrType)) {
        throw new AssertionError(
          message || `Thrown error was not an instance of ${expectedRegexOrType.name}`,
          thrownError,
          expectedRegexOrType.name,
          'throws'
        );
      }
    }
  }
}

async function rejects(asyncFn, expectedRegexOrType, message) {
  let threw = false;
  let thrownError = null;
  try {
    await asyncFn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }
  if (!threw) {
    throw new AssertionError(
      message || `Expected async function to reject, but it resolved successfully.`,
      null,
      expectedRegexOrType,
      'rejects'
    );
  }
  if (expectedRegexOrType && expectedRegexOrType instanceof RegExp) {
    if (!expectedRegexOrType.test(thrownError.message)) {
      throw new AssertionError(
        message || `Rejected error message "${thrownError.message}" did not match ${expectedRegexOrType}`,
        thrownError.message,
        expectedRegexOrType.toString(),
        'rejects'
      );
    }
  }
}

function doesNotThrow(fn, message) {
  try {
    fn();
  } catch (err) {
    throw new AssertionError(
      message || `Expected function not to throw, but it threw: ${err.message}`,
      err,
      null,
      'doesNotThrow'
    );
  }
}

function fail(message) {
  throw new AssertionError(message || 'Explicit test failure triggered', null, null, 'fail');
}

module.exports = {
  AssertionError,
  ok,
  strictEqual,
  notStrictEqual,
  deepStrictEqual,
  match,
  includes,
  throws,
  rejects,
  doesNotThrow,
  fail
};
