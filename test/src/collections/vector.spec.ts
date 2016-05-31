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
  Vector
} from '../../../lib/collections/vector';


describe('collections/vector', () => {

  describe('Vector', () => {

    describe('#constructor()', () => {

      it('should instantiate with no arguments', () => {
        let vector = new Vector();
        expect(vector).to.be.a(Vector);
      });

      it('should accept an array data source', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let vector = new Vector(data);
        expect(vector).to.be.a(Vector);
      });

    });

    describe('#isEmpty', () => {

      it('should return true for an empty vector', () => {
        let vector = new Vector();
        expect(vector.isEmpty).to.be(true);
      });

      it('should return false for a non-empty vector', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let vector = new Vector(data);
        expect(vector.isEmpty).to.be(false);
      });

    });

    describe('#length', () => {

      it('should return 0 for an empty vector', () => {
        let vector = new Vector();
        expect(vector.length).to.be(0);
      });

      it('should return the number of items in a vector', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let vector = new Vector(data);
        expect(vector.length).to.be(data.length);
      });

    });

    describe('#front', () => {

      it('should return the value at the front of a vector', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let vector = new Vector(data);
        expect(vector.front).to.be(data[0]);
      });

    });

    describe('#back', () => {

      it('should return the value at the back of a vector', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let vector = new Vector(data);
        expect(vector.back).to.be(data[data.length - 1]);
      });

    });

    describe('#iter()', () => {

      it('should return an iterator from the front of the vector', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let vector = new Vector(data);
        let iterator = vector.iter()
        expect(toArray(iterator)).to.eql(data);
      });

    });

    describe('#at()', () => {

      it('should return the value at the specified index', () => {
        let vector = new Vector([1, 2, 3, 4]);
        expect(vector.at(0)).to.be(1);
        expect(vector.at(1)).to.be(2);
        expect(vector.at(2)).to.be(3);
        expect(vector.at(3)).to.be(4);
      });

    });

    describe('#set()', () => {

      it('should set the value at the specified index', () => {
        let vector = new Vector([1, 2, 3, 4]);
        vector.set(0, 11);
        vector.set(1, 12);
        vector.set(2, 13);
        vector.set(3, 14);
        expect(vector.at(0)).to.be(11);
        expect(vector.at(1)).to.be(12);
        expect(vector.at(2)).to.be(13);
        expect(vector.at(3)).to.be(14);
      });

    });

    describe('#pushBack()', () => {

      it('should add a value to the back of the vector', () => {
        let vector = new Vector([1, 2, 3, 4]);

        expect(vector.isEmpty).to.be(false);
        expect(vector.length).to.be(4);
        expect(vector.back).to.be(4);

        vector.pushBack(99);

        expect(vector.isEmpty).to.be(false);
        expect(vector.length).to.be(5);
        expect(vector.back).to.be(99);
      });

      it('should add a value to an empty vector', () => {
        let vector = new Vector();

        expect(vector.isEmpty).to.be(true);
        expect(vector.length).to.be(0);
        expect(vector.back).to.be(void 0);

        vector.pushBack(99);

        expect(vector.isEmpty).to.be(false);
        expect(vector.length).to.be(1);
        expect(vector.back).to.be(99);
      });

    });

    describe('#popBack()', () => {

      it('should remove and return the value at the back of the vector', () => {
        let data = [99, 98, 97];
        let vector = new Vector(data);

        expect(vector.isEmpty).to.be(false);
        expect(vector.length).to.be(3);

        expect(vector.popBack()).to.be(data[2]);
        expect(vector.popBack()).to.be(data[1]);
        expect(vector.popBack()).to.be(data[0]);
        expect(vector.popBack()).to.be(void 0);

        expect(vector.isEmpty).to.be(true);
        expect(vector.length).to.be(0);
      });

    });

    describe('#insert()', () => {

      it('should insert a value at the specified index', () => {
        let vector = new Vector();
        vector.insert(0, 9);
        expect(toArray(vector)).to.eql([9]);
        vector.insert(0, 8);
        expect(toArray(vector)).to.eql([8, 9]);
        vector.insert(0, 7);
        expect(toArray(vector)).to.eql([7, 8, 9]);
        vector.insert(3, 6);
        expect(toArray(vector)).to.eql([7, 8, 9, 6]);
        vector.insert(2, 5);
        expect(toArray(vector)).to.eql([7, 8, 5, 9, 6]);
        vector.insert(1, 4);
        expect(toArray(vector)).to.eql([7, 4, 8, 5, 9, 6]);
      });

    });

    describe('#remove()', () => {

      it('should remove the value at a specified index', () => {
        let vector = new Vector([7, 4, 8, 5, 9, 6]);
        vector.remove(1);
        expect(toArray(vector)).to.eql([7, 8, 5, 9, 6]);
        vector.remove(2);
        expect(toArray(vector)).to.eql([7, 8, 9, 6]);
        vector.remove(3);
        expect(toArray(vector)).to.eql([7, 8, 9]);
        vector.remove(0);
        expect(toArray(vector)).to.eql([8, 9]);
        vector.remove(0);
        expect(toArray(vector)).to.eql([9]);
        vector.remove(0);
        expect(toArray(vector)).to.eql([]);
      });

    });

    describe('#clear()', () => {

      it('should remove all values from the vector', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let vector = new Vector(data);
        vector.clear();
        expect(vector.back).to.be(void 0);
        expect(vector.popBack()).to.be(void 0);
        expect(vector.isEmpty).to.be(true);
        expect(vector.length).to.be(0);
      });

    });

    describe('#swap()', () => {

      it('should swap the contents with another vector', () => {
        let data1 = [0, 1, 2, 3, 4, 5];
        let data2 = [5, 4, 3, 2];
        let vec1 = new Vector(data1);
        let vec2 = new Vector(data2);
        expect(vec1.length).to.be(6);
        expect(vec2.length).to.be(4);
        expect(toArray(vec1)).to.eql(data1);
        expect(toArray(vec2)).to.eql(data2);
        vec1.swap(vec2);
        expect(vec1.length).to.be(4);
        expect(vec2.length).to.be(6);
        expect(toArray(vec1)).to.eql(data2);
        expect(toArray(vec2)).to.eql(data1);
        vec2.swap(vec1);
        expect(vec1.length).to.be(6);
        expect(vec2.length).to.be(4);
        expect(toArray(vec1)).to.eql(data1);
        expect(toArray(vec2)).to.eql(data2);
      });

    });

  });

  describe('typeof Vector#iter()', () => {

    describe('#clone()', () => {

      it('should create a clone of the original iterator', () => {
        let vector = new Vector([99, 98, 97, 96, 95]);
        let iterator = vector.iter();
        let clone = iterator.clone();
        expect(toArray(iterator)).to.eql(toArray(clone));
      });

    });

    describe('#iter()', () => {

      it('should return `this`', () => {
        let vector = new Vector([99, 98, 97, 96, 95]);
        let iterator = vector.iter();
        expect(iterator.iter()).to.be(iterator);
      });

    });

    describe('#next()', () => {

      it('should return the next value from the iterator', () => {
        let data = [99, 98, 97, 96, 95];
        let vector = new Vector(data);
        let iterator = vector.iter();
        expect(toArray(iterator)).to.eql(data);
      });

    });

  });

});
