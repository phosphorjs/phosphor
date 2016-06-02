/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  Title
} from '../../../lib/ui/title';


const defaultOptions = {
  owner: document.body,
  label: 'foo',
  mnemonic: 1,
  icon: 'bar',
  caption: 'fizz',
  className: 'baz',
  closable: true
};


describe('ui/title', () => {

  describe('Title', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let title = new Title();
        expect(title instanceof Title).to.be(true);
      });

      it('should accept title options', () => {
        let title = new Title(defaultOptions);
        expect(title instanceof Title).to.be(true);
      });

    });

    describe('#changed', () => {

      it('should be emitted when the title state changes', () => {
        let called = false;
        let title = new Title(defaultOptions);
        title.changed.connect((sender, arg) => {
          expect(sender).to.be(title);
          expect(arg).to.be(void 0);
          called = true;
        });
        title.label = 'baz';
        expect(called).to.be(true);
      });

    });

    describe('#owner', () => {

      it('should default to `null`', () => {
        let title = new Title();
        expect(title.owner).to.be(null);
      });

      it('should be read-only', () => {
        let title = new Title(defaultOptions);
        expect(title.owner).to.be(document.body);
        expect(() => { title.owner = null; }).to.throwError();
      });

    });

    describe('#label', () => {

      it('should default to an empty string', () => {
        let title = new Title();
        expect(title.label).to.be('');
      });

      it('should be writable', () => {
        let title = new Title();
        title.label = 'foo';
        expect(title.label).to.be('foo');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title(defaultOptions);
        title.changed.connect((sender, arg) => {
          expect(sender).to.be(title);
          expect(arg).to.be(void 0);
          called = true;
        });
        title.label = 'baz';
        expect(called).to.be(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title();
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.label = '';
        expect(called).to.be(false);
      });

    });

    describe('#mnemonic', () => {

      it('should default to `-1', () => {
        let title = new Title();
        expect(title.mnemonic).to.be(-1);
      });

      it('should be writable', () => {
        let title = new Title();
        title.mnemonic = 1;
        expect(title.mnemonic).to.be(1);
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title(defaultOptions);
        title.changed.connect((sender, arg) => {
          expect(sender).to.be(title);
          expect(arg).to.be(void 0);
          called = true;
        });
        title.mnemonic = 0;
        expect(called).to.be(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title();
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.mnemonic = -1;
        expect(called).to.be(false);
      });

    });

    describe('#icon', () => {

      it('should default to an empty string', () => {
        let title = new Title();
        expect(title.icon).to.be('');
      });

      it('should be writable', () => {
        let title = new Title();
        title.icon = 'foo';
        expect(title.icon).to.be('foo');
      });

      it('should allow multiple class names separated with whitespace', () => {
        let title = new Title();
        title.icon = 'foo bar';
        expect(title.icon).to.be('foo bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title(defaultOptions);
        title.changed.connect((sender, arg) => {
          expect(sender).to.be(title);
          expect(arg).to.be(void 0);
          called = true;
        });
        title.icon = 'baz';
        expect(called).to.be(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title();
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.icon = '';
        expect(called).to.be(false);
      });

    });

    describe('#caption', () => {

      it('should default to an empty string', () => {
        let title = new Title({});
        expect(title.caption).to.be('');
      });

      it('should be writable', () => {
        let title = new Title();
        title.caption = 'foo';
        expect(title.caption).to.be('foo');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title(defaultOptions);
        title.changed.connect((sender, arg) => {
          expect(sender).to.be(title);
          expect(arg).to.be(void 0);
          called = true;
        });
        title.caption = '';
        expect(called).to.be(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title();
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.caption = '';
        expect(called).to.be(false);
      });

    });

    describe('#className', () => {

      it('should default to an empty string', () => {
        let title = new Title();
        expect(title.className).to.be('');
      });

      it('should be writable', () => {
        let title = new Title();
        title.className = 'foo';
        expect(title.className).to.be('foo');
      });

      it('should allow multiple class names separated with whitespace', () => {
        let title = new Title();
        title.className = 'foo bar';
        expect(title.className).to.be('foo bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title(defaultOptions);
        title.changed.connect((sender, arg) => {
          expect(sender).to.be(title);
          expect(arg).to.be(void 0);
          called = true;
        });
        title.className = 'ham';
        expect(called).to.be(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title();
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.className = '';
        expect(called).to.be(false);
      });

    });

    describe('#closable', () => {

      it('should default to false', () => {
        let title = new Title();
        expect(title.closable).to.be(false);
      });

      it('should be writable', () => {
        let title = new Title();
        title.closable = true;
        expect(title.closable).to.be(true);
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title(defaultOptions);
        title.changed.connect((sender, arg) => {
          expect(sender).to.be(title);
          expect(arg).to.be(void 0);
          called = true;
        });
        title.closable = false;
        expect(called).to.be(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title();
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.closable = false;
        expect(called).to.be(false);
      });

    });

  });

});
