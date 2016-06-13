/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  generate, simulate
} from 'simulate-event';

import {
  toArray
} from '../../../lib/algorithm/iteration';

import {
  JSONObject
} from '../../../lib/algorithm/json';

import {
  Message
} from '../../../lib/core/messaging';

import {
  commands
} from '../../../lib/ui/commands';

import {
  keymap
} from '../../../lib/ui/keymap';

import {
  Menu, MenuItem
} from '../../../lib/ui/menu';

import {
  MenuBar
} from '../../../lib/ui/menubar';

import {
  Title
} from '../../../lib/ui/title';

import {
  Widget
} from '../../../lib/ui/widget';


// Set up a default command and its keybinding.
const DEFAULT_CMD = 'defaultCmd';
commands.addCommand(DEFAULT_CMD, {
  execute: (args: JSONObject) => { return args; },
  label: 'LABEL',
  icon: 'foo',
  className: 'bar',
  isToggled: (args: JSONObject) => { return true; },
  mnemonic: 1
});
keymap.addBinding({
  keys: ['A'],
  selector: '*',
  command: DEFAULT_CMD
});


class LogMenuBar extends MenuBar {

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
}


function createMenuBar(): MenuBar {
  let bar = new MenuBar();
  // Add a few menus to the bar.
  for (let i = 0; i < 3; i++) {
    let menu = new Menu();
    let item = new MenuItem({ command: DEFAULT_CMD });
    menu.addItem(item);
    menu.title.label = `Menu${i}`;
    menu.title.mnemonic = 4;
    bar.addMenu(menu);
  }
  bar.activeIndex = 0;
  Widget.attach(bar, document.body);
  return bar;
}


