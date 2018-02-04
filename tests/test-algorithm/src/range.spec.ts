/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  RangeIterator, range
} from '@phosphor/algorithm';

import {
  testIterator
} from './iter.spec';


describe('@phosphor/algorithm', () => {

  describe('range()', () => {

    describe('single argument form', () => {

      testIterator(() => {
        return [range(3), [0, 1, 2]];
      });

    });

    describe('two argument form', () => {

      testIterator(() => {
        return [range(4, 7), [4, 5, 6]];
      });

    });

    describe('three argument form', () => {

      testIterator(() => {
        return [range(4, 11, 3), [4, 7, 10]];
      });

    });

    describe('negative step', () => {

      testIterator(() => {
        return [range(3, 0, -1), [3, 2, 1]];
      });

    });

    describe('zero effective length', () => {

      testIterator(() => {
        return [range(0, 10, -1), []];
      });

    });

  });

  describe('RangeIterator', () => {

    testIterator(() => {
      return [new RangeIterator(0, 11, 2), [0, 2, 4, 6, 8, 10]];
    });

  });

});
