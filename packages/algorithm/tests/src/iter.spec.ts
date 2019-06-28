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
  ArrayIterator, IIterator, each, every, iter, some, toArray
} from '@phosphor/algorithm';


/**
 * A factory which returns an iterator and expected results.
 */
export
type IteratorFactory<T> = () => [IIterator<T>, T[]];


/**
 * A helper function to test the methods of an iterator.
 *
 * @param factory - A function which produces an iterator and the
 *   expected results of that iterator.
 */
export
function testIterator<T>(factory: IteratorFactory<T>): void {
  describe('iter()', () => {

    it('should return `this` iterator', () => {
      let [it] = factory();
      expect(it.iter()).to.equal(it);
    });

  });

  describe('clone()', () => {

    it('should return a new independent iterator', () => {
      let [it, results] = factory();
      let it2 = it.clone();
      expect(it).to.not.equal(it2);
      expect(toArray(it)).to.deep.equal(results);
      expect(toArray(it2)).to.deep.equal(results);
    });

  });

  describe('next()', () => {

    it('should return the next value in the iterator', () => {
      let value: T | undefined;
      let [it, results] = factory();
      for (let i = 0; (value = it.next()) !== undefined; ++i) {
        expect(value).to.deep.equal(results[i]);
      }
    });

  });
}


describe('@phosphor/algorithm', () => {

  describe('iter()', () => {

    it('should create an iterator for an array-like object', () => {
      let data = [0, 1, 2, 3];
      expect(toArray(iter(data))).to.deep.equal(data);
    });

    it('should call `iter` on an iterable', () => {
      let iterator = iter([1, 2, 3, 4]);
      expect(iter(iterator)).to.equal(iterator);
    });

  });

  describe('each()', () => {

    it('should visit every item in an iterable', () => {
      let result = 0;
      let data = [1, 2, 3, 4, 5];
      each(data, x => { result += x; });
      expect(result).to.equal(15);
    });

    it('should break early if the callback returns `false`', () => {
      let result = 0;
      let data = [1, 2, 3, 4, 5];
      each(data, x => {
        if (x > 3) {
          return false;
        }
        result += x;
        return true;
      });
      expect(result).to.equal(6);
    });

  });

  describe('every()', () => {

    it('should verify all items in an iterable satisfy a condition', () => {
      let data = [1, 2, 3, 4, 5];
      let valid = every(data, x => x > 0);
      let invalid = every(data, x => x > 4);
      expect(valid).to.equal(true);
      expect(invalid).to.equal(false);
    });

  });

  describe('some()', () => {

    it('should verify some items in an iterable satisfy a condition', () => {
      let data = [1, 2, 3, 4, 5];
      let valid = some(data, x => x > 4);
      let invalid = some(data, x => x < 0);
      expect(valid).to.equal(true);
      expect(invalid).to.equal(false);
    });

  });

  describe('toArray()', () => {

    it('should create an array from an iterable', () => {
      let data = [0, 1, 2, 3, 4, 5];
      let result = toArray(data);
      expect(result).to.deep.equal(data);
      expect(result).to.not.equal(data);
    });

  });

  describe('ArrayIterator', () => {

    testIterator(() => {
      let results = [1, 2, 3, 4, 5];
      let it = new ArrayIterator(results);
      return [it, results];
    });

  });

});
