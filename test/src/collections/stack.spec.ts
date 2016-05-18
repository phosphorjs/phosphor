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
  Stack
} from '../../../lib/collections/stack';


describe('collections/stack', () => {

  describe('Stack', () => {

    describe('#constructor()', () => {

      it('should instantiate with no arguments', () => {
        let stack = new Stack();
        expect(stack).to.be.a(Stack);
      });

      it('should accept an array data source', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let stack = new Stack(data);
        expect(stack).to.be.a(Stack);
      });

    });

    describe('#isEmpty', () => {

      it('should return true for an empty stack', () => {
        let stack = new Stack();
        expect(stack.isEmpty).to.be(true);
      });

      it('should return false for a non-empty stack', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let stack = new Stack(data);
        expect(stack.isEmpty).to.be(false);
      });

    });

    describe('#length', () => {

      it('should return 0 for an empty stack', () => {
        let stack = new Stack();
        expect(stack.length).to.be(0);
      });

      it('should return the number of items in a stack', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let stack = new Stack(data);
        expect(stack.length).to.be(data.length);
      });

    });

    describe('#back', () => {

      it('should return the value at the back of a stack', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let stack = new Stack(data);
        expect(stack.back).to.be(data[data.length - 1]);
      });

    });

    describe('#iter()', () => {

      it('should return an iterator starting at the top of the stack', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let stack = new Stack(data);
        let iterator = stack.iter()
        expect(toArray(iterator)).to.eql(data.slice().reverse());
      });

    });

    describe('#pushBack()', () => {

      it('should add a value to the back of the stack', () => {
        let stack = new Stack([1, 2, 3, 4]);

        expect(stack.isEmpty).to.be(false);
        expect(stack.length).to.be(4);
        expect(stack.back).to.be(4);

        stack.pushBack(99);

        expect(stack.isEmpty).to.be(false);
        expect(stack.length).to.be(5);
        expect(stack.back).to.be(99);
      });

      it('should add a value to an empty stack', () => {
        let stack = new Stack();

        expect(stack.isEmpty).to.be(true);
        expect(stack.length).to.be(0);
        expect(stack.back).to.be(void 0);

        stack.pushBack(99);

        expect(stack.isEmpty).to.be(false);
        expect(stack.length).to.be(1);
        expect(stack.back).to.be(99);
      });

    });

    describe('#popBack()', () => {

      it('should remove and return the value at the back of the stack', () => {
        let data = [99, 98, 97];
        let stack = new Stack(data);

        expect(stack.isEmpty).to.be(false);
        expect(stack.length).to.be(3);

        expect(stack.popBack()).to.be(data[2]);
        expect(stack.popBack()).to.be(data[1]);
        expect(stack.popBack()).to.be(data[0]);
        expect(stack.popBack()).to.be(void 0);

        expect(stack.isEmpty).to.be(true);
        expect(stack.length).to.be(0);
      });

    });

    describe('#clear()', () => {

      it('should remove all values from the stack', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let stack = new Stack(data);
        stack.clear();
        expect(stack.back).to.be(void 0);
        expect(stack.popBack()).to.be(void 0);
        expect(stack.isEmpty).to.be(true);
        expect(stack.length).to.be(0);
      });

    });

    describe('#swap()', () => {

      it('should swap the contents with another stack', () => {
        let data1 = [0, 1, 2, 3, 4, 5];
        let data2 = [5, 4, 3, 2];
        let stack1 = new Stack(data1);
        let stack2 = new Stack(data2);
        expect(stack1.length).to.be(6);
        expect(stack2.length).to.be(4);
        expect(toArray(stack1)).to.eql(data1.slice().reverse());
        expect(toArray(stack2)).to.eql(data2.slice().reverse());
        stack1.swap(stack2);
        expect(stack1.length).to.be(4);
        expect(stack2.length).to.be(6);
        expect(toArray(stack1)).to.eql(data2.slice().reverse());
        expect(toArray(stack2)).to.eql(data1.slice().reverse());
        stack2.swap(stack1);
        expect(stack1.length).to.be(6);
        expect(stack2.length).to.be(4);
        expect(toArray(stack1)).to.eql(data1.slice().reverse());
        expect(toArray(stack2)).to.eql(data2.slice().reverse());
      });

    });

  });

  describe('typeof Stack#iter()', () => {

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let stack = new Stack([99, 98, 97, 96, 95]);
        let iterator = stack.iter();
        let clone = iterator.clone();
        expect(toArray(iterator)).to.eql(toArray(clone));
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let stack = new Stack([99, 98, 97, 96, 95]);
        let iterator = stack.iter();
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next value from the iterator', () => {
        let data = [99, 98, 97, 96, 95];
        let stack = new Stack(data);
        let iterator = stack.iter();
        expect(toArray(iterator)).to.eql(data.slice().reverse());
      });

    });

  });

});
