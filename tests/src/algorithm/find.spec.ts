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
  find, max, min, minmax
} from '@phosphor/algorithm';


describe('@phosphor/algorithm', () => {

  describe('find()', () => {

    it('should find the first matching value', () => {
      interface IAnimal { species: string, name: string };
      let isCat = (value: IAnimal) => value.species === 'cat';
      let data: IAnimal[] = [
        { species: 'dog', name: 'spot' },
        { species: 'cat', name: 'fluffy' },
        { species: 'alligator', name: 'pocho' },
      ];
      expect(find(data, isCat)).to.equal(data[1]);
    });

    it('should return `undefined` if there is no matching value', () => {
      interface IAnimal { species: string, name: string };
      let isRacoon = (value: IAnimal) => value.species === 'racoon';
      let data: IAnimal[] = [
        { species: 'dog', name: 'spot' },
        { species: 'cat', name: 'fluffy' },
        { species: 'alligator', name: 'pocho' },
      ];
      expect(find(data, isRacoon)).to.equal(undefined);
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
      expect(score).to.equal(data[1]);
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
      expect(score).to.equal(data[0]);
      expect(called).to.equal(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore { value: number };
      let data: IScore[] = [];
      let score = min(data, (a, b) => a.value - b.value);
      expect(score).to.equal(undefined);
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
      expect(score).to.equal(data[3]);
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
      expect(score).to.equal(data[0]);
      expect(called).to.equal(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore { value: number };
      let data: IScore[] = [];
      let score = max(data, (a, b) => a.value - b.value);
      expect(score).to.equal(undefined);
    });

  });

  describe('minmax()', () => {

    it('should return the minimum and maximum value in an iterable', () => {
      interface IScore { value: number };
      let data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 }
      ];
      let [rmin, rmax] = minmax(data, (a, b) => a.value - b.value)!;
      expect(rmin).to.equal(data[1]);
      expect(rmax).to.equal(data[3]);
    });

    it('should not invoke the comparator for only one value', () => {
      interface IScore { value: number };
      let data: IScore[] = [
        { value: 19 },
      ];
      let called = false;
      let [rmin, rmax] = minmax(data, (a, b) => {
        called = true;
        return a.value - b.value;
      })!;
      expect(rmin).to.equal(data[0]);
      expect(rmax).to.equal(data[0]);
      expect(called).to.equal(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore { value: number };
      let data: IScore[] = [];
      let score = minmax(data, (a, b) => a.value - b.value);
      expect(score).to.equal(undefined);
    });

  });

});
