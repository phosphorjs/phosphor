/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ChainIterator, iter, chain
} from '@phosphor/algorithm';

import {
  testIterator
} from './iter.spec';


describe('@phosphor/algorithm', () => {

  describe('chain()', () => {

    testIterator(() => {
      let it = chain([1, 2, 3], [4], [5, 6]);
      let expected = [1, 2, 3, 4, 5, 6];
      return [it, expected];
    });

  });

  describe('ChainIterator', () => {

    testIterator(() => {
      let a = iter([1, 2, 3]);
      let b = iter(['four', 'five']);
      let c = iter([true, false]);
      type T = number | string | boolean;
      let it = new ChainIterator<T>(iter([a, b, c]));
      let expected = [1, 2, 3, 'four', 'five', true, false];
      return [it, expected];
    });

  });

});
