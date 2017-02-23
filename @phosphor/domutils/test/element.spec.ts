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
  ElementExt
} from '@phosphor/domutils';


const STYLE_TEXT = (`
.box-sizing {
  border-top: solid 10px black;
  border-left: solid 15px black;
  padding: 15px 8px 9px 12px;
}

.size-limits {
  min-width: 90px;
  min-height: 95px;
  max-width: 100px;
  max-height: 105px;
}

.hit-test {
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
}

.scroll-area {
  position: absolute;
  overflow: auto;
  top: 0px;
  left: 0px;
  width: 300px;
  height: 600px;
}

.scroll-elemA {
  position: absolute;
  top: 50px;
  left: 50px;
  width: 100px;
  height: 700px;
}

.scroll-elemB {
  position: absolute;
  top: 70px;
  left: 100px;
  width: 100px;
  height: 100px;
}
`);


describe('@phosphor/domutils', () => {

  describe('ElementExt', () => {

    const styleNode = document.createElement('style');
    styleNode.textContent = STYLE_TEXT;

    before(() => {
      document.head.appendChild(styleNode);
    });

    after(() => {
      document.head.removeChild(styleNode);
    });

    let div: HTMLElement = null!;

    beforeEach(() => {
      div = document.createElement('div');
      document.body.appendChild(div);
    });

    afterEach(() => {
      document.body.removeChild(div);
    });

    describe('boxSizing()', () => {

      it('should return a box sizing with correct values', () => {
        div.className = 'box-sizing';
        let box = ElementExt.boxSizing(div);
        expect(box.borderTop).to.equal(10);
        expect(box.borderLeft).to.equal(15);
        expect(box.borderRight).to.equal(0);
        expect(box.borderBottom).to.equal(0);
        expect(box.paddingTop).to.equal(15);
        expect(box.paddingLeft).to.equal(12);
        expect(box.paddingRight).to.equal(8);
        expect(box.paddingBottom).to.equal(9);
        expect(box.verticalSum).to.equal(34);
        expect(box.horizontalSum).to.equal(35);
      });

      it('should use defaults if parameters are not set', () => {
        let sizing = ElementExt.boxSizing(div);
        expect(sizing.borderTop).to.equal(0);
        expect(sizing.borderLeft).to.equal(0);
        expect(sizing.borderRight).to.equal(0);
        expect(sizing.borderBottom).to.equal(0);
        expect(sizing.paddingTop).to.equal(0);
        expect(sizing.paddingLeft).to.equal(0);
        expect(sizing.paddingRight).to.equal(0);
        expect(sizing.paddingBottom).to.equal(0);
        expect(sizing.verticalSum).to.equal(0);
        expect(sizing.horizontalSum).to.equal(0);
      });

    });

    describe('sizeLimits()', () => {

      it('should return a size limits object with correct parameters', () => {
        div.className = 'size-limits';
        let limits = ElementExt.sizeLimits(div);
        expect(limits.minWidth).to.equal(90);
        expect(limits.minHeight).to.equal(95);
        expect(limits.maxWidth).to.equal(100);
        expect(limits.maxHeight).to.equal(105);
      });

      it('should use defaults if parameters are not set', () => {
        let limits = ElementExt.sizeLimits(div);
        expect(limits.minWidth).to.equal(0);
        expect(limits.minHeight).to.equal(0);
        expect(limits.maxWidth).to.equal(Infinity);
        expect(limits.maxHeight).to.equal(Infinity);
      });

    });

    describe('hitTest()', () => {

      it('should return `true` when point is inside the node', () => {
        div.className = 'hit-test';
        expect(ElementExt.hitTest(div, 50, 50)).to.equal(true);
      });

      it('should return `false` when point is outside the node', () => {
        div.className = 'hit-test';
        expect(ElementExt.hitTest(div, 150, 150)).to.equal(false);
      });

      it('should use closed intervals for left and top only', () => {
        div.className = 'hit-test';
        expect(ElementExt.hitTest(div, 0, 0)).to.equal(true);
        expect(ElementExt.hitTest(div, 100, 0)).to.equal(false);
        expect(ElementExt.hitTest(div, 99, 0)).to.equal(true);
        expect(ElementExt.hitTest(div, 0, 100)).to.equal(false);
        expect(ElementExt.hitTest(div, 0, 99)).to.equal(true);
        expect(ElementExt.hitTest(div, 100, 100)).to.equal(false);
        expect(ElementExt.hitTest(div, 99, 99)).to.equal(true);
      });

    });

    describe('scrollIntoViewIfNeeded()', () => {

      let elemA: HTMLElement = null!;
      let elemB: HTMLElement = null!;

      beforeEach(() => {
        div.className = 'scroll-area';
        elemA = document.createElement('div');
        elemB = document.createElement('div');
        elemA.className = 'scroll-elemA';
        elemB.className = 'scroll-elemB';
        div.appendChild(elemA);
        div.appendChild(elemB);
      });

      it('should do nothing if the element covers the viewport', () => {
        elemB.style.top = '1000px';
        div.scrollTop = 75;
        ElementExt.scrollIntoViewIfNeeded(div, elemA);
        expect(div.scrollTop).to.equal(75);
      });

      it('should do nothing if the element fits within the viewport', () => {
        div.scrollTop = 25;
        ElementExt.scrollIntoViewIfNeeded(div, elemB);
        expect(div.scrollTop).to.equal(25);
      });

      it('should align the top edge for smaller size elements overlapping the top', () => {
        elemA.style.top = '1000px';
        div.scrollTop = 90;
        ElementExt.scrollIntoViewIfNeeded(div, elemB);
        expect(div.scrollTop).to.equal(70);
      });

      it('should align the top edge for equal size elements overlapping the top', () => {
        elemA.style.height = '600px';
        elemB.style.top = '1000px';
        div.scrollTop = 90;
        ElementExt.scrollIntoViewIfNeeded(div, elemA);
        expect(div.scrollTop).to.equal(50);
      });

      it('should align the top edge for larger size elements overlapping the bottom', () => {
        elemB.style.top = '1000px';
        ElementExt.scrollIntoViewIfNeeded(div, elemA);
        expect(div.scrollTop).to.equal(50);
      });

      it('should align the top edge for equal size elements overlapping the bottom', () => {
        elemA.style.height = '600px';
        elemB.style.top = '1000px';
        ElementExt.scrollIntoViewIfNeeded(div, elemA);
        expect(div.scrollTop).to.equal(50);
      });

      it('should align the bottom edge for larger size elements overlapping the top', () => {
        elemB.style.top = '1000px';
        div.scrollTop = 200;
        ElementExt.scrollIntoViewIfNeeded(div, elemA);
        expect(div.scrollTop).to.equal(150);
      });

      it('should align the bottom edge for smaller size elements overlapping the bottom', () => {
        elemB.style.top = '600px';
        div.scrollTop = 50;
        ElementExt.scrollIntoViewIfNeeded(div, elemB);
        expect(div.scrollTop).to.equal(100);
      });

    });

  });

});
