/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  MapIterator, iter, map
} from '@phosphor/algorithm';

import {
  testIterator
} from './iter.spec';


describe('@phosphor/algorithm', () => {

  describe('map()', () => {

    testIterator(() => {
      let result = [0, 1, 4, 9, 16, 25];
      let it = map([0, 1, 2, 3, 4, 5], x => x ** 2);
      return [it, result];
    });

  });

  describe('MapIterator', () => {

    testIterator(() => {
      let result = [0, 1, 8, 27];
      let it = new MapIterator(iter([0, 1, 2, 3]), x => x ** 3);
      return [it, result];
    });

  });

});
