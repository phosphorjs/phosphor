/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  simulate
} from 'simulate-event';

import {
  toArray
} from '../../../lib/algorithm/iteration';

import {
  JSONObject
} from '../../../lib/algorithm/json';

import {
  DisposableSet
} from '../../../lib/core/disposable';

import {
  Message
} from '../../../lib/core/messaging';

import {
  CommandRegistry, commands
} from '../../../lib/ui/commands';

import {
  KeymapManager, keymap
} from '../../../lib/ui/keymap';

import {
  Menu
} from '../../../lib/ui/menu';

import {
  Widget
} from '../../../lib/ui/widget';


class LogMenu extends Menu {

  events: string[] = [];

  methods: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.methods.push('onCloseRequest');
  }
}


describe('ui/menu', () => {

  const DEFAULT_CMD = 'menu.spec.ts:defaultCmd';

  const disposables = new DisposableSet();

  before(() => {
    let cmd = commands.addCommand(DEFAULT_CMD, {
      execute: (args: JSONObject) => { return args; },
      label: 'LABEL',
      icon: 'foo',
      className: 'bar',
      isToggled: (args: JSONObject) => { return true; },
      mnemonic: 1
    });
    let kbd = keymap.addBinding({
      keys: ['A'],
      selector: '*',
      command: DEFAULT_CMD
    });
    disposables.add(cmd);
    disposables.add(kbd);
  });

  after(() => {
    disposables.dispose();
  });

  describe('IMenuItem', () => {

    let menu: Menu;

    beforeEach(() => {
      menu = new Menu();
    });

    describe('#type', () => {

      it('should get the type of the menu item', () => {
        let item = menu.addItem({ type: 'separator' });
        expect(item.type).to.be('separator');
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.type = 'separator'; }).to.throwError();
      });

      it("should default to `'command'`", () => {
        let item = menu.addItem({});
        expect(item.type).to.be('command');
      });

    });

    describe('#command', () => {

      it('should get the command to execute when the item is triggered', () => {
        let item = menu.addItem({ command: 'foo' });
        expect(item.command).to.be('foo');
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.command = 'bar'; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = menu.addItem({});
        expect(item.command).to.be('');
      });

    });

    describe('#args', () => {

      it('should get the arguments for the command', () => {
        let item = menu.addItem({ args: { foo: 1 } });
        expect(item.args).to.eql({ foo: 1 });
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.args = null; }).to.throwError();
      });

      it('should default to `null`', () => {
        let item = menu.addItem({});
        expect(item.args).to.be(null);
      });

    });

    describe('#menu', () => {

      it('should get the menu for the item', () => {
        let submenu = new Menu();
        let item = menu.addItem({ menu: submenu });
        expect(item.menu).to.be(submenu);
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.menu = null; }).to.throwError();
      });

      it('should default to `null`', () => {
        let item = menu.addItem({});
        expect(item.menu).to.be(null);
      });

    });

    describe('#label', () => {

      it('should get the label of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          label: 'foo'
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.label).to.be('foo');
        disposable.dispose();
      });

      it('should get the title label of a submenu item for a `submenu` type', () => {
        let submenu = new Menu();
        submenu.title.label = 'foo';
        let item = menu.addItem({ type: 'submenu', menu: submenu });
        expect(item.label).to.be('foo');
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.label = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = menu.addItem({});
        expect(item.label).to.be('');

        item = menu.addItem({ type: 'separator' });
        expect(item.label).to.be('');
      });

    });

    describe('#mnemonic', () => {

      it('should get the mnemonic index of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          mnemonic: 1
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.mnemonic).to.be(1);
        disposable.dispose();
      });

      it('should get the title mnemonic of a submenu item for a `submenu` type', () => {
        let submenu = new Menu();
        submenu.title.mnemonic = 1;
        let item = menu.addItem({ type: 'submenu', menu: submenu });
        expect(item.mnemonic).to.be(1);
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.mnemonic = 0; }).to.throwError();
      });

      it('should default to `-1`', () => {
        let item = menu.addItem({});
        expect(item.mnemonic).to.be(-1);

        item = menu.addItem({ type: 'separator' });
        expect(item.mnemonic).to.be(-1);
      });

    });

    describe('#icon', () => {

      it('should get the icon class of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          icon: 'foo'
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.icon).to.be('foo');
        disposable.dispose();
      });

      it('should get the title icon of a submenu item for a `submenu` type', () => {
        let submenu = new Menu();
        submenu.title.icon = 'foo';
        let item = menu.addItem({ type: 'submenu', menu: submenu });
        expect(item.icon).to.be('foo');
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.icon = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = menu.addItem({});
        expect(item.icon).to.be('');

        item = menu.addItem({ type: 'separator' });
        expect(item.icon).to.be('');
      });

    });

    describe('#caption', () => {

      it('should get the caption of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          caption: 'foo'
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.caption).to.be('foo');
        disposable.dispose();
      });

      it('should get the title caption of a submenu item for a `submenu` type', () => {
        let submenu = new Menu();
        submenu.title.caption = 'foo';
        let item = menu.addItem({ type: 'submenu', menu: submenu });
        expect(item.caption).to.be('foo');
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.caption = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = menu.addItem({});
        expect(item.caption).to.be('');

        item = menu.addItem({ type: 'separator' });
        expect(item.caption).to.be('');
      });

    });

    describe('#className', () => {

      it('should get the extra class name of a command item for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          className: 'foo'
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.className).to.be('foo');
        disposable.dispose();
      });

      it('should get the title extra class name of a submenu item for a `submenu` type', () => {
        let submenu = new Menu();
        submenu.title.className = 'foo';
        let item = menu.addItem({ type: 'submenu', menu: submenu });
        expect(item.className).to.be('foo');
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.className = ''; }).to.throwError();
      });

      it('should default to an empty string', () => {
        let item = menu.addItem({});
        expect(item.className).to.be('');

        item = menu.addItem({ type: 'separator' });
        expect(item.className).to.be('');
      });

    });

    describe('#isEnabled', () => {

      it('should get whether the command is enabled for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isEnabled: (args: JSONObject) => { return false; },
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.isEnabled).to.be(false);
        disposable.dispose();
      });

      it('should get whether there is a submenu for a `submenu` type', () => {
        let submenu = new Menu();
        let item = menu.addItem({ type: 'submenu', menu: submenu });
        expect(item.isEnabled).to.be(true);
        item = menu.addItem({ type: 'submenu'});
        expect(item.isEnabled).to.be(false);
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.isEnabled = false; }).to.throwError();
      });

      it('should default to `false` for a command item', () => {
        let item = menu.addItem({});
        expect(item.isEnabled).to.be(false);
      });

      it('should be `true` for a separator item', () => {
        let item = menu.addItem({ type: 'separator' });
        expect(item.isEnabled).to.be(true);
      });

    });

    describe('#isToggled', () => {

      it('should get whether the command is toggled for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isToggled: (args: JSONObject) => { return false; },
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.isToggled).to.be(false);
        disposable.dispose();
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.isToggled = false; }).to.throwError();
      });

      it('should default to `false` for a command item', () => {
        let item = menu.addItem({});
        expect(item.isToggled).to.be(false);
      });

      it('should be `false` for other item types', () => {
        let item = menu.addItem({ type: 'separator' });
        expect(item.isToggled).to.be(false);
        item = menu.addItem({ type: 'submenu' });
        expect(item.isToggled).to.be(false);
      });

    });

    describe('#isVisible', () => {

      it('should get whether the command is visible for a `command` type', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isVisible: (args: JSONObject) => { return false; },
        });
        let item = menu.addItem({ command: 'test' });
        expect(item.isVisible).to.be(false);
        disposable.dispose();
      });

      it('should get whether there is a submenu for a `submenu` type', () => {
        let submenu = new Menu();
        let item = menu.addItem({ type: 'submenu', menu: submenu });
        expect(item.isVisible).to.be(true);
        item = menu.addItem({ type: 'submenu'});
        expect(item.isVisible).to.be(false);
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.isVisible = false; }).to.throwError();
      });

      it('should default to `false` for a command item', () => {
        let item = menu.addItem({});
        expect(item.isVisible).to.be(false);
      });

      it('should be `true` for a separator item', () => {
        let item = menu.addItem({ type: 'separator' });
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
        let item = menu.addItem({ command: 'test' });
        expect(item.keyBinding.keys).to.eql(['A']);
        disposable.dispose();
      });

      it('should be read-only', () => {
        let item = menu.addItem({});
        expect(() => { item.keyBinding = null; }).to.throwError();
      });

      it('should default to `null`', () => {
        let item = menu.addItem({ command: 'test' });
        expect(item.keyBinding).to.be(null);
        item = menu.addItem({ type: 'separator' });
        expect(item.keyBinding).to.be(null);
        item = menu.addItem({ type: 'submenu' });
        expect(item.keyBinding).to.be(null);
      });

    });

  });

  describe('Menu', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let menu = new Menu();
        expect(menu).to.be.a(Menu);
      });

      it('should take options for initializing the menu', () => {
        let renderer = new Menu.Renderer();
        let menu = new Menu({
          renderer,
          commandRegistry: new CommandRegistry(),
          keymapManager: new KeymapManager()
        });
        expect(menu).to.be.a(Menu);
      });

      it('should add the `p-Menu` class', () => {
        let menu = new Menu();
        expect(menu.hasClass('p-Menu')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the menu', () => {
        let menu = new Menu();
        menu.addItem({});
        menu.dispose();
        expect(toArray(menu.items)).to.eql([]);
        expect(menu.isDisposed).to.be(true);
      });

    });

    describe('#aboutToClose', () => {

      it('should be emitted just before the menu is closed', () => {
        let called = false;
        let menu = new Menu();
        Widget.attach(menu, document.body);
        menu.aboutToClose.connect((sender, args) => {
          expect(sender).to.be(menu);
          expect(args).to.be(void 0);
          expect(menu.isAttached).to.be(true);
          called = true;
        });
        menu.close();
        expect(called).to.be(true);
        menu.dispose();
      });

      it('should not be emitted if the menu is not attached', () => {
        let called = false;
        let menu = new Menu();
        Widget.attach(menu, document.body);
        menu.aboutToClose.connect(() => { called = true; });
        Widget.detach(menu);
        menu.close();
        expect(called).to.be(false);
      });

    });

    describe('menuRequested', () => {

      it('should be emitted when a left arrow key is pressed and a submenu cannot be opened or closed', () => {
        let menu = new Menu();
        let called = false;
        Widget.attach(menu, document.body);
        menu.menuRequested.connect((sender, args) => {
          expect(sender).to.be(menu);
          expect(args).to.be('previous');
          called = true;
        });
        simulate(menu.node, 'keydown', { keyCode: 37 });
        expect(called).to.be(true);
        menu.dispose();
      });

      it('should be emitted when a right arrow key is pressed and a submenu cannot be opened or closed', () => {
        let menu = new Menu();
        Widget.attach(menu, document.body);
        let called = false;
        menu.menuRequested.connect((sender, args) => {
          expect(sender).to.be(menu);
          expect(args).to.be('next');
          called = true;
        });
        simulate(menu.node, 'keydown', { keyCode: 39 });
        expect(called).to.be(true);
        menu.dispose();
      });

      it('should only be emitted for the root menu in a hierarchy', () => {
        let sub = new Menu();
        let menu = new Menu();
        let item = menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        menu.activeItem = item;
        menu.triggerActiveItem();
        let called = false;
        let subCalled = false;
        menu.menuRequested.connect((sender, args) => {
          expect(sender).to.be(menu);
          expect(args).to.be('next');
          called = true;
        });
        sub.menuRequested.connect(() => { subCalled = true; });
        simulate(sub.node, 'keydown', { keyCode: 39 });
        expect(called).to.be(true);
        expect(subCalled).to.be(false);
        menu.dispose();
      });

    });

    describe('#parentMenu', () => {

      it('should get the parent menu of the menu', () => {
        let sub = new Menu();
        let menu = new Menu();
        let item = menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        menu.activeItem = item;
        menu.triggerActiveItem();
        expect(sub.parentMenu).to.be(menu);
        menu.dispose();
      });

      it('should be `null` if the menu is not an open submenu', () => {
        let sub = new Menu();
        let menu = new Menu();
        menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        expect(sub.parentMenu).to.be(null);
        expect(menu.parentMenu).to.be(null);
        menu.dispose();
      });

      it('should be read-only', () => {
        let menu = new Menu();
        expect(() => { menu.parentMenu = null; }).to.throwError();
      });

    });

    describe('#childMenu', () => {

      it('should get the child menu of the menu', () => {
        let sub = new Menu();
        let menu = new Menu();
        let item = menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        menu.activeItem = item;
        menu.triggerActiveItem();
        expect(menu.childMenu).to.be(sub);
        menu.dispose();
      });

      it('should be `null` if the menu does not have an open submenu', () => {
        let sub = new Menu();
        let menu = new Menu();
        menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        expect(menu.childMenu).to.be(null);
        menu.dispose();
      });

      it('should be read-only', () => {
        let menu = new Menu();
        expect(() => { menu.childMenu = null; }).to.throwError();
      });

    });

    describe('#rootMenu', () => {

      it('should get the root menu of the menu hierarchy', () => {
        let subSub = new Menu();
        let sub = new Menu();
        let subItem =  sub.addItem({ type: 'submenu', menu: subSub });
        let menu = new Menu();
        let item = menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        menu.activeItem = item;
        menu.triggerActiveItem();
        sub.activeItem = subItem;
        sub.triggerActiveItem();
        expect(subSub.rootMenu).to.be(menu);
        menu.dispose();
      });

      it('should be itself if the menu is not an open submenu', () => {
        let subSub = new Menu();
        let sub = new Menu();
        sub.addItem({ type: 'submenu', menu: subSub });
        let menu = new Menu();
        menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        expect(sub.rootMenu).to.be(sub);
        expect(subSub.rootMenu).to.be(subSub);
        menu.dispose();
      });

      it('should be read-only', () => {
        let menu = new Menu();
        expect(() => { menu.rootMenu = null; }).to.throwError();
      });

    });

    describe('#leafMenu', () => {

      it('should get the leaf menu of the menu hierarchy', () => {
        let subSub = new Menu();
        let sub = new Menu();
        let subItem = sub.addItem({ type: 'submenu', menu: subSub });
        let menu = new Menu();
        let item = menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        menu.activeItem = item;
        menu.triggerActiveItem();
        sub.activeItem = subItem;
        sub.triggerActiveItem();
        expect(menu.leafMenu).to.be(subSub);
        menu.dispose();
      });

      it('should be itself if the menu does not have an open submenu', () => {
        let subSub = new Menu();
        let sub = new Menu();
        sub.addItem({ type: 'submenu', menu: subSub });
        let menu = new Menu();
        menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        expect(menu.leafMenu).to.be(menu);
        expect(sub.leafMenu).to.be(sub);
        menu.dispose();
      });

      it('should be read-only', () => {
        let menu = new Menu();
        expect(() => { menu.leafMenu = null; }).to.throwError();
      });

    });

    describe('#contentNode', () => {

      it('should get the menu content node', () => {
        let menu = new Menu();
        let content = menu.contentNode;
        expect(content.classList.contains('p-Menu-content')).to.be(true);
      });

      it('should be read-only', () => {
        let menu = new Menu();
        expect(() => { menu.contentNode = null; }).to.throwError();
      });

    });

    describe('#renderer', () => {

      it('should get the renderer for the menu', () => {
        let renderer = Object.create(Menu.defaultRenderer);
        let menu = new Menu({ renderer });
        expect(menu.renderer).to.be(renderer);
      });

      it('should be read-only', () => {
        let menu = new Menu();
        expect(() => { menu.renderer = null; }).to.throwError();
      });

    });

    describe('#items', () => {

      it('should get a read-only sequence of the menu items in the menu', () => {
        let menu = new Menu();
        menu.addItem({ command: 'foo' });
        menu.addItem({ command: 'bar' });
        let items = menu.items;
        expect(items.length).to.be(2);
        expect(items.at(0).command).to.be('foo');
        expect(items.at(1).command).to.be('bar');
      });

      it('should be read-only', () => {
        let menu = new Menu();
        expect(() => { menu.items = null; }).to.throwError();
      });

    });

    describe('#activeItem', () => {

      it('should get the currently active menu item', () => {
        let menu = new Menu();
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.activeIndex = 0;
        expect(menu.activeItem).to.be(item);
      });

      it('should be `null` if no menu item is active', () => {
        let menu = new Menu();
        expect(menu.activeItem).to.be(null);
        menu.addItem({ command: DEFAULT_CMD });
        expect(menu.activeItem).to.be(null);
      });

      it('should set the currently active menu item', () => {
        let menu = new Menu();
        expect(menu.activeItem).to.be(null);
        let item = menu.addItem({ command: DEFAULT_CMD});
        menu.activeItem = item;
        expect(menu.activeItem).to.be(item);
      });

      it('should set to `null` if the item cannot be activated', () => {
        let menu = new Menu();
        expect(menu.activeItem).to.be(null);
        let item = menu.addItem({ type: 'separator' });
        menu.activeItem = item;
        expect(menu.activeItem).to.be(null);
      });

    });

    describe('#activeIndex', () => {

      it('should get the index of the currently active menu item', () => {
        let menu = new Menu();
        let item =  menu.addItem({ command: DEFAULT_CMD });
        menu.activeItem = item;
        expect(menu.activeIndex).to.be(0);
      });

      it('should add `p-mod-active` to the item', () => {
        let menu = new Menu();
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.activeItem = item;
        let tab = menu.contentNode.children[0] as HTMLElement;
        expect(tab.classList.contains('p-mod-active')).to.be(true);
      });

      it('should be `-1` if no menu item is active', () => {
        let menu = new Menu();
        expect(menu.activeIndex).to.be(-1);
        menu.addItem({ command: DEFAULT_CMD });
        expect(menu.activeIndex).to.be(-1);
      });

      it('should set the currently active menu item index', () => {
        let menu = new Menu();
        expect(menu.activeIndex).to.be(-1);
        menu.addItem({ command: DEFAULT_CMD });
        menu.activeIndex = 0;
        expect(menu.activeIndex).to.be(0);
      });

      it('should set to `-1` if the item cannot be activated', () => {
        let menu = new Menu();
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isEnabled: (args: JSONObject) => { return false; },
        });
        menu.addItem({ command: 'test' });
        menu.activeIndex = 0;
        expect(menu.activeIndex).to.be(-1);
        disposable.dispose();
      });

    });

    describe('#activateNextItem()', () => {

      it('should activate the next selectable item in the menu', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isVisible: (args: JSONObject) => { return false; },
        });
        let menu = new Menu();
        menu.addItem({ command: 'test' });
        menu.addItem({ command: DEFAULT_CMD });
        menu.activateNextItem();
        expect(menu.activeIndex).to.be(1);
        disposable.dispose();
      });

      it('should set the index to `-1` if no item is selectable', () => {
        let menu = new Menu();
        menu.addItem({ type: 'separator' });
        menu.addItem({ type: 'separator' });
        menu.activateNextItem();
        expect(menu.activeIndex).to.be(-1);
      });

    });

    describe('#activatePreviousItem()', () => {

      it('should activate the next selectable item in the menu', () => {
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { return args; },
          isVisible: (args: JSONObject) => { return false; },
        });
        let menu = new Menu();
        menu.addItem({ command: 'test' });
        menu.addItem({ command: DEFAULT_CMD });
        menu.activatePreviousItem();
        expect(menu.activeIndex).to.be(1);
        disposable.dispose();
      });

      it('should set the index to `-1` if no item is selectable', () => {
        let menu = new Menu();
        menu.addItem({ type: 'separator' });
        menu.addItem({ type: 'separator' });
        menu.activatePreviousItem();
        expect(menu.activeIndex).to.be(-1);
      });

    });

    describe('#triggerActiveItem()', () => {

      it('should execute a command if it is the active item', () => {
        let called = false;
        let disposable = commands.addCommand('test', {
          execute: (args: JSONObject) => { called = true; }
        });
        let menu = new Menu();
        menu.addItem({ command: 'test' });
        Widget.attach(menu, document.body);
        menu.activeIndex = 0;
        menu.triggerActiveItem();
        expect(called).to.be(true);
        disposable.dispose();
        menu.dispose();
      });

      it('should open a submenu and activate the first item', () => {
        let sub = new Menu();
        sub.addItem({ command: DEFAULT_CMD });
        let menu = new Menu();
        menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        menu.activeIndex = 0;
        menu.triggerActiveItem();
        expect(sub.parentMenu).to.be(menu);
        expect(sub.activeIndex).to.be(0);
        menu.dispose();
      });

      it('should be a no-op if the menu is not attached', () => {
        let sub = new Menu();
        sub.addItem({ command: DEFAULT_CMD });
        let menu = new Menu();
        menu.addItem({ type: 'submenu', menu: sub });
        menu.activeIndex = 0;
        menu.triggerActiveItem();
        expect(sub.parentMenu).to.be(null);
        expect(sub.activeIndex).to.be(-1);
      });

      it('should be a no-op if there is no active item', () => {
        let sub = new Menu();
        sub.addItem({ command: DEFAULT_CMD });
        let menu = new Menu();
        menu.addItem({ type: 'submenu', menu: sub });
        Widget.attach(menu, document.body);
        menu.triggerActiveItem();
        expect(sub.parentMenu).to.be(null);
        expect(sub.activeIndex).to.be(-1);
        menu.dispose();
      });

    });

    describe('#addItem()', () => {

      it('should add a menu item to the end of the menu', () => {
        let menu = new Menu();
        menu.addItem({});
        let item = menu.addItem({ command: 'test'});
        expect(item.command).to.be('test');
        expect(menu.items.at(1)).to.be(item);
      });

      it('should accept an existing menu item and convert them into a new menu item', () => {
        let menu = new Menu();
        let item = menu.addItem({ command: 'test' });
        let newItem = menu.addItem(item);
        expect(newItem).to.not.be(item);
        expect(newItem.command).to.be('test');
      });

    });

    describe('#insertItem()', () => {

      it('should insert a menu item into the menu at the specified index', () => {
        let menu = new Menu();
        menu.addItem({});
        let item = menu.insertItem(0, { command: 'test' });
        expect(menu.items.at(0)).to.be(item);
      });

      it('should accept an options object to be converted into a menu item', () => {
        let menu = new Menu();
        let item = menu.insertItem(0, {});
      });

      it('should clamp the index to the bounds of the items', () => {
        let menu = new Menu();
        menu.addItem({});
        let item = menu.insertItem(2, {});
        expect(menu.items.at(1)).to.be(item);
        item = menu.insertItem(-1, {});
        expect(menu.items.at(0)).to.be(item);
      });

      it('should close the menu if attached', () => {
        let menu = new Menu();
        menu.open(0, 0);
        let called = false;
        menu.aboutToClose.connect(() => { called = true; });
        menu.insertItem(0, {});
        expect(called).to.be(true);
        menu.dispose();
      });

    });

    describe('#removeItem()', () => {

      it('should remove a menu item from the menu by value', () => {
        let menu = new Menu();
        let item = menu.addItem({});
        menu.removeItem(item);
        expect(menu.items.length).to.be(0);
      });

      it('should remove a menu item from the menu by index', () => {
        let menu = new Menu();
        menu.addItem({});
        let item = menu.addItem({});
        menu.removeItem(0);
        expect(menu.items.length).to.be(1);
        expect(menu.items.at(0)).to.be(item);
      });

      it('should be a no-op if the item is not contained in the menu', () => {
        let menu = new Menu();
        menu.addItem({});
        let item = menu.addItem({});
        menu.removeItem(item);
        expect(menu.items.length).to.be(1);

        menu.removeItem(1);
        expect(menu.items.length).to.be(1);

        menu.removeItem(-1);
        expect(menu.items.length).to.be(1);
      });

      it('should close the menu if it is attached', () => {
        let menu = new Menu();
        let item = menu.addItem({});
        menu.open(0, 0);
        let called = false;
        menu.aboutToClose.connect(() => { called = true; });
        menu.removeItem(item);
        expect(called).to.be(true);
        menu.dispose();
      });

    });

    describe('#clearItems()', () => {

      it('should remove all items from the menu', () => {
        let menu = new Menu();
        let disposable0 = commands.addCommand('test0', {
          execute: (args: JSONObject) => { return args; }
        });
        let disposable1 = commands.addCommand('test1', {
          execute: (args: JSONObject) => { return args; }
        });
        menu.addItem({ command: 'test0' });
        menu.addItem({ command: 'test1' });
        menu.activeIndex = 1;
        menu.clearItems();
        expect(menu.items.length).to.be(0);
        expect(menu.activeIndex).to.be(-1);
        disposable0.dispose();
        disposable1.dispose();
      });

      it('should close the menu if it is attached', () => {
        let menu = new Menu();
        let called = false;
        menu.aboutToClose.connect(() => { called = true; });
        Widget.attach(menu, document.body);
        menu.clearItems();
        expect(called).to.be(true);
        menu.dispose();
      });

    });

    describe('#open()', () => {

      it('should open the menu at the specified location', () => {
        let menu = new Menu();
        menu.addItem({ command: DEFAULT_CMD });
        menu.open(10, 10);
        expect(menu.node.style.left).to.be('10px');
        expect(menu.node.style.top).to.be('10px');
        menu.dispose();
      });

      it('should be adjusted to fit naturally on the screen', () => {
        let menu = new Menu();
        menu.addItem({ command: DEFAULT_CMD });
        menu.open(-10, 10000);
        expect(menu.node.style.left).to.be('0px');
        expect(menu.node.style.top).to.not.be('10000px');
        menu.dispose();
      });

      it('should accept flags to force the location', () => {
        let menu = new Menu();
        menu.addItem({ command: DEFAULT_CMD });
        menu.open(10000, 10000, { forceX: true, forceY: true });
        expect(menu.node.style.left).to.be('10000px');
        expect(menu.node.style.top).to.be('10000px');
        menu.dispose();
      });

      it('should bail if already attached', () => {
        let menu = new Menu();
        menu.addItem({ command: DEFAULT_CMD });
        menu.open(10, 10);
        menu.open(100, 100);
        expect(menu.node.style.left).to.be('10px');
        expect(menu.node.style.top).to.be('10px');
        menu.dispose();
      });

      context('separators', () => {

        it('should hide leading separators', () => {
          let menu = new Menu();
          menu.addItem({ type: 'separator' });
          menu.addItem({ command: DEFAULT_CMD });
          menu.addItem({ type: 'separator' });
          menu.addItem({ type: 'submenu', menu: new Menu() });
          menu.open(0, 0);
          let seps = menu.node.getElementsByClassName('p-type-separator');
          expect(seps.length).to.be(2);
          expect(seps[0].classList.contains('p-mod-hidden')).to.be(true);
          expect(seps[1].classList.contains('p-mod-hidden')).to.be(false);
          menu.dispose();
        });

        it('should hide trailing separators', () => {
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          menu.addItem({ type: 'separator' });
          menu.addItem({ type: 'submenu', menu: new Menu() });
          menu.addItem({ type: 'separator' });
          menu.open(0, 0);
          let seps = menu.node.getElementsByClassName('p-type-separator');
          expect(seps.length).to.be(2);
          expect(seps[0].classList.contains('p-mod-hidden')).to.be(false);
          expect(seps[1].classList.contains('p-mod-hidden')).to.be(true);
          menu.dispose();
        });

        it('should hide consecutive separators', () => {
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          menu.addItem({ type: 'separator' });
          menu.addItem({ type: 'separator' });
          menu.addItem({ type: 'submenu', menu: new Menu() });
          menu.open(0, 0);
          let seps = menu.node.getElementsByClassName('p-type-separator');
          expect(seps.length).to.be(2);
          expect(seps[0].classList.contains('p-mod-hidden')).to.be(false);
          expect(seps[1].classList.contains('p-mod-hidden')).to.be(true);
          menu.dispose();
        });

      });

    });

    describe('#handleEvent()', () => {

      context('keydown', () => {

        it('should trigger the active item on enter', () => {
          let called = false;
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { called = true; }
          });
          let menu = new Menu();
          menu.addItem({ command: 'test' });
          menu.activeIndex = 0;
          menu.open(0, 0);
          simulate(menu.node, 'keydown', { keyCode: 13 });
          expect(called).to.be(true);
          menu.dispose();
          disposable.dispose();
        });

        it('should close the menu on escape', () => {
          let menu = new Menu();
          let called = false;
          menu.aboutToClose.connect(() => { called = true; });
          menu.open(0, 0);
          simulate(menu.node, 'keydown', { keyCode: 27 });
          expect(called).to.be(true);
          menu.dispose();
        });

        it('should close the menu on left arrow if there is a parent menu', () => {
          let sub = new Menu();
          let called = false;
          sub.addItem({ command: DEFAULT_CMD });
          let menu = new Menu();
          menu.addItem({ type: 'submenu', menu: sub });
          menu.open(0, 0);
          menu.activateNextItem();
          menu.triggerActiveItem();
          sub.aboutToClose.connect(() => { called = true; });
          simulate(sub.node, 'keydown', { keyCode: 37 });
          expect(called).to.be(true);
          menu.dispose();
        });

        it('should activate the previous item on up arrow', () => {
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { return args; }
          });
          menu.addItem({ command: 'test' });
          menu.open(0, 0);
          simulate(menu.node, 'keydown', { keyCode: 38 });
          expect(menu.activeIndex).to.be(1);
          menu.dispose();
          disposable.dispose();
        });

        it('should trigger the active item on right arrow if the item is a submenu', () => {
          let sub = new Menu();
          sub.addItem({ command: DEFAULT_CMD });
          let menu = new Menu();
          menu.addItem({ type: 'submenu', menu: sub });
          menu.open(0, 0);
          menu.activateNextItem();
          simulate(menu.node, 'keydown', { keyCode: 39 });
          expect(menu.childMenu).to.be(sub);
          menu.dispose();
        });

        it('should activate the next itom on down arrow', () => {
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { return args; }
          });
          menu.addItem({ command: 'test' });
          menu.open(0, 0);
          simulate(menu.node, 'keydown', { keyCode: 40 });
          expect(menu.activeIndex).to.be(0);
          menu.dispose();
          disposable.dispose();
        });

        it('should activate the first matching mnemonic', () => {
          let sub0 = new Menu();
          sub0.title.label = 'foo';
          sub0.title.mnemonic = 0;
          let disposable0 = commands.addCommand('test0', {
            execute: (args: JSONObject) => { return args; }
          });
          sub0.addItem({ command: 'test0' });

          let sub1 = new Menu();
          sub1.title.label = 'oof';
          sub1.title.mnemonic = 2;
          let disposable1 = commands.addCommand('test1', {
            execute: (args: JSONObject) => { return args; }
          });
          sub1.addItem({ command: 'test1' });

          let menu = new Menu();
          menu.addItem({ type: 'submenu', menu: sub0 });
          menu.addItem({ type: 'separator' });
          menu.addItem({ type: 'submenu', menu: sub1 });
          menu.addItem({ type: 'submenu', menu: new Menu() });

          menu.open(0, 0);
          simulate(menu.node, 'keydown', { keyCode: 70 });
          expect(menu.activeIndex).to.be(0);

          menu.dispose();
          disposable0.dispose();
          disposable1.dispose();
        });

        it('should trigger a lone matching mnemonic', () => {
          let menu = new Menu();
          let called = false;
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { called = true; },
            label: 'foo',
            mnemonic: 1
          });
          menu.addItem({ command: 'test' });

          menu.open(0, 0);
          simulate(menu.node, 'keydown', { keyCode: 79 });  // O
          expect(called).to.be(true);

          menu.dispose();
          disposable.dispose();
        });

        it('should activate an item with no matching mnemonic, but matching first character', () => {
          let menu = new Menu();
          let called = false;
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { called = true; },
            label: 'foo'
          });
          menu.addItem({ command: 'test' });

          menu.open(0, 0);
          simulate(menu.node, 'keydown', { keyCode: 70 });  // F
          expect(menu.activeIndex).to.be(0);
          expect(called).to.be(false);

          menu.dispose();
          disposable.dispose();
        });

      });

      context('mouseup', () => {

        it('should trigger the active item', () => {
          let menu = new Menu();
          let called = false;
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { called = true; },
          });
          menu.addItem({ command: 'test' });
          menu.activeIndex = 0;
          menu.open(0, 0);
          simulate(menu.node, 'mouseup');
          expect(called).to.be(true);
          menu.dispose();
          disposable.dispose();
        });

        it('should bail if not a left mouse button', () => {
          let menu = new Menu();
          let called = false;
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { called = true; },
          });
          menu.addItem({ command: 'test' });
          menu.activeIndex = 0;
          menu.open(0, 0);
          simulate(menu.node, 'mouseup', { button: 1 });
          expect(called).to.be(false);
          menu.dispose();
          disposable.dispose();
        });

      });

      context('mousemove', () => {

        it('should set the active index', () => {
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          menu.open(0, 0);
          let node = menu.node.getElementsByClassName('p-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          simulate(menu.node, 'mousemove', { clientX: rect.left, clientY: rect.top });
          expect(menu.activeIndex).to.be(0);
          menu.dispose();
        });

        it('should open a child menu after a timeout', (done) => {
          let sub = new Menu();
          sub.addItem({ command: DEFAULT_CMD });
          sub.title.label = 'LABEL';
          let menu = new Menu();
          menu.addItem({ type: 'submenu', menu: sub });
          menu.open(0, 0);
          let node = menu.node.getElementsByClassName('p-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          simulate(menu.node, 'mousemove', { clientX: rect.left, clientY: rect.top });
          expect(menu.activeIndex).to.be(0);
          expect(sub.isAttached).to.be(false);
          setTimeout(() => {
            expect(sub.isAttached).to.be(true);
            menu.dispose();
            done();
          }, 500);
        });

        it('should close an open sub menu', (done) => {
          let sub = new Menu();
          sub.addItem({ command: DEFAULT_CMD });
          sub.title.label = 'LABEL';
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          menu.addItem({ type: 'submenu', menu: sub });
          menu.open(0, 0);
          menu.activeIndex = 1;
          menu.triggerActiveItem();
          let node = menu.node.getElementsByClassName('p-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          simulate(menu.node, 'mousemove', { clientX: rect.left, clientY: rect.top });
          expect(menu.activeIndex).to.be(0);
          expect(sub.isAttached).to.be(true);
          setTimeout(() => {
            expect(sub.isAttached).to.be(false);
            menu.dispose();
            done();
          }, 500);
        });

      });

      context('mouseleave', () => {

        it('should reset the active index', () => {
          let sub = new Menu();
          sub.addItem({ command: DEFAULT_CMD });
          sub.title.label = 'LABEL';
          let menu = new Menu();
          menu.addItem({ type: 'submenu', menu: sub });
          menu.open(0, 0);
          let node = menu.node.getElementsByClassName('p-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          simulate(menu.node, 'mousemove', { clientX: rect.left, clientY: rect.top });
          expect(menu.activeIndex).to.be(0);
          simulate(menu.node, 'mouseleave', { clientX: rect.left, clientY: rect.top });
          expect(menu.activeIndex).to.be(-1);
          menu.dispose();
        });

      });

      context('mousedown', () => {

        it('should not close the menu if on a child node', () => {
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          menu.open(0, 0);
          let called = false;
          menu.aboutToClose.connect(() => { called = true; });
          let rect = menu.node.getBoundingClientRect();
          simulate(menu.node, 'mousedown', { clientX: rect.left, clientY: rect.top });
          expect(called).to.be(false);
          menu.dispose();
        });

        it('should close the menu if not on a child node', () => {
          let menu = new Menu();
          menu.addItem({ command: DEFAULT_CMD });
          menu.open(0, 0);
          let called = false;
          menu.aboutToClose.connect(() => { called = true; });
          simulate(menu.node, 'mousedown', { clientX: -10 });
          expect(called).to.be(true);
          menu.dispose();
        });

      });

    });

    describe('#onAfterAttach()', () => {

      it('should add event listeners', () => {
        let menu = new LogMenu();
        let node = menu.node;
        Widget.attach(menu, document.body);
        expect(menu.methods.indexOf('onAfterAttach')).to.not.be(-1);
        simulate(node, 'keydown');
        expect(menu.events.indexOf('keydown')).to.not.be(-1);
        simulate(node, 'mouseup');
        expect(menu.events.indexOf('mouseup')).to.not.be(-1);
        simulate(node, 'mousemove');
        expect(menu.events.indexOf('mousemove')).to.not.be(-1);
        simulate(node, 'mouseenter');
        expect(menu.events.indexOf('mouseenter')).to.not.be(-1);
        simulate(node, 'mouseleave');
        expect(menu.events.indexOf('mouseleave')).to.not.be(-1);
        simulate(node, 'contextmenu');
        expect(menu.events.indexOf('contextmenu')).to.not.be(-1);
        simulate(document.body, 'mousedown');
        expect(menu.events.indexOf('mousedown')).to.not.be(-1);
        menu.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should remove event listeners', () => {
        let menu = new LogMenu();
        let node = menu.node;
        Widget.attach(menu, document.body);
        Widget.detach(menu);
        expect(menu.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        simulate(node, 'keydown');
        expect(menu.events.indexOf('keydown')).to.be(-1);
        simulate(node, 'mouseup');
        expect(menu.events.indexOf('mouseup')).to.be(-1);
        simulate(node, 'mousemove');
        expect(menu.events.indexOf('mousemove')).to.be(-1);
        simulate(node, 'mouseenter');
        expect(menu.events.indexOf('mouseenter')).to.be(-1);
        simulate(node, 'mouseleave');
        expect(menu.events.indexOf('mouseleave')).to.be(-1);
        simulate(node, 'contextmenu');
        expect(menu.events.indexOf('contextmenu')).to.be(-1);
        simulate(document.body, 'mousedown');
        expect(menu.events.indexOf('mousedown')).to.be(-1);
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be called prior to opening', () => {
        let menu = new LogMenu();
        menu.open(0, 0);
        expect(menu.methods.indexOf('onUpdateRequest')).to.not.be(-1);
        menu.dispose();
      });

    });

    describe('#onCloseRequest()', () => {

      it('should be called when the menu is closed', () => {
        let menu = new LogMenu();
        menu.open(0, 0);
        menu.close();
        expect(menu.methods.indexOf('onCloseRequest')).to.not.be(-1);
        menu.dispose();
      });

      it('should reset the active index', () => {
        let menu = new LogMenu();
        menu.addItem({ command: DEFAULT_CMD });
        menu.activeIndex = 0;
        menu.open(0, 0);
        menu.close();
        expect(menu.methods.indexOf('onCloseRequest')).to.not.be(-1);
        expect(menu.activeIndex).to.be(-1);
        menu.dispose();
      });

      it('should close any open child menu', () => {
        let sub = new Menu();
        sub.addItem({ command: DEFAULT_CMD });
        let menu = new LogMenu();
        menu.addItem({ type: 'submenu', menu: sub });
        menu.open(0, 0);
        menu.activateNextItem();
        menu.triggerActiveItem();
        expect(menu.childMenu).to.be(sub);
        menu.close();
        expect(menu.methods.indexOf('onCloseRequest')).to.not.be(-1);
        expect(menu.childMenu).to.be(null);
        menu.dispose();
      });

      it('should remove the menu from its parent and activate the parent', (done) => {
        let sub = new LogMenu();
        sub.addItem({ command: DEFAULT_CMD });
        let menu = new LogMenu();
        menu.addItem({ type: 'submenu', menu: sub });
        menu.open(0, 0);
        menu.activateNextItem();
        menu.triggerActiveItem();
        expect(menu.childMenu).to.be(sub);
        sub.close();
        expect(sub.methods.indexOf('onCloseRequest')).to.not.be(-1);
        expect(menu.childMenu).to.be(null);
        requestAnimationFrame(() => {
          expect(document.activeElement).to.be(menu.node);
          menu.dispose();
          done();
        });
      });

      it('should emit the `aboutToClose` signal if attached', () => {
        let menu = new LogMenu();
        let called = false;
        menu.open(0, 0);
        menu.aboutToClose.connect((sender, args) => {
          expect(sender).to.be(menu);
          expect(args).to.be(void 0);
          called = true;
        });
        menu.close();
        expect(menu.methods.indexOf('onCloseRequest')).to.not.be(-1);
        expect(called).to.be(true);
        menu.dispose();
      });

    });

    describe('.Renderer', () => {

      describe('#createItemNode()', () => {

        it('should create a node for a menu item', () => {
          let renderer = new Menu.Renderer();
          let node = renderer.createItemNode();
          expect(node.classList.contains('p-Menu-item')).to.be(true);
          expect(node.getElementsByClassName('p-Menu-itemIcon').length).to.be(1);
          expect(node.getElementsByClassName('p-Menu-itemLabel').length).to.be(1);
          expect(node.getElementsByClassName('p-Menu-itemShortcut').length).to.be(1);
          expect(node.getElementsByClassName('p-Menu-itemSubmenuIcon').length).to.be(1);
        });

      });

      describe('#updateItemNode()', () => {

        it('should update an item node to reflect the state of a menu item', () => {
          let renderer = new Menu.Renderer();
          let node = renderer.createItemNode();
          let menu = new Menu();
          let item = menu.addItem({ command: DEFAULT_CMD });
          renderer.updateItemNode(node, item);
          expect(node.classList.contains('p-type-command')).to.be(true);
          expect(node.classList.contains(item.className)).to.be(true);
          expect(node.classList.contains('p-mod-toggled')).to.be(true);
          let icon = node.getElementsByClassName('p-Menu-itemIcon')[0];
          expect(icon.classList.contains(item.icon)).to.be(true);
          let label = node.getElementsByClassName('p-Menu-itemLabel')[0];
          let labelText = renderer.formatLabel(item.label, item.mnemonic);
          expect((label as HTMLElement).innerHTML).to.be(labelText);
          let shortcutText = renderer.formatShortcut(item.keyBinding);
          let shortcut = node.getElementsByClassName('p-Menu-itemShortcut')[0];
          expect((shortcut as HTMLElement).textContent).to.be(shortcutText);
        });

        it('should handle submenu items', () => {
          let renderer = new Menu.Renderer();
          let node = renderer.createItemNode();
          let menu = new Menu();
          let item = menu.addItem({ type: 'submenu', menu: null });
          renderer.updateItemNode(node, item);
          expect(node.classList.contains('p-type-submenu')).to.be(true);
          expect(node.classList.contains('p-mod-hidden')).to.be(true);
        });

        it('should handle separator items', () => {
          let renderer = new Menu.Renderer();
          let node = renderer.createItemNode();
          let menu = new Menu();
          let item = menu.addItem({ type: 'separator' });
          renderer.updateItemNode(node, item);
          expect(node.classList.contains('p-type-separator')).to.be(true);
        });

        it('should add `p-mod-disabled` to disabled items', () => {
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { return args; },
            isEnabled: (args: JSONObject) => { return false; },
          });
          let renderer = new Menu.Renderer();
          let node = renderer.createItemNode();
          let menu = new Menu();
          let item = menu.addItem({ command: 'test' });
          renderer.updateItemNode(node, item);
          expect(node.classList.contains('p-mod-disabled')).to.be(true);
          disposable.dispose();
        });

        it('should add `p-mod-toggled` to toggled items', () => {
          let disposable = commands.addCommand('test', {
            execute: (args: JSONObject) => { return args; },
            isToggled: (args: JSONObject) => { return true; },
          });
          let renderer = new Menu.Renderer();
          let node = renderer.createItemNode();
          let menu = new Menu();
          let item = menu.addItem({ command: 'test' });
          renderer.updateItemNode(node, item);
          expect(node.classList.contains('p-mod-toggled')).to.be(true);
          disposable.dispose();
        });

      });

      describe('#formatLabel()', () => {

        it('should format a label into HTML for display', () => {
          let renderer = new Menu.Renderer();
          let label = renderer.formatLabel('foo', 0);
          expect(label).to.be('<span class="p-Menu-itemMnemonic">f</span>oo');
        });

        it('should not add a mnemonic if the index is out of range', () => {
          let renderer = new Menu.Renderer();
          let label = renderer.formatLabel('foo', -1);
          expect(label).to.be('foo');
        });

      });

      describe('#formatShortcut()', () => {

        it('should format a key binding into a shortcut text for display', () => {
          let binding = keymap.findKeyBinding(DEFAULT_CMD, null);
          let renderer = new Menu.Renderer();
          let shortcut = renderer.formatShortcut(binding);
          expect(shortcut).to.be('A');
        });

        it('should accept a `null` keyBinding', () => {
          let renderer = new Menu.Renderer();
          let shortcut = renderer.formatShortcut(null);
          expect(shortcut).to.be('');
        });

      });

    });

    describe('.defaultRenderer', () => {

      it('should be an instance of `Renderer`', () => {
        expect(Menu.defaultRenderer).to.be.a(Menu.Renderer);
      });

    });

  });

});
