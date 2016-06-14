/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  boxSizing, sizeLimits
} from '../../../lib/dom/sizing';


describe('dom/sizing', () => {

  describe('boxSizing()', () => {

    it('should return a box sizing with correct parameters', () => {
      let div = document.createElement('div');
      div.className = 'box-sizing';
      document.body.appendChild(div);
      let sizing = boxSizing(div);
      expect(sizing.borderTop).to.be(10);
      expect(sizing.borderLeft).to.be(15);
      expect(sizing.borderRight).to.be(0);
      expect(sizing.borderBottom).to.be(0);
      expect(sizing.paddingTop).to.be(15);
      expect(sizing.paddingLeft).to.be(12);
      expect(sizing.paddingRight).to.be(8);
      expect(sizing.paddingBottom).to.be(9);
      expect(sizing.verticalSum).to.be(34);
      expect(sizing.horizontalSum).to.be(35);
      document.body.removeChild(div);
    });

    it('should use defaults if parameters are not set', () => {
      let div = document.createElement('div');
      document.body.appendChild(div);
      let sizing = boxSizing(div);
      expect(sizing.borderTop).to.be(0);
      expect(sizing.borderLeft).to.be(0);
      expect(sizing.borderRight).to.be(0);
      expect(sizing.borderBottom).to.be(0);
      expect(sizing.paddingTop).to.be(0);
      expect(sizing.paddingLeft).to.be(0);
      expect(sizing.paddingRight).to.be(0);
      expect(sizing.paddingBottom).to.be(0);
      expect(sizing.verticalSum).to.be(0);
      expect(sizing.horizontalSum).to.be(0);
      document.body.removeChild(div);
    });

  });

  describe('sizeLimits()', () => {

    it('should return a size limits object with correct parameters', () => {
      let div = document.createElement('div');
      div.className = 'size-limits';
      document.body.appendChild(div);
      let limits = sizeLimits(div);
      expect(limits.minWidth).to.be(90);
      expect(limits.minHeight).to.be(95);
      expect(limits.maxWidth).to.be(100);
      expect(limits.maxHeight).to.be(105);
      document.body.removeChild(div);
    });

    it('should use defaults if parameters are not set', () => {
      let div = document.createElement('div');
      document.body.appendChild(div);
      let limits = sizeLimits(div);
      expect(limits.minWidth).to.be(0);
      expect(limits.minHeight).to.be(0);
      expect(limits.maxWidth).to.be(Infinity);
      expect(limits.maxHeight).to.be(Infinity);
      document.body.removeChild(div);
    });

  });

});
