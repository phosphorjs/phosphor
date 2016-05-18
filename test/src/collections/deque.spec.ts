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
  Deque
} from '../../../lib/collections/deque';


describe('collections/deque', () => {

  describe('Deque', () => {

    describe('#constructor()', () => {

      it('should instantiate with no arguments', () => {
        let deque = new Deque();
        expect(deque).to.be.a(Deque);
      });

      it('should accept an array data source', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let deque = new Deque(data);
        expect(deque).to.be.a(Deque);
      });

    });

    describe('#isEmpty', () => {

      it('should return true for an empty deque', () => {
        let deque = new Deque();
        expect(deque.isEmpty).to.be(true);
      });

      it('should return false for a non-empty deque', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let deque = new Deque(data);
        expect(deque.isEmpty).to.be(false);
      });

    });

    describe('#length', () => {

      it('should return 0 for an empty deque', () => {
        let deque = new Deque();
        expect(deque.length).to.be(0);
      });

      it('should return the number of items in a deque', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let deque = new Deque(data);
        expect(deque.length).to.be(data.length);
      });

    });

    describe('#back', () => {

      it('should return the value at the back of a deque', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let deque = new Deque(data);
        expect(deque.back).to.be(data[data.length - 1]);
      });

    });

    describe('#front', () => {

      it('should return the value at the front of a deque', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let deque = new Deque(data);
        expect(deque.front).to.be(data[0]);
      });

    });

    describe('#iter()', () => {

      it('should return an iterator starting at the front of the deque', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let deque = new Deque(data);
        let iterator = deque.iter();
        expect(toArray(iterator)).to.eql(data);
      });

    });

    describe('#pushBack()', () => {

      it('should add a value to the back of the deque', () => {
        let deque = new Deque([1, 2, 3, 4]);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(4);
        expect(deque.front).to.be(1);
        expect(deque.back).to.be(4);

        deque.pushBack(99);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(5);
        expect(deque.front).to.be(1);
        expect(deque.back).to.be(99);
      });

      it('should add a value to an empty deque', () => {
        let deque = new Deque();

        expect(deque.isEmpty).to.be(true);
        expect(deque.length).to.be(0);
        expect(deque.front).to.be(void 0);
        expect(deque.back).to.be(void 0);

        deque.pushBack(99);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(1);
        expect(deque.front).to.be(99);
        expect(deque.back).to.be(99);
      });

    });

    describe('#pushFront()', () => {

      it('should add a value to the front of the deque', () => {
        let deque = new Deque([1, 2, 3, 4]);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(4);
        expect(deque.front).to.be(1);
        expect(deque.back).to.be(4);

        deque.pushFront(99);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(5);
        expect(deque.front).to.be(99);
        expect(deque.back).to.be(4);
      });

      it('should add a value to the front of an empty deque', () => {
        let deque = new Deque();

        expect(deque.isEmpty).to.be(true);
        expect(deque.length).to.be(0);
        expect(deque.front).to.be(void 0);
        expect(deque.back).to.be(void 0);

        deque.pushFront(99);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(1);
        expect(deque.front).to.be(99);
      });

    });

    describe('#popBack()', () => {

      it('should remove and return the value at the back of the deque', () => {
        let data = [99, 98, 97];
        let deque = new Deque(data);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(3);

        expect(deque.popBack()).to.be(data[2]);
        expect(deque.popBack()).to.be(data[1]);
        expect(deque.popBack()).to.be(data[0]);
        expect(deque.popBack()).to.be(void 0);

        expect(deque.isEmpty).to.be(true);
        expect(deque.length).to.be(0);
      });

    });

    describe('#popFront()', () => {

      it('should remove and return the value at the front of the deque', () => {
        let data = [99, 98, 97];
        let deque = new Deque(data);

        expect(deque.isEmpty).to.be(false);
        expect(deque.length).to.be(3);

        expect(deque.popFront()).to.be(data[0]);
        expect(deque.popFront()).to.be(data[1]);
        expect(deque.popFront()).to.be(data[2]);
        expect(deque.popFront()).to.be(void 0);

        expect(deque.isEmpty).to.be(true);
        expect(deque.length).to.be(0);
      });

    });

    describe('#clear()', () => {

      it('should remove all values from the deque', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let deque = new Deque(data);
        deque.clear();
        expect(deque.back).to.be(void 0);
        expect(deque.front).to.be(void 0);
        expect(deque.popFront()).to.be(void 0);
        expect(deque.popBack()).to.be(void 0);
        expect(deque.isEmpty).to.be(true);
        expect(deque.length).to.be(0);
      });

    });

    describe('#swap()', () => {

      it('should swap the contents with another deque', () => {
        let data1 = [0, 1, 2, 3, 4, 5];
        let data2 = [5, 4, 3, 2];
        let deque1 = new Deque(data1);
        let deque2 = new Deque(data2);
        expect(deque1.length).to.be(6);
        expect(deque2.length).to.be(4);
        expect(toArray(deque1)).to.eql(data1);
        expect(toArray(deque2)).to.eql(data2);
        deque1.swap(deque2);
        expect(deque1.length).to.be(4);
        expect(deque2.length).to.be(6);
        expect(toArray(deque1)).to.eql(data2);
        expect(toArray(deque2)).to.eql(data1);
        deque2.swap(deque1);
        expect(deque1.length).to.be(6);
        expect(deque2.length).to.be(4);
        expect(toArray(deque1)).to.eql(data1);
        expect(toArray(deque2)).to.eql(data2);
      });

    });

  });

  describe('typeof Deque#iter()', () => {

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let deque = new Deque([99, 98, 97, 96, 95]);
        let iterator = deque.iter();
        let clone = iterator.clone();
        expect(toArray(iterator)).to.eql(toArray(clone));
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let deque = new Deque([99, 98, 97, 96, 95]);
        let iterator = deque.iter();
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next value from the iterator', () => {
        let data = [99, 98, 97, 96, 95];
        let deque = new Deque(data);
        let iterator = deque.iter();
        expect(toArray(iterator)).to.eql(data);
      });

    });

  });

});
