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
  BoxSizer, BoxEngine
} from '@phosphor/widgets';


function createSizers(n: number): BoxSizer[] {
  let sizers: BoxSizer[] = [];
  for (let i = 0; i < n; ++i) {
    sizers.push(new BoxSizer());
  }
  return sizers;
}


describe('@phosphor/widgets', () => {

  describe('BoxSizer', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let sizer = new BoxSizer();
        expect(sizer).to.be.an.instanceof(BoxSizer);
      });

    });

    describe('#sizeHint', () => {

      it('should default to `0`', () => {
        let sizer = new BoxSizer();
        expect(sizer.sizeHint).to.equal(0);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.sizeHint = 42;
        expect(sizer.sizeHint).to.equal(42);
      });

    });

    describe('#minSize', () => {

      it('should default to `0`', () => {
        let sizer = new BoxSizer();
        expect(sizer.minSize).to.equal(0);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.minSize = 42;
        expect(sizer.minSize).to.equal(42);
      });

    });

    describe('#maxSize', () => {

      it('should default to `Infinity`', () => {
        let sizer = new BoxSizer();
        expect(sizer.maxSize).to.equal(Infinity);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.maxSize = 42;
        expect(sizer.maxSize).to.equal(42);
      });

    });

    describe('#stretch', () => {

      it('should default to `1`', () => {
        let sizer = new BoxSizer();
        expect(sizer.stretch).to.equal(1);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.stretch = 42;
        expect(sizer.stretch).to.equal(42);
      });

    });

    describe('#size', () => {

      it('should be the computed output', () => {
        let sizer = new BoxSizer();
        expect(typeof sizer.size).to.equal('number');
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.size = 42;
        expect(sizer.size).to.equal(42);
      });

    });

  });

  describe('BoxEngine', () => {

    describe('calc()', () => {

      it('should handle an empty sizers array', () => {
        expect(() => BoxEngine.calc([], 100)).to.not.throw(Error);
      });

      it('should obey the min sizes', () => {
        let sizers = createSizers(4);
        sizers[0].minSize = 10;
        sizers[1].minSize = 20;
        sizers[2].minSize = 30;
        sizers[3].minSize = 40;
        BoxEngine.calc(sizers, 0);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(40);
      });

      it('should obey the max sizes', () => {
        let sizers = createSizers(4);
        sizers[0].maxSize = 10;
        sizers[1].maxSize = 20;
        sizers[2].maxSize = 30;
        sizers[3].maxSize = 40;
        BoxEngine.calc(sizers, 500);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(40);
      });

      it('should handle negative layout space', () => {
        let sizers = createSizers(4);
        sizers[0].minSize = 10;
        sizers[1].minSize = 20;
        sizers[2].minSize = 30;
        BoxEngine.calc(sizers, -500);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(0);
      });

      it('should handle infinite layout space', () => {
        let sizers = createSizers(4);
        sizers[0].maxSize = 10;
        sizers[1].maxSize = 20;
        sizers[2].maxSize = 30;
        BoxEngine.calc(sizers, Infinity);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(Infinity);
      });

      it('should maintain the size hints if possible', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 220);
        expect(sizers[0].size).to.equal(40);
        expect(sizers[1].size).to.equal(50);
        expect(sizers[2].size).to.equal(60);
        expect(sizers[3].size).to.equal(70);
      });

      it('should fairly distribute negative space', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 200);
        expect(sizers[0].size).to.equal(35);
        expect(sizers[1].size).to.equal(45);
        expect(sizers[2].size).to.equal(55);
        expect(sizers[3].size).to.equal(65);
      });

      it('should fairly distribute positive space', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 240);
        expect(sizers[0].size).to.equal(45);
        expect(sizers[1].size).to.equal(55);
        expect(sizers[2].size).to.equal(65);
        expect(sizers[3].size).to.equal(75);
      });

      it('should be callable multiple times for the same sizers', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 240);
        expect(sizers[0].size).to.equal(45);
        expect(sizers[1].size).to.equal(55);
        expect(sizers[2].size).to.equal(65);
        expect(sizers[3].size).to.equal(75);
        BoxEngine.calc(sizers, 280);
        expect(sizers[0].size).to.equal(55);
        expect(sizers[1].size).to.equal(65);
        expect(sizers[2].size).to.equal(75);
        expect(sizers[3].size).to.equal(85);
        BoxEngine.calc(sizers, 200);
        expect(sizers[0].size).to.equal(35);
        expect(sizers[1].size).to.equal(45);
        expect(sizers[2].size).to.equal(55);
        expect(sizers[3].size).to.equal(65);
      });

      it('should distribute negative space according to stretch factors', () => {
        let sizers = createSizers(2);
        sizers[0].sizeHint = 60;
        sizers[1].sizeHint = 60;
        sizers[0].stretch = 2;
        sizers[1].stretch = 4;
        BoxEngine.calc(sizers, 120);
        expect(sizers[0].size).to.equal(60);
        expect(sizers[1].size).to.equal(60);
        BoxEngine.calc(sizers, 60);
        expect(sizers[0].size).to.equal(40);
        expect(sizers[1].size).to.equal(20);
      });

      it('should distribute positive space according to stretch factors', () => {
        let sizers = createSizers(2);
        sizers[0].sizeHint = 60;
        sizers[1].sizeHint = 60;
        sizers[0].stretch = 2;
        sizers[1].stretch = 4;
        BoxEngine.calc(sizers, 120);
        expect(sizers[0].size).to.equal(60);
        expect(sizers[1].size).to.equal(60);
        BoxEngine.calc(sizers, 240);
        expect(sizers[0].size).to.equal(100);
        expect(sizers[1].size).to.equal(140);
      });

      it('should not shrink non-stretchable sizers', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        BoxEngine.calc(sizers, 160);
        expect(sizers[0].size).to.equal(20);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(60);
        expect(sizers[3].size).to.equal(60);
      });

      it('should not expand non-stretchable sizers', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        BoxEngine.calc(sizers, 260);
        expect(sizers[0].size).to.equal(20);
        expect(sizers[1].size).to.equal(70);
        expect(sizers[2].size).to.equal(60);
        expect(sizers[3].size).to.equal(110);
      });

      it('should shrink non-stretchable sizers if required', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        sizers[1].minSize = 20;
        sizers[2].minSize = 55;
        sizers[3].minSize = 60;
        BoxEngine.calc(sizers, 140);
        expect(sizers[0].size).to.equal(5);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(55);
        expect(sizers[3].size).to.equal(60);
      });

      it('should expand non-stretchable sizers if required', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        sizers[1].maxSize = 60;
        sizers[2].maxSize = 70;
        sizers[3].maxSize = 100;
        BoxEngine.calc(sizers, 280);
        expect(sizers[0].size).to.equal(50);
        expect(sizers[1].size).to.equal(60);
        expect(sizers[2].size).to.equal(70);
        expect(sizers[3].size).to.equal(100);
      });

    });

    describe('adjust()', () => {

      it('should adjust a sizer by a positive delta', () => {
        let sizers = createSizers(5);
        sizers[0].sizeHint = 50;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 50;
        sizers[3].sizeHint = 50;
        sizers[4].sizeHint = 50;
        sizers[2].maxSize = 60;
        sizers[3].minSize = 40;
        BoxEngine.calc(sizers, 250);
        expect(sizers[0].size).to.equal(50);
        expect(sizers[1].size).to.equal(50);
        expect(sizers[2].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        BoxEngine.adjust(sizers, 2, 30);
        expect(sizers[0].sizeHint).to.equal(50);
        expect(sizers[1].sizeHint).to.equal(70);
        expect(sizers[2].sizeHint).to.equal(60);
        expect(sizers[3].sizeHint).to.equal(40);
        expect(sizers[4].sizeHint).to.equal(30);
      });

      it('should adjust a sizer by a negative delta', () => {
        let sizers = createSizers(5);
        sizers[0].sizeHint = 50;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 50;
        sizers[3].sizeHint = 50;
        sizers[4].sizeHint = 50;
        sizers[1].minSize = 40;
        sizers[2].minSize = 40;
        BoxEngine.calc(sizers, 250);
        expect(sizers[0].size).to.equal(50);
        expect(sizers[1].size).to.equal(50);
        expect(sizers[2].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        BoxEngine.adjust(sizers, 2, -30);
        expect(sizers[0].sizeHint).to.equal(40);
        expect(sizers[1].sizeHint).to.equal(40);
        expect(sizers[2].sizeHint).to.equal(40);
        expect(sizers[3].sizeHint).to.equal(80);
        expect(sizers[4].sizeHint).to.equal(50);
      });

    });

  });

});
