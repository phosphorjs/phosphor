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
  Selector
} from '@phosphor/domutils';


describe('@phosphor/domutils', () => {

  describe('Selector', () => {

    describe('calculateSpecificity()', () => {

      it('should compute the specificity of a selector', () => {
        expect(Selector.calculateSpecificity('body')).to.equal(0x000001);
        expect(Selector.calculateSpecificity('.a-class')).to.equal(0x000100);
        expect(Selector.calculateSpecificity('#an-id')).to.equal(0x010000);

        expect(Selector.calculateSpecificity('body.a-class')).to.equal(0x000101);
        expect(Selector.calculateSpecificity('body#an-id')).to.equal(0x010001);

        expect(Selector.calculateSpecificity('body:after')).to.equal(0x0000002);
        expect(Selector.calculateSpecificity('body:first-line')).to.equal(0x0000002);
        expect(Selector.calculateSpecificity('body::first-line')).to.equal(0x0000002);
        expect(Selector.calculateSpecificity('body:not(.a-class)')).to.equal(0x000101);

        expect(Selector.calculateSpecificity('body[foo]')).to.equal(0x000101);
        expect(Selector.calculateSpecificity('body[foo=bar]')).to.equal(0x000101);

        expect(Selector.calculateSpecificity('body div')).to.equal(0x0000002);
        expect(Selector.calculateSpecificity('body .a-class')).to.equal(0x000101);
        expect(Selector.calculateSpecificity('body #an-id')).to.equal(0x010001);
        expect(Selector.calculateSpecificity('body div:active::first-letter')).to.equal(0x000103);

        expect(Selector.calculateSpecificity('body div > span')).to.equal(0x000003);

        expect(Selector.calculateSpecificity('.a-class.b-class')).to.equal(0x000200);
        expect(Selector.calculateSpecificity('.a-class#an-id')).to.equal(0x010100);

        expect(Selector.calculateSpecificity('.a-class:after')).to.equal(0x000101);
        expect(Selector.calculateSpecificity('.a-class:not(.b-class)')).to.equal(0x000200);

        expect(Selector.calculateSpecificity('.a-class[foo]')).to.equal(0x000200);
        expect(Selector.calculateSpecificity('.a-class[foo=bar]')).to.equal(0x000200);

        expect(Selector.calculateSpecificity('.a-class .b-class')).to.equal(0x000200);
        expect(Selector.calculateSpecificity('.a-class > .b-class')).to.equal(0x000200);
        expect(Selector.calculateSpecificity('.a-class #an-id')).to.equal(0x010100);

        expect(Selector.calculateSpecificity('#an-id.a-class')).to.equal(0x010100);

        expect(Selector.calculateSpecificity('#an-id:after')).to.equal(0x010001);
        expect(Selector.calculateSpecificity('#an-id:not(.a-class)')).to.equal(0x010100);

        expect(Selector.calculateSpecificity('#an-id[foo]')).to.equal(0x010100);
        expect(Selector.calculateSpecificity('#an-id[foo=bar]')).to.equal(0x010100);

        expect(Selector.calculateSpecificity('#an-id .a-class')).to.equal(0x010100);
        expect(Selector.calculateSpecificity('#an-id #another-id')).to.equal(0x020000);
        expect(Selector.calculateSpecificity('#an-id > #another-id')).to.equal(0x020000);

        expect(Selector.calculateSpecificity('li.thing:nth-child(2)::after')).to.equal(0x00202);
      });

    });

    describe('isValid()', () => {

      it('returns true if the selector is valid', () => {
        expect(Selector.isValid('body')).to.equal(true);
        expect(Selector.isValid('.thing')).to.equal(true);
        expect(Selector.isValid('#foo')).to.equal(true);
        expect(Selector.isValid('#bar .thing[foo] > li')).to.equal(true);
      });

      it('returns false if the selector is invalid', () => {
        expect(Selector.isValid('body {')).to.equal(false);
        expect(Selector.isValid('.thing<')).to.equal(false);
        expect(Selector.isValid('4#foo')).to.equal(false);
        expect(Selector.isValid('(#bar .thing[foo] > li')).to.equal(false);
      });

    });

    describe('matches()', () => {

      const div = document.createElement('div');
      div.innerHTML = `
        <ul class="list">
          <li class="item">
            <div class="content">
              <span class="icon">Foo</span>
              <span class="text">Bar</span>
            </div>
          </li>
        </ul>
      `;
      const list = div.firstElementChild!;
      const item = list.firstElementChild!;
      const content = item.firstElementChild!;
      const icon = content.firstElementChild!;
      const text = icon.nextElementSibling!;

      it('should return `true` if an element matches a selector', () => {
        expect(Selector.matches(div, 'div')).to.equal(true);
        expect(Selector.matches(list, '.list')).to.equal(true);
        expect(Selector.matches(item, '.list > .item')).to.equal(true);
        expect(Selector.matches(icon, '.content .icon')).to.equal(true);
        expect(Selector.matches(text, 'div span + .text')).to.equal(true);
      });

      it('should return `false` if an element does not match a selector', () => {
        expect(Selector.matches(div, 'li')).to.equal(false);
        expect(Selector.matches(list, '.content')).to.equal(false);
        expect(Selector.matches(item, '.content > .item')).to.equal(false);
        expect(Selector.matches(icon, '.foo .icon')).to.equal(false);
        expect(Selector.matches(text, 'ol div + .text')).to.equal(false);
      });

    });

  });

});
