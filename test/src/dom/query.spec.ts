/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  hitTest, scrollIfNeeded
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

  describe('scrollIfNeeded()', () => {

    it('should scroll an element up if needed', () => {
      let area = document.createElement('div');
      let elem = document.createElement('div');
      area.style.height = '100px';
      area.style.overflow = 'auto';
      elem.textContent = 'visible content';
      for (let i = 0; i < 50; i++) {
        area.appendChild(document.createElement('br'));
      }
      area.appendChild(elem);
      document.body.appendChild(area);
      let ar = area.getBoundingClientRect();
      let er = elem.getBoundingClientRect();
      scrollIfNeeded(area, elem);
      expect(area.scrollTop).to.be(Math.round(er.bottom - ar.bottom));
      document.body.removeChild(area);
    });

    it('should scroll an element down if needed', () => {
      let area = document.createElement('div');
      let elem = document.createElement('div');
      area.style.height = '100px';
      area.style.overflow = 'auto';
      elem.textContent = 'visible content';
      area.appendChild(elem);
      for (let i = 0; i < 50; i++) {
        area.appendChild(document.createElement('br'));
      }
      document.body.appendChild(area);
      area.scrollTop = 100;
      let ar = area.getBoundingClientRect();
      let er = elem.getBoundingClientRect();
      scrollIfNeeded(area, elem);
      expect(area.scrollTop).to.be(Math.round(100 - ar.top + er.top));
      document.body.removeChild(area);
    });

    it('should respect the overflow threshold when scrolling up', () => {
      let area = document.createElement('div');
      let elem = document.createElement('div');
      area.style.height = '100px';
      area.style.overflow = 'auto';
      elem.textContent = 'visible content';
      for (let i = 0; i < 50; i++) {
        area.appendChild(document.createElement('br'));
      }
      area.appendChild(elem);
      document.body.appendChild(area);

      let threshold = 10;
      let ar = area.getBoundingClientRect();
      let er = elem.getBoundingClientRect();
      let goal = Math.round(er.bottom - ar.bottom);
      area.scrollTop = er.bottom - ar.bottom - threshold + 2;
      let top = area.scrollTop;
      scrollIfNeeded(area, elem, threshold);
      expect(area.scrollTop).to.be(top);

      ar = area.getBoundingClientRect();
      er = elem.getBoundingClientRect();
      area.scrollTop = er.bottom - ar.bottom - threshold;
      top = area.scrollTop;
      scrollIfNeeded(area, elem, threshold);
      expect(area.scrollTop).to.be(goal);
      document.body.removeChild(area);
    });

    it('should respect the overflow threshold when scrolling down', () => {
      let area = document.createElement('div');
      let elem = document.createElement('div');
      area.style.height = '100px';
      area.style.overflow = 'auto';
      elem.textContent = 'visible content';
      area.appendChild(elem);
      for (let i = 0; i < 50; i++) {
        area.appendChild(document.createElement('br'));
      }
      document.body.appendChild(area);
      area.scrollTop = 100;

      let threshold = 10;
      let ar = area.getBoundingClientRect();
      let er = elem.getBoundingClientRect();
      let goal = threshold;
      area.scrollTop = er.top - ar.top + threshold - 2;
      let top = area.scrollTop;
      scrollIfNeeded(area, elem, threshold);
      expect(area.scrollTop).to.be(top);

      ar = area.getBoundingClientRect();
      er = elem.getBoundingClientRect();
      area.scrollTop = er.top - ar.top + threshold;
      scrollIfNeeded(area, elem, threshold);
      expect(area.scrollTop).to.be(goal);
      document.body.removeChild(area);
    });

  });

});
