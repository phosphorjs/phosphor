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
  reduce
} from '@phosphor/algorithm';


describe('@phosphor/algorithm', () => {

  describe('reduce()', () => {

    it('should reduce items in an iterable into an accumulated value', () => {
      let sum = reduce([1, 2, 3, 4, 5], (a, x) => a + x, 0);
      expect(sum).to.equal(15);
    });

    it('should throw if iterable is empty and initial value is undefined', () => {
      let data: Array<number> = [];
      let reduced = () => reduce(data, (a, x) => a + x);
      expect(reduced).to.throw(TypeError);
    });

    it('should return the initial value if the iterable is empty', () => {
      let data: Array<number> = [];
      let result = reduce(data, (a, x) => a + x, 0);
      expect(result).to.equal(0);
    });

    it('should return the first item if the iterable has just one item with no initial value', () => {
      let data = [9];
      let result = reduce(data, (a, x) => a + x);
      expect(result).to.equal(9);
    });

    it('should invoke the reducer if the iterable has just one item with an initial value', () => {
      let data = [9];
      let result = reduce(data, (a, x) => a + x, 1);
      expect(result).to.equal(10);
    });

    it('should invoke the reducer if the iterable has just two items with no initial value', () => {
      let data = [1, 2];
      let result = reduce(data, (a, x) => a + x);
      expect(result).to.equal(3);
    });

  });

});
