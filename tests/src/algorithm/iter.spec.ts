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
  IIterator, toArray
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
      expect(toArray(it)).to.eql(results);
      expect(toArray(it2)).to.eql(results);
    });

  });

  describe('next()', () => {

    it('should return the next value in the iterator', () => {
      let value: T | undefined;
      let [it, results] = factory();
      for (let i = 0; (value = it.next()) !== undefined; ++i) {
        expect(value).to.eql(results[i]);
      }
    });

  });

}
