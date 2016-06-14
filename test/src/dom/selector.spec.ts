/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  calculateSpecificity, isValidSelector, matchesSelector, validateSelector
} from '../../../lib/dom/selector';


describe('dom/selector', () => {

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

  describe('validateSelector()', () => {

    it('should throw an error if the selector is invalid', () => {
      expect(() => { validateSelector('body {'); }).to.throwError();
      expect(() => { validateSelector('.thing<'); }).to.throwError();
      expect(() => { validateSelector('4#foo'); }).to.throwError();
      expect(() => { validateSelector('(#bar .thing[foo] > li'); }).to.throwError();
    });

    it('should return the original selector if valid', () => {
      expect(validateSelector('body')).to.be('body');
      expect(validateSelector('.thing')).to.be('.thing');
      expect(validateSelector('#foo')).to.be('#foo');
      expect(validateSelector('#bar .thing[foo] > li')).to.be('#bar .thing[foo] > li');
    });

  });

  describe('matchesSelector()', () => {

    let div = document.createElement('div');
    div.innerHTML = `
      <ul class="list">
        <li class="item">
          <div class="content">
            <span class="icon">Foo </span>
            <span class="text">Bar</span>
          </div>
        </li>
      </ul>
    `;
    let list = div.firstElementChild;
    let item = list.firstElementChild;
    let content = item.firstElementChild;
    let icon = content.firstElementChild;
    let text = icon.nextElementSibling;

    it('should return `true` if an element matches a selector', () => {
      expect(matchesSelector(div, 'div')).to.be(true);
      expect(matchesSelector(list, '.list')).to.be(true);
      expect(matchesSelector(item, '.list > .item')).to.be(true);
      expect(matchesSelector(icon, '.content .icon')).to.be(true);
      expect(matchesSelector(text, 'div span + .text')).to.be(true);
    });

    it('should return `false` if an element does not match a selector', () => {
      expect(matchesSelector(div, 'li')).to.be(false);
      expect(matchesSelector(list, '.content')).to.be(false);
      expect(matchesSelector(item, '.content > .item')).to.be(false);
      expect(matchesSelector(icon, '.foo .icon')).to.be(false);
      expect(matchesSelector(text, 'ol div + .text')).to.be(false);
    });

  });

});
