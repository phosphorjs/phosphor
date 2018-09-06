/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  FilterIterator, filter, iter
} from '@phosphor/algorithm';

import {
  testIterator
} from './iter.spec';


describe('@phosphor/algorithm', () => {

  describe('filter()', () => {

    testIterator(() => {
      let expected = [0, 2, 4];
      let data = [0, 1, 2, 3, 4, 5];
      let it = filter(data, n => n % 2 === 0);
      return [it, expected];
    });

  });

  describe('FilterIterator', () => {

    testIterator(() => {
      let expected = [1, 3, 5];
      let data = [0, 1, 2, 3, 4, 5];
      let it = new FilterIterator(iter(data), n => n % 2 !== 0);
      return [it, expected];
    });

  });

});
