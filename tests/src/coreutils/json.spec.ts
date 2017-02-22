/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  JSONExt
} from '@phosphor/coreutils';


describe('@phosphor/coreutils', () => {

  describe('JSONExt', () => {

    describe('isPrimitive()', () => {

      it('should return `true` if the value is a primitive', () => {
        expect(JSONExt.isPrimitive(null)).to.equal(true);
        expect(JSONExt.isPrimitive(false)).to.equal(true);
        expect(JSONExt.isPrimitive(true)).to.equal(true);
        expect(JSONExt.isPrimitive(1)).to.equal(true);
        expect(JSONExt.isPrimitive('1')).to.equal(true);
      });

      it('should return `false` if the value is not a primitive', () => {
        expect(JSONExt.isPrimitive([])).to.equal(false);
        expect(JSONExt.isPrimitive({})).to.equal(false);
      });

    });

    describe('isArray()', () => {

      it('should test whether a JSON value is an array', () => {
        expect(JSONExt.isArray([])).to.equal(true);
        expect(JSONExt.isArray(null)).to.equal(false);
        expect(JSONExt.isArray(1)).to.equal(false);
      });

    });

    describe('isObject()', () => {

      it('should test whether a JSON value is an object', () => {
        expect(JSONExt.isObject({ a: 1 })).to.equal(true);
        expect(JSONExt.isObject({})).to.equal(true);
        expect(JSONExt.isObject([])).to.equal(false);
        expect(JSONExt.isObject(1)).to.equal(false);
      });
    });

    describe('deepEqual()', () => {

      it('should compare two JSON values for deep equality', () => {
        expect(JSONExt.deepEqual([], [])).to.equal(true);
        expect(JSONExt.deepEqual([1], [1])).to.equal(true);
        expect(JSONExt.deepEqual({}, {})).to.equal(true);
        expect(JSONExt.deepEqual({a: []}, {a: []})).to.equal(true);
        expect(JSONExt.deepEqual({a: { b: null }}, {a: { b: null }})).to.equal(true);
        expect(JSONExt.deepEqual({a: '1'}, {a: '1'})).to.equal(true);
        expect(JSONExt.deepEqual({a: { b: null }}, {a: { b: '1' }})).to.equal(false);
        expect(JSONExt.deepEqual({a: []}, {a: [1]})).to.equal(false);
        expect(JSONExt.deepEqual([1], [1, 2])).to.equal(false);
        expect(JSONExt.deepEqual(null, [1, 2])).to.equal(false);
        expect(JSONExt.deepEqual([1], {})).to.equal(false);
        expect(JSONExt.deepEqual([1], [2])).to.equal(false);
        expect(JSONExt.deepEqual({}, { a: 1 })).to.equal(false);
        expect(JSONExt.deepEqual({ b: 1 }, { a: 1 })).to.equal(false);
      });

    });

    describe('deepArrayEqual()', () => {

      it('should compare two JSON arrays for deep equality', () => {
        expect(JSONExt.deepEqual([], [])).to.equal(true);
        expect(JSONExt.deepEqual([1], [1])).to.equal(true);
        expect(JSONExt.deepEqual([1], [1, 2])).to.equal(false);
        expect(JSONExt.deepEqual({ a: [1, 2] }, { a: [1, 2] })).to.equal(true);
        expect(JSONExt.deepEqual({ a: [1, 2] }, { a: [1] })).to.equal(false);
      });

    });

    describe('deepObjectEqual()', () => {

      it('should compare two JSON objects for deep equality', () => {
        expect(JSONExt.deepEqual({}, {})).to.equal(true);
        expect(JSONExt.deepEqual({a: []}, {a: []})).to.equal(true);
        expect(JSONExt.deepEqual({a: { b: null }}, {a: { b: null }})).to.equal(true);
        expect(JSONExt.deepEqual({a: '1'}, {a: '1'})).to.equal(true);
        expect(JSONExt.deepEqual({a: { b: null }}, {a: { b: '1' }})).to.equal(false);
      });

    });

  });

});
