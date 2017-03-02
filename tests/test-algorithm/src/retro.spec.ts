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
  RetroArrayIterator, iter, retro, toArray
} from '@phosphor/algorithm';

import {
  testIterator
} from './iter.spec';


describe('@phosphor/algorithm', () => {

  describe('retro()', () => {

    it('should create an iterator for an array-like object', () => {
      expect(toArray(retro([0, 1, 2, 3]))).to.deep.equal([3, 2, 1, 0]);
    });

    it('should call `retro` on a retroable', () => {
      let iterator = iter([1, 2, 3, 4]);
      let retroable = { retro: () => iterator };
      expect(retro(retroable)).to.equal(iterator);
    });

  });

  describe('RetroArrayIterator', () => {

    testIterator(() => {
      return [new RetroArrayIterator([1, 2, 3]), [3, 2, 1]];
    });

  });

});
