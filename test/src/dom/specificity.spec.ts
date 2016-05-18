/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  calculateSpecificity, isValidSelector
} from '../../../lib/dom/specificity';


describe('dom/specificity', () => {

  describe('calculateSpecificity()', () => {

    it('should compute the specificity of a selector', () => {
      expect(calculateSpecificity('body')).to.be(0x000001);
      expect(calculateSpecificity('.a-class')).to.be(0x000100);
      expect(calculateSpecificity('#an-id')).to.be(0x010000);

      expect(calculateSpecificity('body.a-class')).to.be(0x000101);
      expect(calculateSpecificity('body#an-id')).to.be(0x010001);

      expect(calculateSpecificity('body:after')).to.be(0x0000002);
      expect(calculateSpecificity('body:first-line')).to.be(0x0000002);
      expect(calculateSpecificity('body::first-line')).to.be(0x0000002);
      expect(calculateSpecificity('body:not(.a-class)')).to.be(0x000101);

      expect(calculateSpecificity('body[foo]')).to.be(0x000101);
      expect(calculateSpecificity('body[foo=bar]')).to.be(0x000101);

      expect(calculateSpecificity('body div')).to.be(0x0000002);
      expect(calculateSpecificity('body .a-class')).to.be(0x000101);
      expect(calculateSpecificity('body #an-id')).to.be(0x010001);
      expect(calculateSpecificity('body div:active::first-letter')).to.be(0x000103);

      expect(calculateSpecificity('body div > span')).to.be(0x000003);

      expect(calculateSpecificity('.a-class.b-class')).to.be(0x000200);
      expect(calculateSpecificity('.a-class#an-id')).to.be(0x010100);

      expect(calculateSpecificity('.a-class:after')).to.be(0x000101);
      expect(calculateSpecificity('.a-class:not(.b-class)')).to.be(0x000200);

      expect(calculateSpecificity('.a-class[foo]')).to.be(0x000200);
      expect(calculateSpecificity('.a-class[foo=bar]')).to.be(0x000200);

      expect(calculateSpecificity('.a-class .b-class')).to.be(0x000200);
      expect(calculateSpecificity('.a-class > .b-class')).to.be(0x000200);
      expect(calculateSpecificity('.a-class #an-id')).to.be(0x010100);

      expect(calculateSpecificity('#an-id.a-class')).to.be(0x010100);

      expect(calculateSpecificity('#an-id:after')).to.be(0x010001);
      expect(calculateSpecificity('#an-id:not(.a-class)')).to.be(0x010100);

      expect(calculateSpecificity('#an-id[foo]')).to.be(0x010100);
      expect(calculateSpecificity('#an-id[foo=bar]')).to.be(0x010100);

      expect(calculateSpecificity('#an-id .a-class')).to.be(0x010100);
      expect(calculateSpecificity('#an-id #another-id')).to.be(0x020000);
      expect(calculateSpecificity('#an-id > #another-id')).to.be(0x020000);

      expect(calculateSpecificity('li.thing:nth-child(2)::after')).to.be(0x00202);
    });

  });

  describe('isValidSelector()', () => {

    it('returns true if the selector is valid', () => {
      expect(isValidSelector('body')).to.be(true);
      expect(isValidSelector('.thing')).to.be(true);
      expect(isValidSelector('#foo')).to.be(true);
      expect(isValidSelector('#bar .thing[foo] > li')).to.be(true);
    });

    it('returns false if the selector is invalid', () => {
      expect(isValidSelector('body {')).to.be(false);
      expect(isValidSelector('.thing<')).to.be(false);
      expect(isValidSelector('4#foo')).to.be(false);
      expect(isValidSelector('(#bar .thing[foo] > li')).to.be(false);
    });

  });

});
