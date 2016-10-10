/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  deepEqual, isArray, isObject, isPrimitive
} from '../../../lib/algorithm/json';


describe('algorithm/json', () => {

  describe('isPrimitive()', () => {

    it('should return `true` if the value is a primitive or `null`', () => {
      expect(isPrimitive(null)).to.be(true);
      expect(isPrimitive(false)).to.be(true);
      expect(isPrimitive(1)).to.be(true);
      expect(isPrimitive('1')).to.be(true);
    });

    it('should return `false` if the value is not a primitive or `null`', () => {
      expect(isPrimitive(void 0 as any)).to.be(false);
      expect(isPrimitive([])).to.be(false);
      expect(isPrimitive({})).to.be(false);
    });

  });

  describe('isArray()', () => {

    it('should test whether a JSON value is an array', () => {
      expect(isArray([])).to.be(true);
      expect(isArray(null)).to.be(false);
      expect(isArray(1)).to.be(false);
    });

  });

  describe('isObject()', () => {

    it('should test whether a JSON value is an object', () => {
      expect(isObject({ a: 1 })).to.be(true);
      expect(isObject({})).to.be(true);
      expect(isObject([])).to.be(false);
      expect(isObject(1)).to.be(false);
    });
  });

  describe('deepEqual()', () => {

    it('should compare two JSON values for deep equality', () => {
      expect(deepEqual([], [])).to.be(true);
      expect(deepEqual([1], [1])).to.be(true);
      expect(deepEqual({}, {})).to.be(true);
      expect(deepEqual({a: []}, {a: []})).to.be(true);
      expect(deepEqual({a: { b: null }}, {a: { b: null }})).to.be(true);
      expect(deepEqual({a: '1'}, {a: '1'})).to.be(true);

      expect(deepEqual({a: { b: null }}, {a: { b: '1' }})).to.be(false);
      expect(deepEqual({a: []}, {a: [1]})).to.be(false);
      expect(deepEqual([1], [1, 2])).to.be(false);
      expect(deepEqual(null, [1, 2])).to.be(false);
      expect(deepEqual(void 0 as any, [])).to.be(false);
      expect(deepEqual([1], {})).to.be(false);
      expect(deepEqual([1], [2])).to.be(false);
      expect(deepEqual({}, { a: 1 })).to.be(false);
      expect(deepEqual({ b: 1 }, { a: 1 })).to.be(false);
    });

  });

});
