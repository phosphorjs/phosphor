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
  ArrayExt
} from '@phosphor/algorithm';


describe('@phosphor/algorithm', () => {

  describe('ArrayExt', () => {

    describe('firstIndexOf()', () => {

      it('should find the index of the first matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one');
        expect(i).to.equal(0);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'red');
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.firstIndexOf(data, 'one');
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', 2);
        expect(i).to.equal(4);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', -2);
        expect(i).to.equal(4);
      });

      it('should support searching within a range', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', 1, 3);
        expect(i).to.equal(2);
      });

      it('should support a negative stop index', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', 1, -4);
        expect(i).to.equal(-1);
      });

      it('should wrap around if stop < start', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'two', 3, 2);
        expect(i).to.equal(1);
      });

    });

    describe('lastIndexOf()', () => {

      it('should find the index of the last matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one');
        expect(i).to.equal(4);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'red');
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.lastIndexOf(data, 'one');
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', 2);
        expect(i).to.equal(0);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', -2);
        expect(i).to.equal(2);
      });

      it('should support searching within a range', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', 3, 1);
        expect(i).to.equal(2);
      });

      it('should support a negative stop index', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', 1, -4);
        expect(i).to.equal(-1);
      });

      it('should wrap around if start < stop', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'four', 2, 3);
        expect(i).to.equal(3);
      });

    });

    describe('findFirstIndex()', () => {

      it('should find the index of the first matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0);
        expect(i).to.equal(1);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 7 === 0);
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0);
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2);
        expect(i).to.equal(3);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, -3);
        expect(i).to.equal(3);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2, 4);
        expect(i).to.equal(3);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2, -2);
        expect(i).to.equal(3);
      });

      it('should wrap around if stop < start', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 4, 2);
        expect(i).to.equal(1);
      });

    });

    describe('findLastIndex()', () => {

      it('should find the index of the last matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0);
        expect(i).to.equal(3);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 7 === 0);
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0);
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 2);
        expect(i).to.equal(1);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, -3);
        expect(i).to.equal(1);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 4, 2);
        expect(i).to.equal(3);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, -3, 0);
        expect(i).to.equal(1);
      });

      it('should wrap around if start < stop', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 0, 2);
        expect(i).to.equal(3);
      });

    });

    describe('findFirstValue()', () => {

      it('should find the index of the first matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'blue'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'b');
        expect(i).to.equal('bottle');
      });

      it('should return `undefined` if there is no matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'z');
        expect(i).to.equal(undefined);
      });

      it('should return `undefined` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'b');
        expect(i).to.equal(undefined);
      });

      it('should support searching from a start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'e', 2);
        expect(i).to.equal('egg');
      });

      it('should support a negative start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'e', -3);
        expect(i).to.equal('egg');
      });

      it('should support searching within a range', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'd', 2, 4);
        expect(i).to.equal('dog');
      });

      it('should support a negative stop index', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'd', 2, -2);
        expect(i).to.equal('dog');
      });

      it('should wrap around if stop < start', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'b', 4, 2);
        expect(i).to.equal('bottle');
      });

    });

    describe('findLastValue()', () => {

      it('should find the index of the last matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'blue'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'b');
        expect(i).to.equal('blue');
      });

      it('should return `undefined` if there is no matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'z');
        expect(i).to.equal(undefined);
      });

      it('should return `undefined` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'b');
        expect(i).to.equal(undefined);
      });

      it('should support searching from a start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'e', 2);
        expect(i).to.equal('eagle');
      });

      it('should support a negative start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'e', -3);
        expect(i).to.equal('eagle');
      });

      it('should support searching within a range', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'd', 4, 2);
        expect(i).to.equal('dog');
      });

      it('should support a negative stop index', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'd', 4, -4);
        expect(i).to.equal('dog');
      });

      it('should wrap around if start < stop', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'e', 2, 4);
        expect(i).to.equal('egg');
      });

    });

    describe('lowerBound()', () => {

      it('should return the index of the first element `>=` a value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.lowerBound(data, -5, cmp);
        let r2 = ArrayExt.lowerBound(data, 0, cmp);
        let r3 = ArrayExt.lowerBound(data, 3, cmp);
        let r4 = ArrayExt.lowerBound(data, 5, cmp);
        expect(r1).to.equal(0);
        expect(r2).to.equal(0);
        expect(r3).to.equal(3);
        expect(r4).to.equal(6);
      });

      it('should return `length` if there is no matching value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.lowerBound(data, 9, cmp);
        let r2 = ArrayExt.lowerBound(data, 19, cmp);
        let r3 = ArrayExt.lowerBound(data, 29, cmp);
        expect(r1).to.equal(8);
        expect(r2).to.equal(8);
        expect(r3).to.equal(8);
      });

      it('should return `0` if the array is empty', () => {
        let data: number[] = [];
        let cmp = (a: number, b: number) => a - b;
        let i = ArrayExt.lowerBound(data, 0, cmp);
        expect(i).to.equal(0);
      });

      it('should support searching a range', () => {
        let data = [4, 5, 6, 4, 5, 6];
        let cmp = (a: number, b: number) => a - b;
        let r = ArrayExt.lowerBound(data, 5, cmp, 3, 5);
        expect(r).to.equal(4);
      });

    });

    describe('upperBound()', () => {

      it('should return the index of the first element `>` a value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.upperBound(data, -5, cmp);
        let r2 = ArrayExt.upperBound(data, 0, cmp);
        let r3 = ArrayExt.upperBound(data, 2, cmp);
        let r4 = ArrayExt.upperBound(data, 3, cmp);
        expect(r1).to.equal(0);
        expect(r2).to.equal(0);
        expect(r3).to.equal(3);
        expect(r4).to.equal(5);
      });

      it('should return `length` if there is no matching value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.upperBound(data, 9, cmp);
        let r2 = ArrayExt.upperBound(data, 19, cmp);
        let r3 = ArrayExt.upperBound(data, 29, cmp);
        expect(r1).to.equal(8);
        expect(r2).to.equal(8);
        expect(r3).to.equal(8);
      });

      it('should return `0` if the array is empty', () => {
        let data: number[] = [];
        let cmp = (a: number, b: number) => a - b;
        let i = ArrayExt.upperBound(data, 0, cmp);
        expect(i).to.equal(0);
      });

      it('should support searching a range', () => {
        let data = [4, 5, 6, 4, 5, 6];
        let cmp = (a: number, b: number) => a - b;
        let r = ArrayExt.upperBound(data, 5, cmp, 3, 5);
        expect(r).to.equal(5);
      });

    });

    describe('move()', () => {

      it('should move an element from one index to another', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.move(data, 1, 3);
        ArrayExt.move(data, 4, 0);
        expect(data).to.deep.equal([5, 1, 3, 4, 2]);
      });

      it('should be a no-op for equal indices', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.move(data, 2, 2);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should be a no-op for an array length `<= 1`', () => {
        let data1 = [1];
        let data2: any[] = [];
        ArrayExt.move(data1, 0, 0);
        ArrayExt.move(data2, 0, 0);
        expect(data1).to.deep.equal([1]);
        expect(data2).to.deep.equal([]);
      });

    });

    describe('reverse()', () => {

      it('should reverse an array in-place', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.reverse(data);
        expect(data).to.deep.equal([5, 4, 3, 2, 1]);
      });

      it('should support reversing a section of an array', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.reverse(data, 2);
        expect(data).to.deep.equal([1, 2, 5, 4, 3]);
        ArrayExt.reverse(data, 0, 3);
        expect(data).to.deep.equal([4, 5, 2, 1, 3]);
      });

      it('should be a no-op if `start >= stop`', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.reverse(data, 2, 2);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
        ArrayExt.reverse(data, 4, 2);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should be a no-op for an array length `<= 1`', () => {
        let data1 = [1];
        let data2: any[] = [];
        ArrayExt.reverse(data1);
        ArrayExt.reverse(data2);
        expect(data1).to.deep.equal([1]);
        expect(data2).to.deep.equal([]);
      });

    });

    describe('rotate()', () => {

      it('should rotate the elements left by a positive delta', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 2);
        expect(data).to.deep.equal([3, 4, 5, 1, 2]);
        ArrayExt.rotate(data, 12);
        expect(data).to.deep.equal([5, 1, 2, 3, 4]);
      });

      it('should rotate the elements right by a negative delta', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, -2);
        expect(data).to.deep.equal([4, 5, 1, 2, 3]);
        ArrayExt.rotate(data, -12);
        expect(data).to.deep.equal([2, 3, 4, 5, 1]);
      });

      it('should be a no-op for a zero delta', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 0);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should be a no-op for a array length `<= 1`', () => {
        let data1 = [1];
        let data2: any[] = [];
        ArrayExt.rotate(data1, 1);
        ArrayExt.rotate(data2, 1);
        expect(data1).to.deep.equal([1]);
        expect(data2).to.deep.equal([]);
      });

      it('should rotate a section of the array', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 2, 1, 3);
        expect(data).to.deep.equal([1, 4, 2, 3, 5]);
        ArrayExt.rotate(data, -2, 0, 3);
        expect(data).to.deep.equal([2, 3, 1, 4, 5]);
      });

      it('should be a no-op if `start >= stop`', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 2, 5, 4);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

    });

    describe('fill()', () => {

      it('should fill an array with a static value', () => {
        let data = [0, 0, 0, 0, 0];
        ArrayExt.fill(data, 1);
        expect(data).to.deep.equal([1, 1, 1, 1, 1]);
      });

      it('should fill a section of the array', () => {
        let data = [0, 0, 0, 0, 0];
        ArrayExt.fill(data, 1, 1, 3);
        expect(data).to.deep.equal([0, 1, 1, 1, 0]);
      });

      it('should wrap around if `stop < start`', () => {
        let data = [0, 0, 0, 0, 0];
        ArrayExt.fill(data, 1, 3, 1);
        expect(data).to.deep.equal([1, 1, 0, 1, 1]);
      });

    });

    describe('insert()', () => {

      it('should insert a value at the specified index', () => {
        let data: number[] = [];
        ArrayExt.insert(data, 0, 9);
        expect(data).to.deep.equal([9]);
        ArrayExt.insert(data, 0, 8);
        expect(data).to.deep.equal([8, 9]);
        ArrayExt.insert(data, 0, 7);
        expect(data).to.deep.equal([7, 8, 9]);
        ArrayExt.insert(data, -2, 6);
        expect(data).to.deep.equal([7, 6, 8, 9]);
        ArrayExt.insert(data, 2, 5);
        expect(data).to.deep.equal([7, 6, 5, 8, 9]);
        ArrayExt.insert(data, -5, 4);
        expect(data).to.deep.equal([4, 7, 6, 5, 8, 9]);
      });

      it('should clamp the index to the bounds of the vector', () => {
        let data: number[] = [];
        ArrayExt.insert(data, -10, 9);
        expect(data).to.deep.equal([9]);
        ArrayExt.insert(data, -5, 8);
        expect(data).to.deep.equal([8, 9]);
        ArrayExt.insert(data, -1, 7);
        expect(data).to.deep.equal([8, 7, 9]);
        ArrayExt.insert(data, 13, 6);
        expect(data).to.deep.equal([8, 7, 9, 6]);
        ArrayExt.insert(data, 8, 4);
        expect(data).to.deep.equal([8, 7, 9, 6, 4]);
      });

    });

    describe('removeAt()', () => {

      it('should remove the value at a specified index', () => {
        let data = [7, 4, 8, 5, 9, 6];
        expect(ArrayExt.removeAt(data, 1)).to.equal(4);
        expect(data).to.deep.equal([7, 8, 5, 9, 6]);
        expect(ArrayExt.removeAt(data, 2)).to.equal(5);
        expect(data).to.deep.equal([7, 8, 9, 6]);
        expect(ArrayExt.removeAt(data, -2)).to.equal(9);
        expect(data).to.deep.equal([7, 8, 6]);
        expect(ArrayExt.removeAt(data, 0)).to.equal(7);
        expect(data).to.deep.equal([8, 6]);
        expect(ArrayExt.removeAt(data, -1)).to.equal(6);
        expect(data).to.deep.equal([8]);
        expect(ArrayExt.removeAt(data, 0)).to.equal(8);
        expect(data).to.deep.equal([]);
      });

      it('should return `undefined` if the index is out of range', () => {
        let data = [7, 4, 8, 5, 9, 6];
        expect(ArrayExt.removeAt(data, 10)).to.equal(undefined);
        expect(data).to.deep.equal([7, 4, 8, 5, 9, 6]);
        expect(ArrayExt.removeAt(data, -12)).to.equal(undefined);
        expect(data).to.deep.equal([7, 4, 8, 5, 9, 6]);
      });

    });

    describe('removeFirstOf()', () => {

      it('should remove the first occurrence of a value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'one');
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['two', 'three', 'four', 'one']);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four', 'one']);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.removeFirstOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'one', 2);
        expect(i).to.equal(4);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'one', -2);
        expect(i).to.equal(4);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support searching within a range', () => {
        let data = ['three', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'three', 1, 3);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'one']);
      });

      it('should support a negative stop index', () => {
        let data = ['three', 'two', 'three', 'four', 'three'];
        let i = ArrayExt.removeFirstOf(data, 'three', 1, -2);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'three']);
      });

      it('should wrap around if stop < start', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'two', 3, 1);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'three', 'four', 'one']);
      });

    });

    describe('removeLastOf()', () => {

      it('should remove the last occurrence of a value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'one');
        expect(i).to.equal(4);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four', 'one']);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.removeLastOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'one', 2);
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['two', 'three', 'four', 'one']);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'one', -2);
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['two', 'three', 'four', 'one']);
      });

      it('should support searching within a range', () => {
        let data = ['three', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'three', 3, 1);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'one']);
      });

      it('should support a negative stop index', () => {
        let data = ['three', 'two', 'three', 'four', 'three'];
        let i = ArrayExt.removeLastOf(data, 'three', 3, -4);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'three']);
      });

      it('should wrap around if start < stop', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'two', 3, 1);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'three', 'four', 'one']);
      });

    });

    describe('removeAllOf()', () => {

      it('should remove all occurrences of a value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one');
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['two', 'three', 'four']);
      });

      it('should return `0` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'five');
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four', 'one']);
      });

      it('should return `0` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.removeAllOf(data, 'five');
        expect(i).to.equal(0);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one', 2);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one', -2);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support searching within a range', () => {
        let data = ['three', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'three', 1, 3);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['three', 'two', 'four', 'one']);
      });

      it('should support a negative stop index', () => {
        let data = ['three', 'two', 'three', 'four', 'three'];
        let i = ArrayExt.removeAllOf(data, 'three', 1, -2);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['three', 'two', 'four', 'three']);
      });

      it('should wrap around if start < stop', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one', 3, 1);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['two', 'three', 'four']);
      });

    });

    describe('removeFirstWhere()', () => {

      it('should remove the first occurrence of a value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let result = ArrayExt.removeFirstWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, -3);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2, 4);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2, -2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should wrap around if stop < start', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 4, 2);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });

    });

    describe('removeLastWhere()', () => {

      it('should remove the last occurrence of a value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let result = ArrayExt.removeLastWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 2);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, -3);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 4, 2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 4, -4);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should wrap around if start < stop', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 0, 2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

    });

    describe('removeAllWhere()', () => {

      it('should remove all occurrences of a value', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0);
        expect(count).to.equal(2);
        expect(data).to.deep.equal([1, 2, 4, 5, 1]);
      });

      it('should return `0` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 7 === 0);
        expect(count).to.equal(0);
        expect(data).to.deep.equal([1, 2, 3, 4, 3, 5, 1]);
      });

      it('should return `0` if the array is empty', () => {
        let data: number[] = [];
        let count = ArrayExt.removeAllWhere(data, v => v % 7 === 0);
        expect(count).to.equal(0);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, -4);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3, 5);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3, -2);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should wrap around if start < stop', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 5, 3);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 4, 3, 5, 1]);
      });

    });

  });

});
