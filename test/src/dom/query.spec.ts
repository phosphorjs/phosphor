/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  hitTest, scrollIntoViewIfNeeded
} from '../../../lib/dom/query';


describe('dom/query', () => {

  describe('hitTest()', () => {

    it('should return `true` when point is inside the node', () => {
      let div = document.createElement('div');
      div.className = 'hit-test';
      document.body.appendChild(div);
      expect(hitTest(div, 50, 50)).to.be(true);
      document.body.removeChild(div);
    });

    it('should return `false` when point is outside the node', () => {
      let div = document.createElement('div');
      div.className = 'hit-test';
      document.body.appendChild(div);
      expect(hitTest(div, 150, 150)).to.be(false);
      document.body.removeChild(div);
    });

    it('should use closed intervals for left and top only', () => {
      let div = document.createElement('div');
      div.className = 'hit-test';
      document.body.appendChild(div);
      expect(hitTest(div, 0, 0)).to.be(true);
      expect(hitTest(div, 100, 0)).to.be(false);
      expect(hitTest(div, 99, 0)).to.be(true);
      expect(hitTest(div, 0, 100)).to.be(false);
      expect(hitTest(div, 0, 99)).to.be(true);
      expect(hitTest(div, 100, 100)).to.be(false);
      expect(hitTest(div, 99, 99)).to.be(true);
      document.body.removeChild(div);
    });

  });

  describe('scrollIntoViewIfNeeded()', () => {

    let area: HTMLElement;
    let elemA: HTMLElement;
    let elemB: HTMLElement;

    beforeEach(() => {
      area = document.createElement('div');
      elemA = document.createElement('div');
      elemB = document.createElement('div');

      area.style.position = 'absolute';
      area.style.overflow = 'auto';
      area.style.top = '0px';
      area.style.left = '0px';
      area.style.width = '300px';
      area.style.height = '600px';

      elemA.style.position = 'absolute';
      elemA.style.top = '50px';
      elemA.style.left = '50px';
      elemA.style.width = '100px';
      elemA.style.height = '700px';

      elemB.style.position = 'absolute';
      elemB.style.top = '70px';
      elemB.style.left = '100px';
      elemB.style.width = '100px';
      elemB.style.height = '100px';

      area.appendChild(elemA);
      area.appendChild(elemB);
      document.body.appendChild(area);
    });

    afterEach(() => {
      document.body.removeChild(area);
      area = null;
      elemA = null;
      elemB = null;
    });

    it('should do nothing if the element covers the viewport', () => {
      elemB.style.top = '1000px';
      area.scrollTop = 75;
      scrollIntoViewIfNeeded(area, elemA);
      expect(area.scrollTop).to.be(75);
    });

    it('should do nothing if the element fits within the viewport', () => {
      area.scrollTop = 25;
      scrollIntoViewIfNeeded(area, elemB);
      expect(area.scrollTop).to.be(25);
    });

    it('should align the top edge for smaller size elements overlapping the top', () => {
      elemA.style.top = '1000px';
      area.scrollTop = 90;
      scrollIntoViewIfNeeded(area, elemB);
      expect(area.scrollTop).to.be(70);
    });

    it('should align the top edge for equal size elements overlapping the top', () => {
      elemA.style.height = '600px';
      elemB.style.top = '1000px';
      area.scrollTop = 90;
      scrollIntoViewIfNeeded(area, elemA);
      expect(area.scrollTop).to.be(50);
    });

    it('should align the top edge for larger size elements overlapping the bottom', () => {
      elemB.style.top = '1000px';
      scrollIntoViewIfNeeded(area, elemA);
      expect(area.scrollTop).to.be(50);
    });

    it('should align the top edge for equal size elements overlapping the bottom', () => {
      elemA.style.height = '600px';
      elemB.style.top = '1000px';
      scrollIntoViewIfNeeded(area, elemA);
      expect(area.scrollTop).to.be(50);
    });

    it('should align the bottom edge for larger size elements overlapping the top', () => {
      elemB.style.top = '1000px';
      area.scrollTop = 200;
      scrollIntoViewIfNeeded(area, elemA);
      expect(area.scrollTop).to.be(150);
    });

    it('should align the bottom edge for smaller size elements overlapping the bottom', () => {
      elemB.style.top = '600px';
      area.scrollTop = 50;
      scrollIntoViewIfNeeded(area, elemB);
      expect(area.scrollTop).to.be(100);
    });

  });

});
