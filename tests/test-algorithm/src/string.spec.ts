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
  StringExt
} from '@phosphor/algorithm';


describe('@phosphor/algorithm', () => {

  describe('StringExt', () => {

    describe('findIndices()', () => {

      it('should find the indices of the matching characters', () => {
        let r1 = StringExt.findIndices('Foo Bar Baz', 'Faa')!;
        let r2 = StringExt.findIndices('Foo Bar Baz', 'oBz')!;
        let r3 = StringExt.findIndices('Foo Bar Baz', 'r B')!;
        expect(r1).to.deep.equal([0, 5, 9]);
        expect(r2).to.deep.equal([1, 4, 10]);
        expect(r3).to.deep.equal([6, 7, 8]);
      });

      it('should return `null` if no match is found', () => {
        let r1 = StringExt.findIndices('Foo Bar Baz', 'faa');
        let r2 = StringExt.findIndices('Foo Bar Baz', 'obz');
        let r3 = StringExt.findIndices('Foo Bar Baz', 'raB');
        expect(r1).to.equal(null);
        expect(r2).to.equal(null);
        expect(r3).to.equal(null);
      });

    });

    describe('matchSumOfSquares()', () => {

      it('should score the match using the sum of squared distances', () => {
        let r1 = StringExt.matchSumOfSquares('Foo Bar Baz', 'Faa')!;
        let r2 = StringExt.matchSumOfSquares('Foo Bar Baz', 'oBz')!;
        let r3 = StringExt.matchSumOfSquares('Foo Bar Baz', 'r B')!;
        expect(r1.score).to.equal(106);
        expect(r1.indices).to.deep.equal([0, 5, 9]);
        expect(r2.score).to.equal(117);
        expect(r2.indices).to.deep.equal([1, 4, 10]);
        expect(r3.score).to.equal(149);
        expect(r3.indices).to.deep.equal([6, 7, 8]);
      });

      it('should return `null` if no match is found', () => {
        let r1 = StringExt.matchSumOfSquares('Foo Bar Baz', 'faa');
        let r2 = StringExt.matchSumOfSquares('Foo Bar Baz', 'obz');
        let r3 = StringExt.matchSumOfSquares('Foo Bar Baz', 'raB');
        expect(r1).to.equal(null);
        expect(r2).to.equal(null);
        expect(r3).to.equal(null);
      });

    });

    describe('matchSumOfDeltas()', () => {

      it('should score the match using the sum of deltas distances', () => {
        let r1 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'Frz')!;
        let r2 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'rBa')!;
        let r3 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'oar')!;
        expect(r1.score).to.equal(8);
        expect(r1.indices).to.deep.equal([0, 6, 10]);
        expect(r2.score).to.equal(7);
        expect(r2.indices).to.deep.equal([6, 8, 9]);
        expect(r3.score).to.equal(4);
        expect(r3.indices).to.deep.equal([1, 5, 6]);
      });

      it('should return `null` if no match is found', () => {
        let r1 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'cce');
        let r2 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'ar3');
        let r3 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'raB');
        expect(r1).to.equal(null);
        expect(r2).to.equal(null);
        expect(r3).to.equal(null);
      });

    });

    describe('highlight()', () => {

      it('should interpolate text with highlight results', () => {
        let mark = (chunk: string) => `<mark>${chunk}</mark>`;
        let r1 = StringExt.findIndices('Foo Bar Baz', 'Faa')!;
        let r2 = StringExt.findIndices('Foo Bar Baz', 'oBz')!;
        let r3 = StringExt.findIndices('Foo Bar Baz', 'r B')!;
        let h1 = StringExt.highlight('Foo Bar Baz', r1, mark).join('');
        let h2 = StringExt.highlight('Foo Bar Baz', r2, mark).join('');
        let h3 = StringExt.highlight('Foo Bar Baz', r3, mark).join('');
        expect(h1).to.equal('<mark>F</mark>oo B<mark>a</mark>r B<mark>a</mark>z');
        expect(h2).to.equal('F<mark>o</mark>o <mark>B</mark>ar Ba<mark>z</mark>');
        expect(h3).to.equal('Foo Ba<mark>r B</mark>az');
      });

    });

  });

});
