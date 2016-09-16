/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  toArray
} from '../../../lib/algorithm/iteration';

import {
  Range, RangeIterator, range
} from '../../../lib/algorithm/range';


describe('algorithm/range', () => {

  describe('range()', () => {

    it('should create a range and accept a stop argument', () => {
      let seq = range(10);
      expect(seq).to.be.a(Range);
      expect(seq.length).to.be(10);
      expect(seq.start).to.be(0);
      expect(seq.stop).to.be(10);
      expect(seq.step).to.be(1);
    });

    it('should accept stop and start values', () => {
      let seq = range(0, 2);
      expect(seq.length).to.be(2);
      expect(seq.start).to.be(0);
      expect(seq.stop).to.be(2);
      expect(seq.step).to.be(1);
    });

    it('should accept start, stop, and step values', () => {
      let seq = range(0, 11, 2);
      expect(seq.length).to.be(6);
      expect(seq.start).to.be(0);
      expect(seq.stop).to.be(11);
      expect(seq.step).to.be(2);
    });

    it('should throw an error if step is 0', () => {
      expect(() => { range(0, 1, 0); }).to.throwError();
    });

    it('should have a zero length if start is greater than stop', () => {
      let seq = range(10, 0);
      expect(seq.length).to.be(0);
      expect(seq.start).to.be(10);
      expect(seq.stop).to.be(0);
      expect(seq.step).to.be(1);
    });

    it('should have a zero length if the step is less than zero', () => {
      let seq = range(0, 10, -1);
      expect(seq.length).to.be(0);
      expect(seq.start).to.be(0);
      expect(seq.stop).to.be(10);
      expect(seq.step).to.be(-1);
    });

  });

  describe('Range', () => {

    describe('#constructor()', () => {

      it('should accept start, stop, and step parameters', () => {
        let seq = new Range(0, 10, 1);
        expect(seq).to.be.a(Range);
      });

      it('should throw an error if the step is 0', () => {
        expect(() => { new Range(0, 1, 0); }).to.throwError();
      });

    });

    describe('#start', () => {

      it('should be the starting value for the range', () => {
        let seq = new Range(1, 10, 2);
        expect(seq.start).to.be(1);
      });

    });

    describe('#stop', () => {

      it('should be the stopping value for the range', () => {
        let seq = new Range(1, 10, 2);
        expect(seq.stop).to.be(10);
      });

    });

    describe('#step', () => {

      it('should be the distance between each value', () => {
        let seq = new Range(1, 10, 2);
        expect(seq.step).to.be(2);
      });

    });

    describe('#length', () => {

      it('should be the number of values in the range', () => {
        let seq = new Range(1, 11, 2);
        expect(seq.length).to.be(5);
      });

    });

    describe('#iter', () => {

      it('should return a RangeIterator', () => {
        let range = new Range(0, 10, 1);
        expect(range.iter()).to.be.a(RangeIterator);
      });

      it('should return the next item in the iterator', () => {
        let range = new Range(0, 11, 2);
        let iterator = range.iter();
        expect(iterator.next()).to.be(0);
        expect(iterator.next()).to.be(2);
        expect(iterator.next()).to.be(4);
        expect(iterator.next()).to.be(6);
        expect(iterator.next()).to.be(8);
        expect(iterator.next()).to.be(10);
        expect(iterator.next()).to.be(void 0);
      });

    });

    describe('#at()', () => {

      it('get the value at the specified index', () => {
        let seq = new Range(1, 11, 2);
        expect(seq.at(0)).to.be(1);
        expect(seq.at(1)).to.be(3);
      });

    });

  });

  describe('RangeIterator', () => {

    describe('#constructor()', () => {

      it('should accept start, stop, and step parameters', () => {
        let iterator = new RangeIterator(0, 10, 1);
        expect(iterator).to.be.a(RangeIterator);
      });

      it('should throw an error if the step is 0', () => {
        expect(() => { new RangeIterator(0, 1, 0); }).to.throwError();
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let iterator = new RangeIterator(0, 10, 1);
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let iterator = new RangeIterator(0, 10, 1);
        let clone = iterator.clone();
        expect(clone).to.be.a(RangeIterator);
        expect(toArray(iterator)).to.eql(toArray(clone));
      });

    });

    describe('#next()', () => {

      it('should return the next item in the iterator', () => {
        let iterator = new RangeIterator(0, 11, 2);
        expect(iterator.next()).to.be(0);
        expect(iterator.next()).to.be(2);
        expect(iterator.next()).to.be(4);
        expect(iterator.next()).to.be(6);
        expect(iterator.next()).to.be(8);
        expect(iterator.next()).to.be(10);
        expect(iterator.next()).to.be(void 0);
      });

    });

  });

});
