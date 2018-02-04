/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  EmptyIterator, empty
} from '@phosphor/algorithm';

import {
  testIterator
} from './iter.spec';


describe('@phosphor/algorithm', () => {

  describe('empty()', () => {

    testIterator(() => {
      return [empty(), []];
    });

  });

  describe('EmptyIterator', () => {

    testIterator(() => {
      return [new EmptyIterator(), []];
    });

  });

});
