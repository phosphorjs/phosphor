/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  StringSearch, find, findIndex, findLastIndex, indexOf, lastIndexOf,
  lowerBound, min, max, upperBound
} from '../../../lib/algorithm/searching';


describe('algorithm/searching', () => {

  describe('find()', () => {

    it('should find the first matching value', () => {
      interface IAnimal { species: string, name: string };
      let isCat = (value: IAnimal) => value.species === 'cat';
      let data: IAnimal[] = [
        { species: 'dog', name: 'spot' },
        { species: 'cat', name: 'fluffy' },
        { species: 'alligator', name: 'pocho' },
      ];
      let value = find(data, isCat);
      expect(value).to.be(data[1]);
    });

    it('should return `undefined` if there is no matching value', () => {
      interface IAnimal { species: string, name: string };
      let isRacoon = (value: IAnimal) => value.species === 'racoon';
      let data: IAnimal[] = [
        { species: 'dog', name: 'spot' },
        { species: 'cat', name: 'fluffy' },
        { species: 'alligator', name: 'pocho' },
      ];
      let value = find(data, isRacoon);
      expect(value).to.be(void 0);
    });

  });

  describe('min()', () => {

    it('should return the minimum value in an iterable', () => {
      interface IScore { value: number };
      let data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 }
      ];
      let score = min(data, (a, b) => a.value - b.value);
      expect(score).to.be(data[1]);
    });

    it('should not invoke the comparator for only one value', () => {
      interface IScore { value: number };
      let data: IScore[] = [
        { value: 19 },
      ];
      let called = false;
      let score = min(data, (a, b) => {
        called = true;
        return a.value - b.value;
      });
      expect(score).to.be(data[0]);
      expect(called).to.be(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore { value: number };
      let data: IScore[] = [];
      let score = min(data, (a, b) => a.value - b.value);
      expect(score).to.be(void 0);
    });

  });

  describe('max()', () => {

    it('should return the maximum value in an iterable', () => {
      interface IScore { value: number };
      let data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 }
      ];
      let score = max(data, (a, b) => a.value - b.value);
      expect(score).to.be(data[3]);
    });

    it('should not invoke the comparator for only one value', () => {
      interface IScore { value: number };
      let data: IScore[] = [
        { value: 19 },
      ];
      let called = false;
      let score = max(data, (a, b) => {
        called = true;
        return a.value - b.value;
      });
      expect(score).to.be(data[0]);
      expect(called).to.be(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore { value: number };
      let data: IScore[] = [];
      let score = max(data, (a, b) => a.value - b.value);
      expect(score).to.be(void 0);
    });

  });

  describe('indexOf()', () => {

    it('should find the index of the first matching value', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = indexOf(data, 'one');
      expect(i).to.be(0);
    });

    it('should support searching from a start index', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = indexOf(data, 'one', 2);
      expect(i).to.be(4);
    });

    it('should return `-1` if there is no matching value', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = indexOf(data, 'red');
      expect(i).to.be(-1);
    });

    it('should return `-1` if `fromIndex` is out of range', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = indexOf(data, 'one', 10);
      expect(i).to.be(-1);
    });

    it('should return `-1` if the sequence is empty', () => {
      let data: string[] = [];
      let i = indexOf(data, 'one');
      expect(i).to.be(-1);
    });

  });

  describe('lastIndexOf()', () => {

    it('should find the index of the last matching value', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = lastIndexOf(data, 'one');
      expect(i).to.be(4);
    });

    it('should support searching from a start index', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = lastIndexOf(data, 'one', 2);
      expect(i).to.be(0);
    });

    it('should return `-1` if there is no matching value', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = lastIndexOf(data, 'red');
      expect(i).to.be(-1);
    });

    it('should return `-1` if `fromIndex` is out of range', () => {
      let data = ['one', 'two', 'three', 'four', 'one'];
      let i = lastIndexOf(data, 'one', -1);
      expect(i).to.be(-1);
    });

    it('should return `-1` if the sequence is empty', () => {
      let data: string[] = [];
      let i = lastIndexOf(data, 'one');
      expect(i).to.be(-1);
    });

  });

  describe('findIndex()', () => {

    it('should find the index of the first matching value', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findIndex(data, v => v % 2 === 0);
      expect(i).to.be(1);
    });

    it('should support searching from a start index', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findIndex(data, v => v % 2 === 0, 2);
      expect(i).to.be(3);
    });

    it('should return `-1` if there is no matching value', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findIndex(data, v => v % 7 === 0);
      expect(i).to.be(-1);
    });

    it('should return `-1` if `fromIndex` is out of range', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findIndex(data, v => v % 2 === 0, 10);
      expect(i).to.be(-1);
    });

    it('should return `-1` if the sequence is empty', () => {
      let data: number[] = [];
      let i = findIndex(data, v => v % 2 === 0);
      expect(i).to.be(-1);
    });

  });

  describe('findLastIndex()', () => {

    it('should find the index of the last matching value', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findLastIndex(data, v => v % 2 === 0);
      expect(i).to.be(3);
    });

    it('should support searching from a start index', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findLastIndex(data, v => v % 2 === 0, 2);
      expect(i).to.be(1);
    });

    it('should return `-1` if there is no matching value', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findLastIndex(data, v => v % 7 === 0);
      expect(i).to.be(-1);
    });

    it('should return `-1` if `fromIndex` is out of range', () => {
      let data = [1, 2, 3, 4, 5];
      let i = findLastIndex(data, v => v % 2 === 0, -1);
      expect(i).to.be(-1);
    });

    it('should return `-1` if the sequence is empty', () => {
      let data: number[] = [];
      let i = findLastIndex(data, v => v % 2 === 0);
      expect(i).to.be(-1);
    });

  });

  describe('lowerBound()', () => {

    it('should return the index of the first element `>=` a value', () => {
      let data = [1, 2, 2, 3, 3, 4, 5, 5];
      let cmp = (a: number, b: number) => a - b;
      let r1 = lowerBound(data, -5, cmp);
      let r2 = lowerBound(data, 0, cmp);
      let r3 = lowerBound(data, 3, cmp);
      let r4 = lowerBound(data, 5, cmp);
      expect(r1).to.be(0);
      expect(r2).to.be(0);
      expect(r3).to.be(3);
      expect(r4).to.be(6);
    });

    it('should return `length` if there is no matching value', () => {
      let data = [1, 2, 2, 3, 3, 4, 5, 5];
      let cmp = (a: number, b: number) => a - b;
      let r1 = lowerBound(data, 9, cmp);
      let r2 = lowerBound(data, 19, cmp);
      let r3 = lowerBound(data, 29, cmp);
      expect(r1).to.be(8);
      expect(r2).to.be(8);
      expect(r3).to.be(8);
    });

    it('should return `0` if the sequence is empty', () => {
      let data: number[] = [];
      let cmp = (a: number, b: number) => a - b;
      let i = lowerBound(data, 0, cmp);
      expect(i).to.be(0);
    });

  });

  describe('upperBound()', () => {

    it('should return the index of the first element `>` a value', () => {
      let data = [1, 2, 2, 3, 3, 4, 5, 5];
      let cmp = (a: number, b: number) => a - b;
      let r1 = upperBound(data, -5, cmp);
      let r2 = upperBound(data, 0, cmp);
      let r3 = upperBound(data, 2, cmp);
      let r4 = upperBound(data, 3, cmp);
      expect(r1).to.be(0);
      expect(r2).to.be(0);
      expect(r3).to.be(3);
      expect(r4).to.be(5);
    });

    it('should return `length` if there is no matching value', () => {
      let data = [1, 2, 2, 3, 3, 4, 5, 5];
      let cmp = (a: number, b: number) => a - b;
      let r1 = upperBound(data, 9, cmp);
      let r2 = upperBound(data, 19, cmp);
      let r3 = upperBound(data, 29, cmp);
      expect(r1).to.be(8);
      expect(r2).to.be(8);
      expect(r3).to.be(8);
    });

    it('should return `0` if the sequence is empty', () => {
      let data: number[] = [];
      let cmp = (a: number, b: number) => a - b;
      let i = upperBound(data, 0, cmp);
      expect(i).to.be(0);
    });

  });

  describe('StringSearch', () => {

    describe('sumOfSquares()', () => {

      it('should score the match using the sum of squared distances', () => {
        let r1 = StringSearch.sumOfSquares('Foo Bar Baz', 'Faa')!;
        let r2 = StringSearch.sumOfSquares('Foo Bar Baz', 'oBz')!;
        let r3 = StringSearch.sumOfSquares('Foo Bar Baz', 'r B')!;
        expect(r1.score).to.be(106);
        expect(r1.indices).to.eql([0, 5, 9]);
        expect(r2.score).to.be(117);
        expect(r2.indices).to.eql([1, 4, 10]);
        expect(r3.score).to.be(149);
        expect(r3.indices).to.eql([6, 7, 8]);
      });

      it('should return `null` if no match is found', () => {
        let r1 = StringSearch.sumOfSquares('Foo Bar Baz', 'faa');
        let r2 = StringSearch.sumOfSquares('Foo Bar Baz', 'obz');
        let r3 = StringSearch.sumOfSquares('Foo Bar Baz', 'raB');
        expect(r1).to.be(null);
        expect(r2).to.be(null);
        expect(r3).to.be(null);
      });

    });

    describe('highlight()', () => {

      it('should interpolate text with <mark> tags', () => {
        let r1 = StringSearch.sumOfSquares('Foo Bar Baz', 'Faa')!;
        let r2 = StringSearch.sumOfSquares('Foo Bar Baz', 'oBz')!;
        let r3 = StringSearch.sumOfSquares('Foo Bar Baz', 'r B')!;
        let h1 = StringSearch.highlight('Foo Bar Baz', r1.indices);
        let h2 = StringSearch.highlight('Foo Bar Baz', r2.indices);
        let h3 = StringSearch.highlight('Foo Bar Baz', r3.indices);
        expect(h1).to.be('<mark>F</mark>oo B<mark>a</mark>r B<mark>a</mark>z');
        expect(h2).to.be('F<mark>o</mark>o <mark>B</mark>ar Ba<mark>z</mark>');
        expect(h3).to.be('Foo Ba<mark>r B</mark>az');
      });

    });

  });

});
