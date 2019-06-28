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
  Title
} from '@phosphor/widgets';


const owner = { name: 'Bob' };


describe('@phosphor/widgets', () => {

  describe('Title', () => {

    describe('#constructor()', () => {

      it('should accept title options', () => {
        let title = new Title({ owner });
        expect(title).to.be.an.instanceof(Title);
      });

    });

    describe('#changed', () => {

      it('should be emitted when the title state changes', () => {
        let called = false;
        let title = new Title({ owner });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.label = 'baz';
        expect(called).to.equal(true);
      });

    });

    describe('#owner', () => {

      it('should be the title owner', () => {
        let title = new Title({ owner });
        expect(title.owner).to.equal(owner);
      });

    });

    describe('#label', () => {

      it('should default to an empty string', () => {
        let title = new Title({ owner });
        expect(title.label).to.equal('');
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, label: 'foo' });
        expect(title.label).to.equal('foo');
      });

      it('should be writable', () => {
        let title = new Title({ owner, label: 'foo' });
        title.label = 'bar';
        expect(title.label).to.equal('bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, label: 'foo' });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.label = 'baz';
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, label: 'foo' });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.label = 'foo';
        expect(called).to.equal(false);
      });

    });

    describe('#mnemonic', () => {

      it('should default to `-1', () => {
        let title = new Title({ owner });
        expect(title.mnemonic).to.equal(-1);
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, mnemonic: 1 });
        expect(title.mnemonic).to.equal(1);
      });

      it('should be writable', () => {
        let title = new Title({ owner, mnemonic: 1 });
        title.mnemonic = 2;
        expect(title.mnemonic).to.equal(2);
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, mnemonic: 1 });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.mnemonic = 0;
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, mnemonic: 1 });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.mnemonic = 1;
        expect(called).to.equal(false);
      });

    });

    describe('#icon', () => {

      it('should default to an empty string', () => {
        let title = new Title({ owner });
        expect(title.icon).to.equal('');
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, icon: 'foo' });
        expect(title.icon).to.equal('foo');
      });

      it('should be writable', () => {
        let title = new Title({ owner, icon: 'foo' });
        title.icon = 'bar';
        expect(title.icon).to.equal('bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, icon: 'foo' });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.icon = 'baz';
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, icon: 'foo' });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.icon = 'foo';
        expect(called).to.equal(false);
      });

    });

    describe('#caption', () => {

      it('should default to an empty string', () => {
        let title = new Title({ owner });
        expect(title.caption).to.equal('');
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, caption: 'foo' });
        expect(title.caption).to.equal('foo');
      });

      it('should be writable', () => {
        let title = new Title({ owner, caption: 'foo' });
        title.caption = 'bar';
        expect(title.caption).to.equal('bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, caption: 'foo' });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.caption = 'baz';
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, caption: 'foo' });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.caption = 'foo';
        expect(called).to.equal(false);
      });

    });

    describe('#className', () => {

      it('should default to an empty string', () => {
        let title = new Title({ owner });
        expect(title.className).to.equal('');
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, className: 'foo' });
        expect(title.className).to.equal('foo');
      });

      it('should be writable', () => {
        let title = new Title({ owner, className: 'foo' });
        title.className = 'bar';
        expect(title.className).to.equal('bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, className: 'foo' });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.className = 'baz';
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, className: 'foo' });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.className = 'foo';
        expect(called).to.equal(false);
      });

    });

    describe('#closable', () => {

      it('should default to `false`', () => {
        let title = new Title({ owner });
        expect(title.closable).to.equal(false);
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, closable: true });
        expect(title.closable).to.equal(true);
      });

      it('should be writable', () => {
        let title = new Title({ owner, closable: true });
        title.closable = false;
        expect(title.closable).to.equal(false);
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, closable: false });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.closable = true;
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, closable: false });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.closable = false;
        expect(called).to.equal(false);
      });

    });

    describe('#dataset', () => {

      it('should default to `{}`', () => {
        let title = new Title({ owner });
        expect(title.dataset).to.deep.equal({});
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, dataset: { foo: '12' } });
        expect(title.dataset).to.deep.equal({ foo: '12' });
      });

      it('should be writable', () => {
        let title = new Title({ owner, dataset: { foo: '12' } });
        title.dataset = { bar: '42' };
        expect(title.dataset).to.deep.equal({ bar: '42' });
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, dataset: { foo: '12' } });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.dataset = { bar: '42' };
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let dataset = { foo: '12' };
        let title = new Title({ owner, dataset });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.dataset = dataset;
        expect(called).to.equal(false);
      });

    });

  });

});
