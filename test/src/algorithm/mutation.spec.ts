/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  move, reverse, rotate
} from '../../../lib/algorithm/mutation';


describe('algorithm/mutation', () => {

  describe('move()', () => {

    it('should move an element from one index to another', () => {
      let data = [1, 2, 3, 4, 5];
      move(data, 1, 3);
      move(data, 4, 0);
      expect(data).to.eql([5, 1, 3, 4, 2]);
    });

    it('should be a no-op for equal indices', () => {
      let data = [1, 2, 3, 4, 5];
      move(data, 2, 2);
      expect(data).to.eql([1, 2, 3, 4, 5]);
    });

    it('should be a no-op for a sequence length `<= 1`', () => {
      let data = [1];
      let data2: any[] = [];
      move(data, 0, 0);
      move(data2, 0, 0);
      expect(data).to.eql([1]);
      expect(data2).to.eql([]);
    });

  });

  describe('reverse()', () => {

    it('should reverse a sequence in-place', () => {
      let data = [1, 2, 3, 4, 5];
      reverse(data);
      expect(data).to.eql([5, 4, 3, 2, 1]);
    });

    it('should support reversing a section of a sequence', () => {
      let data = [1, 2, 3, 4, 5];
      reverse(data, 2);
      expect(data).to.eql([1, 2, 5, 4, 3]);
      reverse(data, 0, 3);
      expect(data).to.eql([4, 5, 2, 1, 3]);
    });

    it('should be a no-op if `first >= last` index', () => {
      let data = [1, 2, 3, 4, 5];
      reverse(data, 2, 2);
      expect(data).to.eql([1, 2, 3, 4, 5]);
      reverse(data, 4, 2);
      expect(data).to.eql([1, 2, 3, 4, 5]);
    });

    it('should be a no-op for a sequence length `<= 1`', () => {
      let data = [1];
      let data2: any[] = [];
      reverse(data);
      reverse(data2);
      expect(data).to.eql([1]);
      expect(data2).to.eql([]);
    });

  });

  describe('rotate()', () => {

    it('should rotate the elements left by a positive delta', () => {
      let data = [1, 2, 3, 4, 5];
      rotate(data, 2);
      expect(data).to.eql([3, 4, 5, 1, 2]);
      rotate(data, 12);
      expect(data).to.eql([5, 1, 2, 3, 4]);
    });

    it('should rotate the elements right by a negative delta', () => {
      let data = [1, 2, 3, 4, 5];
      rotate(data, -2);
      expect(data).to.eql([4, 5, 1, 2, 3]);
      rotate(data, -12);
      expect(data).to.eql([2, 3, 4, 5, 1]);
    });

    it('should be a no-op for a zero delta', () => {
      let data = [1, 2, 3, 4, 5];
      rotate(data, 0);
      expect(data).to.eql([1, 2, 3, 4, 5]);
    });

    it('should be a no-op for a sequence length `<= 1`', () => {
      let data = [1];
      let data2: any[] = [];
      rotate(data, 1);
      rotate(data2, 1);
      expect(data).to.eql([1]);
      expect(data2).to.eql([]);
    });

  });

});
