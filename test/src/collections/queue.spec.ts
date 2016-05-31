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
  Queue
} from '../../../lib/collections/queue';


describe('collections/queue', () => {

  describe('Queue', () => {

    describe('#constructor()', () => {

      it('should instantiate with no arguments', () => {
        let queue = new Queue();
        expect(queue).to.be.a(Queue);
      });

      it('should accept an array data source', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let queue = new Queue(data);
        expect(queue).to.be.a(Queue);
      });

    });

    describe('#isEmpty', () => {

      it('should return true for an empty queue', () => {
        let queue = new Queue();
        expect(queue.isEmpty).to.be(true);
      });

      it('should return false for a non-empty queue', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let queue = new Queue(data);
        expect(queue.isEmpty).to.be(false);
      });

    });

    describe('#length', () => {

      it('should return 0 for an empty queue', () => {
        let queue = new Queue();
        expect(queue.length).to.be(0);
      });

      it('should return the number of items in a queue', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let queue = new Queue(data);
        expect(queue.length).to.be(data.length);
      });

    });

    describe('#back', () => {

      it('should return the value at the back of a queue', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let queue = new Queue(data);
        expect(queue.back).to.be(data[data.length - 1]);
      });

    });

    describe('#front', () => {

      it('should return the value at the front of a queue', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let queue = new Queue(data);
        expect(queue.front).to.be(data[0]);
      });

    });

    describe('#iter()', () => {

      it('should return an iterator starting at the front of the queue', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let queue = new Queue(data);
        let iterator = queue.iter()
        expect(toArray(iterator)).to.eql(data);
      });

    });

    describe('#pushBack()', () => {

      it('should add a value to the back of the queue', () => {
        let queue = new Queue([1, 2, 3, 4]);

        expect(queue.isEmpty).to.be(false);
        expect(queue.length).to.be(4);
        expect(queue.front).to.be(1);
        expect(queue.back).to.be(4);

        queue.pushBack(99);

        expect(queue.isEmpty).to.be(false);
        expect(queue.length).to.be(5);
        expect(queue.front).to.be(1);
        expect(queue.back).to.be(99);
      });

      it('should add a value to an empty queue', () => {
        let queue = new Queue();

        expect(queue.isEmpty).to.be(true);
        expect(queue.length).to.be(0);
        expect(queue.front).to.be(void 0);
        expect(queue.back).to.be(void 0);

        queue.pushBack(99);

        expect(queue.isEmpty).to.be(false);
        expect(queue.length).to.be(1);
        expect(queue.front).to.be(99);
        expect(queue.back).to.be(99);
      });

    });

    describe('#popFront()', () => {

      it('should remove and return the value at the front of the queue', () => {
        let data = [99, 98, 97];
        let queue = new Queue(data);

        expect(queue.isEmpty).to.be(false);
        expect(queue.length).to.be(3);

        expect(queue.popFront()).to.be(data[0]);
        expect(queue.popFront()).to.be(data[1]);
        expect(queue.popFront()).to.be(data[2]);
        expect(queue.popFront()).to.be(void 0);

        expect(queue.isEmpty).to.be(true);
        expect(queue.length).to.be(0);
      });

    });

    describe('#clear()', () => {

      it('should remove all values from the queue', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let queue = new Queue(data);
        queue.clear();
        expect(queue.back).to.be(void 0);
        expect(queue.front).to.be(void 0);
        expect(queue.popFront()).to.be(void 0);
        expect(queue.isEmpty).to.be(true);
        expect(queue.length).to.be(0);
      });

    });

    describe('#swap()', () => {

      it('should swap the contents with another queue', () => {
        let data1 = [0, 1, 2, 3, 4, 5];
        let data2 = [5, 4, 3, 2];
        let queue1 = new Queue(data1);
        let queue2 = new Queue(data2);
        expect(queue1.length).to.be(6);
        expect(queue2.length).to.be(4);
        expect(toArray(queue1)).to.eql(data1);
        expect(toArray(queue2)).to.eql(data2);
        queue1.swap(queue2);
        expect(queue1.length).to.be(4);
        expect(queue2.length).to.be(6);
        expect(toArray(queue1)).to.eql(data2);
        expect(toArray(queue2)).to.eql(data1);
        queue2.swap(queue1);
        expect(queue1.length).to.be(6);
        expect(queue2.length).to.be(4);
        expect(toArray(queue1)).to.eql(data1);
        expect(toArray(queue2)).to.eql(data2);
      });

    });

  });

  describe('typeof Queue#iter()', () => {

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let queue = new Queue([99, 98, 97, 96, 95]);
        let iterator = queue.iter();
        let clone = iterator.clone();
        expect(toArray(iterator)).to.eql(toArray(clone));
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let queue = new Queue([99, 98, 97, 96, 95]);
        let iterator = queue.iter();
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next value from the iterator', () => {
        let data = [99, 98, 97, 96, 95];
        let queue = new Queue(data);
        let iterator = queue.iter();
        expect(toArray(iterator)).to.eql(data);
      });

    });

  });

});