describe('ui/menubar', () => {

  describe('MenuBar(', () => {

    describe('.createNode()', () => {

      it('should create the DOM node for a menu bar', () => {
        let node = MenuBar.createNode();
        expect(node.getElementsByClassName('p-MenuBar-content').length).to.be(1);
        expect(node.tabIndex).to.be(-1);
      });

    });

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let bar = new MenuBar();
        expect(bar).to.be.a(MenuBar);
      });

      it('should take options for initializing the menu bar', () => {
        let renderer = new MenuBar.ContentRenderer();
        let bar = new MenuBar({ renderer });
        expect(bar).to.be.a(MenuBar);
      });

      it('should add the `p-MenuBar` class', () => {
        let bar = new MenuBar();
        expect(bar.hasClass('p-MenuBar')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the menu bar', () => {
        let bar = new MenuBar();
        bar.addMenu(new Menu());
        bar.dispose();
        expect(toArray(bar.menus)).to.eql([]);
        expect(bar.isDisposed).to.be(true);
      });

    });

    describe('#contentNode', () => {

      it('should get the menu content node', () => {
        let bar = new MenuBar();
        let content = bar.contentNode;
        expect(content.classList.contains('p-MenuBar-content')).to.be(true);
      });

    });

    describe('#menus', () => {

      it('should get a read-only sequence of the menus in the menu bar', () => {
        let bar = new MenuBar();
        let menu0 = new Menu();
        let menu1 = new Menu();
        bar.addMenu(menu0);
        bar.addMenu(menu1);
        let menus = bar.menus;
        expect(menus.length).to.be(2);
        expect(menus.at(0)).to.be(menu0);
        expect(menus.at(1)).to.be(menu1);
      });

      it('should be read-only', () => {
        let bar = new MenuBar();
        expect(() => { bar.menus = null; }).to.throwError();
      });

    });

    describe('#childMenu', () => {

      it('should get the child menu of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeIndex = 0;
        bar.openActiveMenu();
        expect(bar.childMenu).to.be(menu);
        bar.dispose();
      });

      it('should be `null` if there is no open menu', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.childMenu).to.be(null);
        bar.dispose();
      });

      it('should be read-only', () => {
        let bar = new MenuBar();
        expect(() => { bar.childMenu = new Menu(); }).to.throwError();
      });

    });

    describe('#activeMenu', () => {

      it('should get the active menu of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.activeMenu).to.be(menu);
        bar.dispose();
      });

      it('should be `null` if there is no active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        expect(bar.activeMenu).to.be(null);
        bar.dispose();
      });

      it('should set the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeMenu = menu;
        expect(bar.activeMenu).to.be(menu);
        bar.dispose();
      });

      it('should set to `null` if the menu is not in the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.activeMenu = menu;
        expect(bar.activeMenu).to.be(null);
        bar.dispose();
      });

    });

    describe('#activeIndex', () => {

      it('should get the index of the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeMenu = menu;
        expect(bar.activeIndex).to.be(0);
        bar.dispose();
      });

      it('should be `-1` if no menu is active', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        expect(bar.activeIndex).to.be(-1);
        bar.dispose();
      });

      it('should set the index of the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.activeIndex).to.be(0);
        bar.dispose();
      });

      it('should set to `-1` if the index is out of range', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeIndex = -2;
        expect(bar.activeIndex).to.be(-1);
        bar.activeIndex = 1;
        expect(bar.activeIndex).to.be(-1);
        bar.dispose();
      });

      it('should add `p-mod-active` to the active node', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeMenu = menu;
        let node = bar.contentNode.firstChild as HTMLElement;
        expect(node.classList.contains('p-mod-active')).to.be(true);
        expect(bar.activeIndex).to.be(0);
        bar.dispose();
      });

    });

    describe('#openActiveMenu()', () => {

      it('should open the active menu and activate its first menu item', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        let item = new MenuItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.activeMenu = menu;
        bar.openActiveMenu();
        expect(menu.isAttached).to.be(true);
        expect(menu.activeItem.command).to.be(item.command);
        bar.dispose();
      });

      it('should be a no-op if there is no active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        let item = new MenuItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.openActiveMenu();
        expect(menu.isAttached).to.be(false);
        bar.dispose();
      });

    });

    describe('#addMenu()', () => {

      it('should add a menu to the end of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        let item = new MenuItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(new Menu());
        bar.addMenu(menu);
        expect(bar.menus.length).to.be(2);
        expect(bar.menus.at(1)).to.be(menu);
        bar.dispose();
      });

      it('should move an existing menu to the end', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        let item = new MenuItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.addMenu(new Menu());
        bar.addMenu(menu);
        expect(bar.menus.length).to.be(2);
        expect(bar.menus.at(1)).to.be(menu);
        bar.dispose();
      });

    });

    describe('#insertMenu()', () => {

      it('should insert a menu into the menu bar at the specified index', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(new Menu());
        bar.insertMenu(0, menu);
        expect(bar.menus.length).to.be(2);
        expect(bar.menus.at(0)).to.be(menu);
        bar.dispose();
      });

      it('should clamp the index to the bounds of the menus', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(new Menu());
        bar.insertMenu(-1, menu);
        expect(bar.menus.length).to.be(2);
        expect(bar.menus.at(0)).to.be(menu);

        menu = new Menu();
        bar.insertMenu(10, menu);
        expect(bar.menus.length).to.be(3);
        expect(bar.menus.at(2)).to.be(menu);

        bar.dispose();
      });

      it('should move an existing menu', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(new Menu());
        bar.insertMenu(0, menu);
        bar.insertMenu(10, menu);
        expect(bar.menus.length).to.be(2);
        expect(bar.menus.at(1)).to.be(menu);
        bar.dispose();
      });

      it('should be a no-op if there is no effective move', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(new Menu());
        bar.insertMenu(0, menu);
        bar.insertMenu(0, menu);
        expect(bar.menus.length).to.be(2);
        expect(bar.menus.at(0)).to.be(menu);
        bar.dispose();
      });

    });

    describe('#removeMenu()', () => {

      it('should remove a menu from the menu bar by value', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(new Menu());
        bar.addMenu(menu);
        bar.removeMenu(menu);
        expect(bar.menus.length).to.be(1);
        expect(bar.menus.at(0)).to.not.be(menu);
        bar.dispose();
      });

      it('should remove a menu from the menu bar by index', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(new Menu());
        bar.addMenu(menu);
        bar.removeMenu(1);
        expect(bar.menus.length).to.be(1);
        expect(bar.menus.at(0)).to.not.be(menu);
        bar.dispose();
      });

      it('should be a no-op if the menu is not contained in the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(new Menu());
        bar.removeMenu(menu);
        expect(bar.menus.length).to.be(1);
        expect(bar.menus.at(0)).to.not.be(menu);
        bar.dispose();
      });

      it('should be a no-op if the index is out of range', () => {
        let bar = new MenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.removeMenu(-1);
        expect(bar.menus.length).to.be(1);
        bar.removeMenu(1);
        expect(bar.menus.length).to.be(1);
        expect(bar.menus.at(0)).to.be(menu);
        bar.dispose();
      });

    });

    describe('#clearMenus()', () => {

      it('should remove all menus from the menu bar', () => {
        let bar = new MenuBar();
        bar.addMenu(new Menu());
        bar.addMenu(new Menu());
        bar.clearMenus();
        expect(toArray(bar.menus)).to.eql([]);
      });

      it('should be a no-op if there are no menus', () => {
        let bar = new MenuBar();
        bar.clearMenus();
        expect(toArray(bar.menus)).to.eql([]);
      });

    });

    describe('#handleEvent()', () => {

      let bar: MenuBar = null;

      beforeEach(() => { bar = createMenuBar(); });

      afterEach(() => bar.dispose());

      context('keydown', () => {

        it('should open the active menu on Enter', () => {
          let menu = bar.activeMenu;
          simulate(bar.node, 'keydown', { keyCode: 13 });
          expect(menu.isAttached).to.be(true);
        });

        it('should open the active menu on Up Arrow', () => {
          let menu = bar.activeMenu;
          simulate(bar.node, 'keydown', { keyCode: 38 });
          expect(menu.isAttached).to.be(true);
        });

        it('should open the active menu on Down Arrow', () => {
          let menu = bar.activeMenu;
          simulate(bar.node, 'keydown', { keyCode: 40 });
          expect(menu.isAttached).to.be(true);
        });

        it('should close the active menu on Escape', () => {
          let menu = bar.activeMenu;
          bar.openActiveMenu();
          simulate(bar.node, 'keydown', { keyCode: 27 });
          expect(menu.isAttached).to.be(false);
          expect(menu.activeIndex).to.be(-1);
          expect(menu.node.contains(document.activeElement)).to.be(false);
        });

        it('should activate the previous menu on Left Arrow', () => {
          simulate(bar.node, 'keydown', { keyCode: 37 });
          expect(bar.activeIndex).to.be(2);
          simulate(bar.node, 'keydown', { keyCode: 37 });
          expect(bar.activeIndex).to.be(1);
        });

        it('should activate the next menu on Right Arrow', () => {
          simulate(bar.node, 'keydown', { keyCode: 39 });
          expect(bar.activeIndex).to.be(1);
          simulate(bar.node, 'keydown', { keyCode: 39 });
          expect(bar.activeIndex).to.be(2);
          simulate(bar.node, 'keydown', { keyCode: 39 });
          expect(bar.activeIndex).to.be(0);
        });

        it('should open the menu matching a mnemonic', () => {
          simulate(bar.node, 'keydown', { keyCode: 97 });  // '1';
          expect(bar.activeIndex).to.be(1);
          let menu = bar.activeMenu;
          expect(menu.isAttached).to.be(true);
        });

        it('should select the next menu matching by first letter', () => {
          bar.activeIndex = 1;
          simulate(bar.node, 'keydown', { keyCode: 77 });  // 'M';
          expect(bar.activeIndex).to.be(1);
          let menu = bar.activeMenu;
          expect(menu.isAttached).to.be(false);
        });

        it('should select the first menu matching the mnemonic', () => {
          let menu = new Menu();
          menu.title.label = 'Test1';
          menu.title.mnemonic = 4;
          bar.addMenu(menu);
          simulate(bar.node, 'keydown', { keyCode: 97 });  // '1';
          expect(bar.activeIndex).to.be(1);
          menu = bar.activeMenu;
          expect(menu.isAttached).to.be(false);
        });

        it('should select the only menu matching the first letter', () => {
          let menu = new Menu();
          menu.title.label = 'Test1';
          bar.addMenu(menu);
          bar.addMenu(new Menu());
          simulate(bar.node, 'keydown', { keyCode: 84 });  // 'T';
          expect(bar.activeIndex).to.be(3);
          menu = bar.activeMenu;
          expect(menu.isAttached).to.be(false);
        });

      });

      context('mousedown', () => {

        it('should bail if the mouse press was not on the menu bar', () => {
          let evt = generate('mousedown', { clientX: -10 });
          bar.node.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(false);
        });

        it('should close an open menu if the press was not on an item', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu;
          simulate(bar.node, 'mousedown');
          expect(bar.activeIndex).to.be(-1);
          expect(menu.isAttached).to.be(false);
        });

        it('should close an active menu', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousedown', { clientX: rect.left, clientY: rect.top });
          expect(bar.activeIndex).to.be(0);
          expect(menu.isAttached).to.be(false);
        });

        it('should open an active menu', () => {
          let menu = bar.activeMenu;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousedown', { clientX: rect.left, clientY: rect.top });
          expect(bar.activeIndex).to.be(0);
          expect(menu.isAttached).to.be(true);
        });

        it('should not close an active menu if not a left mouse press', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousedown', { button: 1, clientX: rect.left, clientY: rect.top });
          expect(bar.activeIndex).to.be(0);
          expect(menu.isAttached).to.be(true);
        });

      });

      context('mousemove', () => {

        it('should open a new menu if a menu is already open', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[1] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top });
          expect(bar.activeIndex).to.be(1);
          expect(menu.isAttached).to.be(false);
          expect(bar.activeMenu.isAttached).to.be(true);
        });

        it('should be a no-op if the active index will not change', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousemove', { clientX: rect.left, clientY: rect.top + 1 });
          expect(bar.activeIndex).to.be(0);
          expect(menu.isAttached).to.be(true);
        });

        it('should be a no-op if the mouse is not over an item and there is a menu open', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu;
          simulate(bar.node, 'mousemove');
          expect(bar.activeIndex).to.be(0);
          expect(menu.isAttached).to.be(true);
        });

      });

      context('mouseleave', () => {

        it('should reset the active index if there is no open menu', () => {
          simulate(bar.node, 'mouseleave');
          expect(bar.activeIndex).to.be(-1);
        });

        it('should be a no-op if there is an open menu', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu;
          simulate(bar.node, 'mouseleave');
          expect(bar.activeIndex).to.be(0);
          expect(menu.isAttached).to.be(true);
        });

      });

    });

    describe('#onAfterAttach()', () => {

      it('should add event listeners', () => {
        let bar = new LogMenuBar();
        let node = bar.node;
        Widget.attach(bar, document.body);
        expect(bar.methods.indexOf('onAfterAttach')).to.not.be(-1);
        simulate(node, 'keydown');
        expect(bar.events.indexOf('keydown')).to.not.be(-1);
        simulate(node, 'mousedown');
        expect(bar.events.indexOf('mousedown')).to.not.be(-1);
        simulate(node, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.not.be(-1);
        simulate(node, 'mouseleave');
        expect(bar.events.indexOf('mouseleave')).to.not.be(-1);
        simulate(node, 'contextmenu');
        expect(bar.events.indexOf('contextmenu')).to.not.be(-1);
        bar.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should remove event listeners', () => {
        let bar = new LogMenuBar();
        let node = bar.node;
        Widget.attach(bar, document.body);
        Widget.detach(bar);
        expect(bar.methods.indexOf('onAfterAttach')).to.not.be(-1);
        simulate(node, 'keydown');
        expect(bar.events.indexOf('keydown')).to.be(-1);
        simulate(node, 'mousedown');
        expect(bar.events.indexOf('mousedown')).to.be(-1);
        simulate(node, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.be(-1);
        simulate(node, 'mouseleave');
        expect(bar.events.indexOf('mouseleave')).to.be(-1);
        simulate(node, 'contextmenu');
        expect(bar.events.indexOf('contextmenu')).to.be(-1);
        bar.dispose();
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be called when the title of a menu changes', (done) => {
        let bar = new LogMenuBar();
        let menu = new Menu();
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.methods.indexOf('onUpdateRequest')).to.be(-1);
        menu.title.label = 'foo';
        expect(bar.methods.indexOf('onUpdateRequest')).to.be(-1);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          done();
        });

      });

    });

    context('Menu.menuRequested', () => {

      it('should activate the next menu', () => {
        let bar = createMenuBar();
        bar.openActiveMenu();
        bar.activeMenu.menuRequested.emit('next');
        expect(bar.activeIndex).to.be(1);
        bar.dispose();
      });

      it('should activate the previous menu', () => {
        let bar = createMenuBar();
        bar.openActiveMenu();
        bar.activeMenu.menuRequested.emit('previous');
        expect(bar.activeIndex).to.be(2);
        bar.dispose();
      });

      it('should be a no-op if the sender is not the open menu', () => {
        let bar = createMenuBar();
        bar.activeMenu.menuRequested.emit('next');
        expect(bar.activeIndex).to.be(0);
        bar.dispose();
      });

    });

  });

  describe('MenuBar.ContentRenderer', () => {

    describe('#createItemNode()', () => {

      it('should create a node for a menu bar item', () => {
        let renderer = new MenuBar.ContentRenderer();
        let node = renderer.createItemNode();
        expect(node.classList.contains('p-MenuBar-item')).to.be(true);
        expect(node.getElementsByClassName('p-MenuBar-itemIcon').length).to.be(1);
        expect(node.getElementsByClassName('p-MenuBar-itemLabel').length).to.be(1);
      });

    });

    describe('#updateItemNode()', () => {

      it('should update an item node to reflect the state of a menu title', () => {
        let renderer = new MenuBar.ContentRenderer();
        let node = renderer.createItemNode();
        let title = new Title();
        title.className = 'foo';
        title.icon = 'bar';
        title.label = 'fizz';
        title.mnemonic = 1;
        renderer.updateItemNode(node, title);
        expect(node.classList.contains(title.className)).to.be(true);
        let icon = node.getElementsByClassName('p-MenuBar-itemIcon')[0] as HTMLElement;
        expect(icon.classList.contains(title.icon)).to.be(true);
        let label = node.getElementsByClassName('p-MenuBar-itemLabel')[0] as HTMLElement;
        expect(label.innerHTML).to.be('f<span class="p-MenuBar-itemMnemonic">i</span>zz');
      });

    });

    describe('#formatLabel()', () => {

      it('should format a label into HTML for display', () => {
        let renderer = new MenuBar.ContentRenderer();
        let label = renderer.formatLabel('foo', 0);
        expect(label).to.be('<span class="p-MenuBar-itemMnemonic">f</span>oo');
      });

      it('should not add a mnemonic if the index is out of range', () => {
        let renderer = new MenuBar.ContentRenderer();
        let label = renderer.formatLabel('foo', -1);
        expect(label).to.be('foo');
      });

    });

  });

});
