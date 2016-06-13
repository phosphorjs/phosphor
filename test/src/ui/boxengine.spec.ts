/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  BoxSizer, boxCalc
} from '../../../lib/ui/boxengine';


function createSizers(n: number): BoxSizer[] {
  let sizers: BoxSizer[] = [];
  for (let i = 0; i < n; ++i) {
    sizers.push(new BoxSizer());
  }
  return sizers;
}


describe('ui/boxengine', () => {

  describe('BoxSizer', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let sizer = new BoxSizer();
        expect(sizer instanceof BoxSizer).to.be(true);
      });

    });

    describe('#sizeHint', () => {

      it('should default to `0`', () => {
        let sizer = new BoxSizer();
        expect(sizer.sizeHint).to.be(0);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.sizeHint = 42;
        expect(sizer.sizeHint).to.be(42);
      });

    });

    describe('#minSize', () => {

      it('should default to `0`', () => {
        let sizer = new BoxSizer();
        expect(sizer.minSize).to.be(0);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.minSize = 42;
        expect(sizer.minSize).to.be(42);
      });

    });

    describe('#maxSize', () => {

      it('should default to `Infinity`', () => {
        let sizer = new BoxSizer();
        expect(sizer.maxSize).to.be(Infinity);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.maxSize = 42;
        expect(sizer.maxSize).to.be(42);
      });

    });

    describe('#stretch', () => {

      it('should default to `1`', () => {
        let sizer = new BoxSizer();
        expect(sizer.stretch).to.be(1);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.stretch = 42;
        expect(sizer.stretch).to.be(42);
      });

    });

    describe('#size', () => {

      it('should be the computed output', () => {
        let sizer = new BoxSizer();
        expect(typeof sizer.size).to.be('number');
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.size = 42;
        expect(sizer.size).to.be(42);
      });

    });

    describe('#done', () => {

      it('should be an internal boolean', () => {
        let sizer = new BoxSizer();
        expect(typeof sizer.done).to.be('boolean');
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        let done = !sizer.done;
        sizer.done = done;
        expect(sizer.done).to.be(done);
      });

    });

  });

  describe('boxCalc()', () => {

    it('should handle an empty sizers array', () => {
      expect(() => boxCalc([], 100)).to.not.throwError();
    });

    it('should obey the min sizes', () => {
      let sizers = createSizers(4);
      sizers[0].minSize = 10;
      sizers[1].minSize = 20;
      sizers[2].minSize = 30;
      sizers[3].minSize = 40;
      boxCalc(sizers, 0);
      expect(sizers[0].size).to.be(10);
      expect(sizers[1].size).to.be(20);
      expect(sizers[2].size).to.be(30);
      expect(sizers[3].size).to.be(40);
    });

    it('should obey the max sizes', () => {
      let sizers = createSizers(4);
      sizers[0].maxSize = 10;
      sizers[1].maxSize = 20;
      sizers[2].maxSize = 30;
      sizers[3].maxSize = 40;
      boxCalc(sizers, 500);
      expect(sizers[0].size).to.be(10);
      expect(sizers[1].size).to.be(20);
      expect(sizers[2].size).to.be(30);
      expect(sizers[3].size).to.be(40);
    });

    it('should handle negative layout space', () => {
      let sizers = createSizers(4);
      sizers[0].minSize = 10;
      sizers[1].minSize = 20;
      sizers[2].minSize = 30;
      boxCalc(sizers, -500);
      expect(sizers[0].size).to.be(10);
      expect(sizers[1].size).to.be(20);
      expect(sizers[2].size).to.be(30);
      expect(sizers[3].size).to.be(0);
    });

    it('should handle infinite layout space', () => {
      let sizers = createSizers(4);
      sizers[0].maxSize = 10;
      sizers[1].maxSize = 20;
      sizers[2].maxSize = 30;
      boxCalc(sizers, Infinity);
      expect(sizers[0].size).to.be(10);
      expect(sizers[1].size).to.be(20);
      expect(sizers[2].size).to.be(30);
      expect(sizers[3].size).to.be(Infinity);
    });

    it('should maintain the size hints if possible', () => {
      let sizers = createSizers(4);
      sizers[0].sizeHint = 40;
      sizers[1].sizeHint = 50;
      sizers[2].sizeHint = 60;
      sizers[3].sizeHint = 70;
      boxCalc(sizers, 220);
      expect(sizers[0].size).to.be(40);
      expect(sizers[1].size).to.be(50);
      expect(sizers[2].size).to.be(60);
      expect(sizers[3].size).to.be(70);
    });

    it('should fairly distribute negative space', () => {
      let sizers = createSizers(4);
      sizers[0].sizeHint = 40;
      sizers[1].sizeHint = 50;
      sizers[2].sizeHint = 60;
      sizers[3].sizeHint = 70;
      boxCalc(sizers, 200);
      expect(sizers[0].size).to.be(35);
      expect(sizers[1].size).to.be(45);
      expect(sizers[2].size).to.be(55);
      expect(sizers[3].size).to.be(65);
    });

    it('should fairly distribute positive space', () => {
      let sizers = createSizers(4);
      sizers[0].sizeHint = 40;
      sizers[1].sizeHint = 50;
      sizers[2].sizeHint = 60;
      sizers[3].sizeHint = 70;
      boxCalc(sizers, 240);
      expect(sizers[0].size).to.be(45);
      expect(sizers[1].size).to.be(55);
      expect(sizers[2].size).to.be(65);
      expect(sizers[3].size).to.be(75);
    });

    it('should be callable multiple times for the same sizers', () => {
      let sizers = createSizers(4);
      sizers[0].sizeHint = 40;
      sizers[1].sizeHint = 50;
      sizers[2].sizeHint = 60;
      sizers[3].sizeHint = 70;
      boxCalc(sizers, 240);
      expect(sizers[0].size).to.be(45);
      expect(sizers[1].size).to.be(55);
      expect(sizers[2].size).to.be(65);
      expect(sizers[3].size).to.be(75);
      boxCalc(sizers, 280);
      expect(sizers[0].size).to.be(55);
      expect(sizers[1].size).to.be(65);
      expect(sizers[2].size).to.be(75);
      expect(sizers[3].size).to.be(85);
      boxCalc(sizers, 200);
      expect(sizers[0].size).to.be(35);
      expect(sizers[1].size).to.be(45);
      expect(sizers[2].size).to.be(55);
      expect(sizers[3].size).to.be(65);
    });

    it('should distribute negative space according to stretch factors', () => {
      let sizers = createSizers(2);
      sizers[0].sizeHint = 60;
      sizers[1].sizeHint = 60;
      sizers[0].stretch = 2;
      sizers[1].stretch = 4;
      boxCalc(sizers, 120);
      expect(sizers[0].size).to.be(60);
      expect(sizers[1].size).to.be(60);
      boxCalc(sizers, 60);
      expect(sizers[0].size).to.be(40);
      expect(sizers[1].size).to.be(20);
    });

    it('should distribute positive space according to stretch factors', () => {
      let sizers = createSizers(2);
      sizers[0].sizeHint = 60;
      sizers[1].sizeHint = 60;
      sizers[0].stretch = 2;
      sizers[1].stretch = 4;
      boxCalc(sizers, 120);
      expect(sizers[0].size).to.be(60);
      expect(sizers[1].size).to.be(60);
      boxCalc(sizers, 240);
      expect(sizers[0].size).to.be(100);
      expect(sizers[1].size).to.be(140);
    });

    it('should not shrink non-stretchable sizers', () => {
      let sizers = createSizers(4);
      sizers[0].sizeHint = 20;
      sizers[1].sizeHint = 40;
      sizers[2].sizeHint = 60;
      sizers[3].sizeHint = 80;
      sizers[0].stretch = 0;
      sizers[2].stretch = 0;
      boxCalc(sizers, 160);
      expect(sizers[0].size).to.be(20);
      expect(sizers[1].size).to.be(20);
      expect(sizers[2].size).to.be(60);
      expect(sizers[3].size).to.be(60);
    });

    it('should not expand non-stretchable sizers', () => {
      let sizers = createSizers(4);
      sizers[0].sizeHint = 20;
      sizers[1].sizeHint = 40;
      sizers[2].sizeHint = 60;
      sizers[3].sizeHint = 80;
      sizers[0].stretch = 0;
      sizers[2].stretch = 0;
      boxCalc(sizers, 260);
      expect(sizers[0].size).to.be(20);
      expect(sizers[1].size).to.be(70);
      expect(sizers[2].size).to.be(60);
      expect(sizers[3].size).to.be(110);
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
      boxCalc(sizers, 140);
      expect(sizers[0].size).to.be(5);
      expect(sizers[1].size).to.be(20);
      expect(sizers[2].size).to.be(55);
      expect(sizers[3].size).to.be(60);
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
      boxCalc(sizers, 280);
      expect(sizers[0].size).to.be(50);
      expect(sizers[1].size).to.be(60);
      expect(sizers[2].size).to.be(70);
      expect(sizers[3].size).to.be(100);
    });

  });

});
