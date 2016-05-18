/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  ArrayIterator, EmptyIterator, EnumerateIterator, FilterIterator, MapIterator,
  StrideIterator, ZipIterator, each, enumerate, every, filter, iter, map,
  reduce, some, stride, toArray, zip
} from '../../../lib/algorithm/iteration';


describe('algorithm/iteration', () => {

  describe('ArrayIterator', () => {

    describe('#constructor()', () => {

      it('should accept an array data source and start index', () => {
        let iterator = new ArrayIterator([0, 1, 2, 3, 4, 5], 0);
        expect(iterator).to.be.an(ArrayIterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let iterator = new ArrayIterator(data, 0);
        let clone = iterator.clone();
        expect(clone).to.be.an(ArrayIterator);
        expect(toArray(iterator)).to.eql(data);
        expect(toArray(clone)).to.eql(data);
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let iterator = new ArrayIterator([0, 1, 2, 3, 4, 5], 0);
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next item in the iterator', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let iterator = new ArrayIterator(data, 0);
        expect(iterator.next()).to.be(data[0]);
        expect(iterator.next()).to.be(data[1]);
        expect(iterator.next()).to.be(data[2]);
        expect(iterator.next()).to.be(data[3]);
        expect(iterator.next()).to.be(data[4]);
        expect(iterator.next()).to.be(data[5]);
        expect(iterator.next()).to.be(void 0);
      });

      it('should iterate from the given index', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let iterator = new ArrayIterator(data, 4);
        expect(iterator.next()).to.be(data[4]);
        expect(iterator.next()).to.be(data[5]);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

  describe('EmptyIterator', () => {

    describe('.instance', () => {

      it('should be an `EmptyIterator` insance', () => {
        expect(EmptyIterator.instance).to.be.an(EmptyIterator);
      });

    });

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let iterator = new EmptyIterator<number>();
        expect(iterator).to.be.an(EmptyIterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let iterator = new EmptyIterator<number>();
        let clone = iterator.clone();
        expect(clone).to.be.an(EmptyIterator);
        expect(toArray(iterator)).to.eql([]);
        expect(toArray(clone)).to.eql([]);
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let iterator = new EmptyIterator<number>();
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should always return `undefined`', () => {
        let iterator = new EmptyIterator<number>();
        expect(iterator.next()).to.be(void 0);
        expect(iterator.next()).to.be(void 0);
        expect(iterator.next()).to.be(void 0);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

  describe('EnumerateIterator', () => {

    describe('#constructor()', () => {

      it('should accept an iterator source and start index', () => {
        let iterator = new EnumerateIterator(iter([1, 2, 3]), 0);
        expect(iterator).to.be.an(EnumerateIterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let data = [1, 2, 4, 8, 16, 32];
        let wanted = [[0, 1], [1, 2], [2, 4], [3, 8], [4, 16], [5, 32]];
        let iterator = new EnumerateIterator(iter(data), 0);
        let clone = iterator.clone();
        expect(clone).to.be.an(EnumerateIterator);
        expect(toArray(iterator)).to.eql(wanted);
        expect(toArray(clone)).to.eql(wanted);
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let iterator = new EnumerateIterator(iter([]), 0);
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next item in the iterator', () => {
        let data = [1, 2, 4, 8, 16, 32];
        let wanted = [[10, 1], [11, 2], [12, 4], [13, 8], [14, 16], [15, 32]];
        let iterator = new EnumerateIterator(iter(data), 10);
        expect(iterator.next()).to.eql(wanted[0]);
        expect(iterator.next()).to.eql(wanted[1]);
        expect(iterator.next()).to.eql(wanted[2]);
        expect(iterator.next()).to.eql(wanted[3]);
        expect(iterator.next()).to.eql(wanted[4]);
        expect(iterator.next()).to.eql(wanted[5]);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

  describe('FilterIterator', () => {

    describe('#constructor()', () => {

      it('should accept and iterator source and filter', () => {
        let filter = (x: number) => !!(x % 2);
        let iterator = new FilterIterator(iter([1, 2, 3]), filter);
        expect(iterator).to.be.a(FilterIterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let wanted = [1, 3, 5];
        let data = [0, 1, 2, 3, 4, 5];
        let filter = (x: number) => !!(x % 2);
        let iterator = new FilterIterator(iter(data), filter);
        let clone = iterator.clone();
        expect(clone).to.be.a(FilterIterator);
        expect(toArray(iterator)).to.eql(wanted);
        expect(toArray(clone)).to.eql(wanted);
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let filter = (x: number) => !!(x % 2);
        let iterator = new FilterIterator(iter([1, 2, 3]), filter);
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next item in the iterator', () => {
        let wanted = [1, 3, 5];
        let data = [0, 1, 2, 3, 4, 5];
        let filter = (x: number) => !!(x % 2);
        let iterator = new FilterIterator(iter(data), filter);
        expect(iterator.next()).to.be(wanted[0]);
        expect(iterator.next()).to.be(wanted[1]);
        expect(iterator.next()).to.be(wanted[2]);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

  describe('MapIterator', () => {

    describe('#constructor()', () => {

      it('should accept a source iterator and transformer', () => {
        let transformer = (x: number) => x ** 2;
        let iterator = new MapIterator(iter([1, 2, 3]), transformer);
        expect(iterator).to.be.a(MapIterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let wanted = [0, 1, 4, 9, 16, 25];
        let transformer = (x: number) => x ** 2;
        let iterator = new MapIterator(iter(data), transformer);
        let clone = iterator.clone();
        expect(clone).to.be.a(MapIterator);
        expect(toArray(iterator)).to.eql(wanted);
        expect(toArray(clone)).to.eql(wanted);
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let transformer = (x: number) => x ** 2;
        let iterator = new MapIterator(iter(data), transformer);
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next item in the iterator', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let wanted = [0, 1, 4, 9, 16, 25];
        let transformer = (x: number) => x ** 2;
        let iterator = new MapIterator(iter(data), transformer);
        expect(iterator.next()).to.be(wanted[0]);
        expect(iterator.next()).to.be(wanted[1]);
        expect(iterator.next()).to.be(wanted[2]);
        expect(iterator.next()).to.be(wanted[3]);
        expect(iterator.next()).to.be(wanted[4]);
        expect(iterator.next()).to.be(wanted[5]);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

  describe('StrideIterator', () => {

    describe('#constructor()', () => {

      it('should accept a source iterator and step', () => {
        let iterator = new StrideIterator(iter([1, 2, 3]), 2);
        expect(iterator).to.be.a(StrideIterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let wanted = [0, 2, 4];
        let data = [0, 1, 2, 3, 4, 5];
        let iterator = new StrideIterator(iter(data), 2);
        let clone = iterator.clone();
        expect(clone).to.be.a(StrideIterator);
        expect(toArray(iterator)).to.eql(wanted);
        expect(toArray(clone)).to.eql(wanted);
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let wanted = [0, 2, 4];
        let data = [0, 1, 2, 3, 4, 5];
        let iterator = new StrideIterator(iter(data), 2);
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next item in an iterator', () => {
        let wanted = [0, 2, 4];
        let data = [0, 1, 2, 3, 4, 5];
        let iterator = new StrideIterator(iter(data), 2);
        expect(iterator.next()).to.be(wanted[0]);
        expect(iterator.next()).to.be(wanted[1]);
        expect(iterator.next()).to.be(wanted[2]);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

  describe('ZipIterator', () => {

    describe('#constructor()', () => {

      it('should accept an array of iterators', () => {
        let dataA = iter([1, 2, 3, 4, 5]);
        let dataB = iter([1, 4, 9, 16, 25]);
        let dataC = iter([1, 8, 27, 64, 125]);
        let data = [dataA, dataB, dataC];
        let iterator = new ZipIterator(data);
        expect(iterator).to.be.a(ZipIterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let dataA = iter([1, 2, 3, 4, 5]);
        let dataB = iter([1, 4, 9, 16, 25]);
        let dataC = iter([1, 8, 27, 64, 125]);
        let data = [dataA, dataB, dataC];
        let wanted = [
          [1, 1, 1],
          [2, 4, 8],
          [3, 9, 27],
          [4, 16, 64],
          [5, 25, 125]
        ];
        let iterator = new ZipIterator(data);
        let clone = iterator.clone();
        expect(clone).to.be.a(ZipIterator);
        expect(toArray(iterator)).to.eql(wanted);
        expect(toArray(clone)).to.eql(wanted);
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let dataA = iter([1, 2, 3, 4, 5]);
        let dataB = iter([1, 4, 9, 16, 25]);
        let dataC = iter([1, 8, 27, 64, 125]);
        let data = [dataA, dataB, dataC];
        let iterator = new ZipIterator(data);
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next item in the iterator', () => {
        let dataA = iter([1, 2, 3, 4, 5]);
        let dataB = iter([1, 4, 9, 16, 25]);
        let dataC = iter([1, 8, 27, 64, 125]);
        let data = [dataA, dataB, dataC];
        let wanted = [
          [1, 1, 1],
          [2, 4, 8],
          [3, 9, 27],
          [4, 16, 64],
          [5, 25, 125]
        ];
        let iterator = new ZipIterator(data);
        expect(iterator.next()).to.eql(wanted[0]);
        expect(iterator.next()).to.eql(wanted[1]);
        expect(iterator.next()).to.eql(wanted[2]);
        expect(iterator.next()).to.eql(wanted[3]);
        expect(iterator.next()).to.eql(wanted[4]);
        expect(iterator.next()).to.be(void 0);
      });

      it('should terminate when the shortest iterator exhausts', () => {
        let dataA = iter([1, 2, 3, 4, 5]);
        let dataB = iter([1, 4, 9, 16, 25]);
        let dataC = iter([1, 8, 27]);
        let data = [dataA, dataB, dataC];
        let wanted = [
          [1, 1, 1],
          [2, 4, 8],
          [3, 9, 27],
        ];
        let iterator = new ZipIterator(data);
        expect(iterator.next()).to.eql(wanted[0]);
        expect(iterator.next()).to.eql(wanted[1]);
        expect(iterator.next()).to.eql(wanted[2]);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

  describe('iter()', () => {

    it('should create an `ArrayIterator` for an array-like object', () => {
      let data1 = [0, 1, 2, 3];
      let data2 = 'Some string';
      expect(iter(data1)).to.be.an(ArrayIterator);
      expect(iter(data2)).to.be.an(ArrayIterator);
    });

    it('should call `iter` on an iterable', () => {
      let iterator = iter([1, 2, 3, 4]);
      expect(iter(iterator)).to.be(iterator);
    });

  });

  describe('toArray()', () => {

    it('should create an array from an iterable', () => {
      let data = [0, 1, 2, 3, 4, 5];
      let result = toArray(data);
      expect(result).to.be.an(Array);
      expect(result).to.eql(data);
      expect(result).to.not.be(data);
    });

  });

  describe('each()', () => {

    it('should visit every item in an iterable', () => {
      let result = 0;
      let data = [1, 2, 3, 4, 5];
      each(data, x => { result += x; });
      expect(result).to.be(15);
    });

  });

  describe('enumerate()', () => {

    it('should return an enumerate iterator', () => {
      let data = [1, 2, 4, 8];
      let wanted = [[0, 1], [1, 2], [2, 4], [3, 8]];
      let iterator = enumerate(data);
      expect(iterator).to.be.an(EnumerateIterator);
      expect(toArray(iterator)).to.eql(wanted);
    });

  });

  describe('every()', () => {

    it('should verify all items in an iterable satisfy a condition', () => {
      let data = [1, 2, 3, 4, 5];
      let valid = every(data, x => x > 0);
      let invalid = every(data, x => x > 4);
      expect(valid).to.be(true);
      expect(invalid).to.be(false);
    });

  });

  describe('filter()', () => {

    it('should return a filter iterator', () => {
      let data = [0, 1, 2, 3, 4, 5];
      let wanted = [1, 3, 5];
      let iterator = filter(data, x => !!(x % 2));
      expect(iterator).to.be.a(FilterIterator);
      expect(toArray(iterator)).to.eql(wanted);
    });

  });

  describe('map()', () => {

    it('should return a map iterator', () => {
      let data = [0, 1, 2, 3, 4, 5];
      let wanted = [0, 1, 4, 9, 16, 25];
      let iterator = map(data, x => x ** 2);
      expect(iterator).to.be.a(MapIterator);
      expect(toArray(iterator)).to.eql(wanted);
    });

  });

  describe('reduce()', () => {

    it('should reduce items in an iterable into an accumulated value', () => {
      let sum = reduce([1, 2, 3, 4, 5], (a, x) => a + x, 0);
      expect(sum).to.be(15);
    });

    it('should throw if iterable is empty and initial value is undefined', () => {
      let data: Array<number> = [];
      let reducer = (a: number, x: number) => a + x;
      let reduced = () => {
        return reduce(data, reducer);
      };
      expect(reduced).to.throwError(error => {
        expect(error).to.be.a(TypeError);
      });
    });

    it('should return the initial value if iterable is empty', () => {
      let data: Array<number> = [];
      let reducer = (a: number, x: number) => a + x;0
      let result = reduce(data, reducer, 0);
      expect(result).to.be(data.reduce(reducer, 0));
    });

    it('should return the first item the iterable has just one item with no initial value', () => {
      let data = [9];
      let reducer = (a: number, x: number) => a + x;
      let result = reduce(data, reducer);
      expect(result).to.be(data.reduce(reducer));
    });

    it('should invoke the reducer if iterable has just one item with an initial value', () => {
      let data = [9];
      let reducer = (a: number, x: number) => a + x;
      let result = reduce(data, reducer, 1);
      expect(result).to.be(data.reduce(reducer, 1));
    });

    it('should invoke the reduce it iterable has just two items with no initial value', () => {
      let data = [1, 2];
      let reducer = (a: number, x: number) => a + x;
      let result = reduce(data, reducer);
      expect(result).to.be(data.reduce(reducer));
    });

  });

  describe('some()', () => {

    it('should verify some items in an iterable satisfy a condition', () => {
      let data = [1, 2, 3, 4, 5];
      let valid = some(data, x => x > 4);
      let invalid = some(data, x => x < 0);
      expect(valid).to.be(true);
      expect(invalid).to.be(false);
    });

  });

  describe('stride()', () => {

    it('should return a stride iterator', () => {
      let data = [0, 1, 2, 3, 4, 5];
      let wanted = [0, 2, 4];
      let iterator = stride(data, 2);
      expect(iterator).to.be.a(StrideIterator);
      expect(toArray(iterator)).to.eql(wanted);
    });

  });

  describe('zip()', () => {

    it('should return a zip iterator', () => {
      let dataA = [1, 2, 3, 4, 5];
      let dataB = [1, 4, 9, 16, 25];
      let dataC = [1, 8, 27, 64, 125];
      let wanted = [
        [1, 1, 1],
        [2, 4, 8],
        [3, 9, 27],
        [4, 16, 64],
        [5, 25, 125]
      ];
      let iterator = zip(dataA, dataB, dataC);
      expect(iterator).to.be.a(ZipIterator);
      expect(toArray(iterator)).to.eql(wanted);
    });

  });

});
