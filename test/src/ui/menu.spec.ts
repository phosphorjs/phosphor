/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  JSONObject
} from '../../../lib/algorithm/json';

import {
  commands
} from '../../../lib/ui/commands';

import {
  keymap
} from '../../../lib/ui/keymap';

import {
  Menu, MenuItem
} from '../../../lib/ui/menu';


describe('ui/menu', () => {

  describe('MenuItem(', () => {

    describe('#constructor()', () => {

      it('should accept options for initializing the menu item', () => {
        let item = new MenuItem({});
        expect(item instanceof MenuItem).to.be(true);
      });

    });

    describe('#type', () => {

      it('should get the type of the menu item', () => {
        let item = new MenuItem({ type: 'separator' });
        expect(item.type).to.be('separator');
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.type = 'separator'; }).to.throwError();
      });

      it("should default to `'command'`", () => {
        let item = new MenuItem({});
        expect(item.type).to.be('command');
      });

    });

    describe('#command', () => {

      it('should get the command to execute when the item is triggered', () => {
        let item = new MenuItem({ command: 'foo' });
        expect(item.command).to.be('foo');
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.command = 'bar'; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = new MenuItem({});
        expect(item.command).to.be('');
      });

    });

    describe('#args', () => {

      it('should get the arguments for the command', () => {
        let item = new MenuItem({ args: { foo: 1 } });
        expect(item.args).to.eql({ foo: 1 });
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.args = null; }).to.throwError();
      });

      it('should default to `null`', () => {
        let item = new MenuItem({});
        expect(item.args).to.be(null);
      });

    });

    describe('#menu', () => {

      it('should get the menu for the item', () => {
        let menu = new Menu();
        let item = new MenuItem({ menu });
        expect(item.menu).to.be(menu);
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.menu = null; }).to.throwError();
      });

      it('should default to `null`', () => {
        let item = new MenuItem({});
        expect(item.menu).to.be(null);
      });

    });

    describe('#label', () => {

      it('should get the label of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          label: 'foo'
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.label).to.be('foo');
        disposable.dispose();
      });

      it('should get the title label of a submenu item for a `submenu` type', () => {
        let menu = new Menu();
        menu.title.label = 'foo';
        let item = new MenuItem({ type: 'submenu', menu });
        expect(item.label).to.be('foo');
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.label = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = new MenuItem({});
        expect(item.label).to.be('');
      });

    });

    describe('#mnemonic', () => {

      it('should get the mnemonic index of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          mnemonic: 1
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.mnemonic).to.be(1);
        disposable.dispose();
      });

      it('should get the title mnemonic of a submenu item for a `submenu` type', () => {
        let menu = new Menu();
        menu.title.mnemonic = 1;
        let item = new MenuItem({ type: 'submenu', menu });
        expect(item.mnemonic).to.be(1);
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.mnemonic = 0; }).to.throwError();
      });

      it('should default to `-1`', () => {
        let item = new MenuItem({});
        expect(item.mnemonic).to.be(-1);
      });

    });

    describe('#icon', () => {

      it('should get the icon class of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          icon: 'foo'
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.icon).to.be('foo');
        disposable.dispose();
      });

      it('should get the title icon of a submenu item for a `submenu` type', () => {
        let menu = new Menu();
        menu.title.icon = 'foo';
        let item = new MenuItem({ type: 'submenu', menu });
        expect(item.icon).to.be('foo');
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.icon = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = new MenuItem({});
        expect(item.icon).to.be('');
      });

    });

    describe('#caption', () => {

      it('should get the caption of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          caption: 'foo'
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.caption).to.be('foo');
        disposable.dispose();
      });

      it('should get the title caption of a submenu item for a `submenu` type', () => {
        let menu = new Menu();
        menu.title.caption = 'foo';
        let item = new MenuItem({ type: 'submenu', menu });
        expect(item.caption).to.be('foo');
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.caption = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = new MenuItem({});
        expect(item.caption).to.be('');
      });

    });

    describe('#className', () => {

      it('should get the extra class name of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          className: 'foo'
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.className).to.be('foo');
        disposable.dispose();
      });

      it('should get the title extra class name of a submenu item for a `submenu` type', () => {
        let menu = new Menu();
        menu.title.className = 'foo';
        let item = new MenuItem({ type: 'submenu', menu });
        expect(item.className).to.be('foo');
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.className = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = new MenuItem({});
        expect(item.className).to.be('');
      });

    });

    describe('#isEnabled', () => {

      it('should get whether the command is enabled for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isEnabled: (args: JSONObject) => { return false; },
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.isEnabled).to.be(false);
        disposable.dispose();
      });

      it('should get whether there is a submenu for a `submenu` type', () => {
        let menu = new Menu();
        let item = new MenuItem({ type: 'submenu', menu });
        expect(item.isEnabled).to.be(true);
        item = new MenuItem({ type: 'submenu'});
        expect(item.isEnabled).to.be(false);
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.isEnabled = false; }).to.throwError();
      });

      it('should default to `false` for a command item', () => {
        let item = new MenuItem({});
        expect(item.isEnabled).to.be(false);
      });

      it('should be `true` for a separator item', () => {
        let item = new MenuItem({ type: 'separator' });
        expect(item.isEnabled).to.be(true);
      });

    });

    describe('#isToggled', () => {

      it('should get whether the command is toggled for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isToggled: (args: JSONObject) => { return false; },
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.isToggled).to.be(false);
        disposable.dispose();
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.isToggled = false; }).to.throwError();
      });

      it('should default to `false` for a command item', () => {
        let item = new MenuItem({});
        expect(item.isToggled).to.be(false);
      });

      it('should be `false` for a other item types', () => {
        let item = new MenuItem({ type: 'separator' });
        expect(item.isToggled).to.be(false);
        item = new MenuItem({ type: 'submenu' });
        expect(item.isToggled).to.be(false);
      });

    });

    describe('#isVisible', () => {

      it('should get whether the command is visible for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isVisible: (args: JSONObject) => { return false; },
        });
        let item = new MenuItem({ command: 'test' });
        expect(item.isVisible).to.be(false);
        disposable.dispose();
      });

      it('should get whether there is a submenu for a `submenu` type', () => {
        let menu = new Menu();
        let item = new MenuItem({ type: 'submenu', menu });
        expect(item.isVisible).to.be(true);
        item = new MenuItem({ type: 'submenu'});
        expect(item.isVisible).to.be(false);
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.isVisible = false; }).to.throwError();
      });

      it('should default to `false` for a command item', () => {
        let item = new MenuItem({});
        expect(item.isVisible).to.be(false);
      });

      it('should be `true` for a separator item', () => {
        let item = new MenuItem({ type: 'separator' });
        expect(item.isVisible).to.be(true);
      });

    });

    describe('#keyBinding', () => {

      it('should get the key binding for the menu item', () => {
        let binding = {
          keys: ['A'],
          selector: '*',
          command: 'test'
        };
        let disposable = keymap.addBinding(binding);
        let item = new MenuItem({ command: 'test' });
        expect(item.keyBinding.keys).to.eql(['A']);
        disposable.dispose();
      });

      it('should be read-only', () => {
        let item = new MenuItem({});
        expect(() => { item.keyBinding = null; }).to.throwError();
      });

      it('should default to `null`', () => {
        let item = new MenuItem({ command: 'test' });
        expect(item.keyBinding).to.be(null);
        item = new MenuItem({ type: 'separator' });
        expect(item.keyBinding).to.be(null);
        item = new MenuItem({ type: 'submenu' });
        expect(item.keyBinding).to.be(null);
      });

    });

  });

});
