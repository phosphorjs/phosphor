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
  ArraySequence, MutableArraySequence, asMutableSequence, asSequence
} from '../../../lib/algorithm/sequence';


describe('algorithm/sequence', () => {

  describe('asSequence()', () => {

    it('should return the input object if it is a sequence', () => {
      let seq = new ArraySequence([1, 2, 3, 4, 5]);
      expect(asSequence(seq)).to.be(seq);
    });

    it('should wrap an array-like object in an array sequence', () => {
      expect(asSequence([1, 2, 3])).to.be.an(ArraySequence);
    });

  });

  describe('asMutableSequence()', () => {

    it('should return the input object if it is a mutable sequence', () => {
      let seq = new MutableArraySequence([1, 2, 3, 4, 5]);
      expect(asMutableSequence(seq)).to.be(seq);
    });

    it('should wrap an array-like object in a mutable array sequence', () => {
      expect(asMutableSequence([1, 2, 3])).to.be.a(MutableArraySequence);
    });

  });

  describe('ArraySequence', () => {

    describe('#constructor()', () => {

      it('should accept an array-like object', () => {
        let seq = new ArraySequence([1, 2, 3, 4, 5]);
        expect(seq).to.be.an(ArraySequence);
      });

    });

    describe('#length', () => {

      it('should reflect the length of the source', () => {
        let src = [1, 2, 3, 4, 5];
        let seq = new ArraySequence(src);
        expect(seq.length).to.be(5);
      });

      it('should be read-only', () => {
        let src = [1, 2, 3, 4, 5];
        let seq = new ArraySequence(src);
        expect(() => { seq.length = 0; }).to.throwException();
      });

    });

    describe('#iter()', () => {

      it('should create an iterator over the source values', () => {
        let src = [1, 2, 3, 4, 5];
        let seq = new ArraySequence(src);
        expect(toArray(seq.iter())).to.eql(src);
      });

    });

    describe('#at()', () => {

      it('should return the source value at the given index', () => {
        let src = [1, 2, 3, 4, 5];
        let seq = new ArraySequence(src);
        expect(seq.at(0)).to.be(src[0]);
        expect(seq.at(1)).to.be(src[1]);
        expect(seq.at(2)).to.be(src[2]);
        expect(seq.at(3)).to.be(src[3]);
        expect(seq.at(4)).to.be(src[4]);
      });

    });

  });

  describe('MutableArraySequence', () => {

    describe('#constructor()', () => {

      it('should accept an array-like object', () => {
        let seq = new MutableArraySequence([1, 2, 3, 4, 5]);
        expect(seq).to.be.an(ArraySequence);
        expect(seq).to.be.a(MutableArraySequence);
      });

    });

    describe('#set()', () => {

      it('should set the source value at the given index', () => {
        let seq = new MutableArraySequence([1, 2, 3, 4]);
        seq.set(0, 4);
        seq.set(1, 3);
        seq.set(2, 2);
        seq.set(3, 1);
        expect(seq.at(0)).to.be(4);
        expect(seq.at(1)).to.be(3);
        expect(seq.at(2)).to.be(2);
        expect(seq.at(3)).to.be(1);
      });

    });

  });

});
