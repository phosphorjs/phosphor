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
  generate, simulate
} from 'simulate-event';

import {
  JSONObject
} from '@phosphor/coreutils';

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  DisposableSet
} from '@phosphor/disposable';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  VirtualDOM, VirtualElement
} from '@phosphor/virtualdom';

import {
  Menu, MenuBar, Widget
} from '@phosphor/widgets';


class LogMenuBar extends MenuBar {

  events: string[] = [];

  methods: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.methods.push('onBeforeAttach');
  }

  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg);
    this.methods.push('onAfterDetach');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }
}


describe('@phosphor/widgets', () => {

  const DEFAULT_CMD = 'menubar.spec.ts:defaultCmd';

  const disposables = new DisposableSet();

  let commands: CommandRegistry;

  function createMenuBar(): MenuBar {
    let bar = new MenuBar();
    for (let i = 0; i < 3; i++) {
      let menu = new Menu({ commands });
      let item = menu.addItem({ command: DEFAULT_CMD });
      menu.addItem(item);
      menu.title.label = `Menu${i}`;
      menu.title.mnemonic = 4;
      bar.addMenu(menu);
    }
    bar.activeIndex = 0;
    Widget.attach(bar, document.body);
    // Force an update.
    MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
    return bar;
  }

  before(() => {
    commands = new CommandRegistry();
    let cmd = commands.addCommand(DEFAULT_CMD, {
      execute: (args: JSONObject) => { return args; },
      label: 'LABEL',
      icon: 'foo',
      className: 'bar',
      isToggled: (args: JSONObject) => { return true; },
      mnemonic: 1
    });
    let kbd = commands.addKeyBinding({
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

  describe('MenuBar', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let bar = new MenuBar();
        expect(bar).to.be.an.instanceof(MenuBar);
      });

      it('should take options for initializing the menu bar', () => {
        let renderer = new MenuBar.Renderer();
        let bar = new MenuBar({ renderer });
        expect(bar).to.be.an.instanceof(MenuBar);
      });

      it('should add the `p-MenuBar` class', () => {
        let bar = new MenuBar();
        expect(bar.hasClass('p-MenuBar')).to.equal(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the menu bar', () => {
        let bar = new MenuBar();
        bar.addMenu(new Menu({ commands }));
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
      });

    });

    describe('#renderer', () => {

      it('should get the renderer for the menu bar', () => {
        let renderer = Object.create(MenuBar.defaultRenderer);
        let bar = new MenuBar({ renderer });
        expect(bar.renderer).to.equal(renderer);
      });

    });

    describe('#childMenu', () => {

      it('should get the child menu of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        bar.openActiveMenu();
        expect(bar.childMenu).to.equal(menu);
        bar.dispose();
      });

      it('should be `null` if there is no open menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.childMenu).to.equal(null);
        bar.dispose();
      });

    });

    describe('#contentNode', () => {

      it('should get the menu content node', () => {
        let bar = new MenuBar();
        let content = bar.contentNode;
        expect(content.classList.contains('p-MenuBar-content')).to.equal(true);
      });

    });

    describe('#activeMenu', () => {

      it('should get the active menu of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.activeMenu).to.equal(menu);
        bar.dispose();
      });

      it('should be `null` if there is no active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        expect(bar.activeMenu).to.equal(null);
        bar.dispose();
      });

      it('should set the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeMenu = menu;
        expect(bar.activeMenu).to.equal(menu);
        bar.dispose();
      });

      it('should set to `null` if the menu is not in the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.activeMenu = menu;
        expect(bar.activeMenu).to.equal(null);
        bar.dispose();
      });

    });

    describe('#activeIndex', () => {

      it('should get the index of the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeMenu = menu;
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });

      it('should be `-1` if no menu is active', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        expect(bar.activeIndex).to.equal(-1);
        bar.dispose();
      });

      it('should set the index of the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });

      it('should set to `-1` if the index is out of range', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = -2;
        expect(bar.activeIndex).to.equal(-1);
        bar.activeIndex = 1;
        expect(bar.activeIndex).to.equal(-1);
        bar.dispose();
      });

      it('should add `p-mod-active` to the active node', () => {
        let bar = createMenuBar();
        let node = bar.contentNode.firstChild as HTMLElement;
        expect(node.classList.contains('p-mod-active')).to.equal(true);
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });

    });

    describe('#menus', () => {

      it('should get a read-only array of the menus in the menu bar', () => {
        let bar = new MenuBar();
        let menu0 = new Menu({ commands });
        let menu1 = new Menu({ commands });
        bar.addMenu(menu0);
        bar.addMenu(menu1);
        let menus = bar.menus;
        expect(menus.length).to.equal(2);
        expect(menus[0]).to.equal(menu0);
        expect(menus[1]).to.equal(menu1);
      });

    });

    describe('#openActiveMenu()', () => {

      it('should open the active menu and activate its first menu item', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.activeMenu = menu;
        bar.openActiveMenu();
        expect(menu.isAttached).to.equal(true);
        expect(menu.activeItem!.command).to.equal(item.command);
        bar.dispose();
      });

      it('should be a no-op if there is no active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.openActiveMenu();
        expect(menu.isAttached).to.equal(false);
        bar.dispose();
      });

    });

    describe('#addMenu()', () => {

      it('should add a menu to the end of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[1]).to.equal(menu);
        bar.dispose();
      });

      it('should move an existing menu to the end', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[1]).to.equal(menu);
        bar.dispose();
      });

    });

    describe('#insertMenu()', () => {

      it('should insert a menu into the menu bar at the specified index', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(0, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[0]).to.equal(menu);
        bar.dispose();
      });

      it('should clamp the index to the bounds of the menus', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(-1, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[0]).to.equal(menu);

        menu = new Menu({ commands });
        bar.insertMenu(10, menu);
        expect(bar.menus.length).to.equal(3);
        expect(bar.menus[2]).to.equal(menu);

        bar.dispose();
      });

      it('should move an existing menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(0, menu);
        bar.insertMenu(10, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[1]).to.equal(menu);
        bar.dispose();
      });

      it('should be a no-op if there is no effective move', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(0, menu);
        bar.insertMenu(0, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[0]).to.equal(menu);
        bar.dispose();
      });

    });

    describe('#removeMenu()', () => {

      it('should remove a menu from the menu bar by value', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenu(menu);
        expect(bar.menus.length).to.equal(1);
        expect(bar.menus[0]).to.not.equal(menu);
        bar.dispose();
      });

      it('should return be a no-op if the menu is not in the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenu(menu);
        bar.removeMenu(menu);
        expect(bar.menus.length).to.equal(0);
        bar.dispose();
      });

    });

    describe('#removeMenuAt()', () => {

      it('should remove a menu from the menu bar by index', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenuAt(1);
        expect(bar.menus.length).to.equal(1);
        expect(bar.menus[0]).to.not.equal(menu);
        bar.dispose();
      });

      it('should be a no-op if the index is out of range', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenuAt(1);
        bar.removeMenuAt(1);
        expect(bar.menus.length).to.equal(1);
        bar.dispose();
      });

    });

    describe('#clearMenus()', () => {

      it('should remove all menus from the menu bar', () => {
        let bar = new MenuBar();
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(new Menu({ commands }));
        bar.clearMenus();
        expect(bar.menus).to.eql([]);
      });

      it('should be a no-op if there are no menus', () => {
        let bar = new MenuBar();
        bar.clearMenus();
        expect(bar.menus).to.eql([]);
      });

    });

    describe('#handleEvent()', () => {

      let bar: MenuBar;

      beforeEach(() => {
        bar = createMenuBar();
      });

      afterEach(() => {
        bar.dispose();
      });

      context('keydown', () => {

        it('should open the active menu on Enter', () => {
          let menu = bar.activeMenu!;
          simulate(bar.node, 'keydown', { keyCode: 13 });
          expect(menu.isAttached).to.equal(true);
        });

        it('should open the active menu on Up Arrow', () => {
          let menu = bar.activeMenu!;
          simulate(bar.node, 'keydown', { keyCode: 38 });
          expect(menu.isAttached).to.equal(true);
        });

        it('should open the active menu on Down Arrow', () => {
          let menu = bar.activeMenu!;
          simulate(bar.node, 'keydown', { keyCode: 40 });
          expect(menu.isAttached).to.equal(true);
        });

        it('should close the active menu on Escape', () => {
          let menu = bar.activeMenu!;
          bar.openActiveMenu();
          simulate(bar.node, 'keydown', { keyCode: 27 });
          expect(menu.isAttached).to.equal(false);
          expect(menu.activeIndex).to.equal(-1);
          expect(menu.node.contains(document.activeElement)).to.equal(false);
        });

        it('should activate the previous menu on Left Arrow', () => {
          simulate(bar.node, 'keydown', { keyCode: 37 });
          expect(bar.activeIndex!).to.equal(2);
          simulate(bar.node, 'keydown', { keyCode: 37 });
          expect(bar.activeIndex!).to.equal(1);
        });

        it('should activate the next menu on Right Arrow', () => {
          simulate(bar.node, 'keydown', { keyCode: 39 });
          expect(bar.activeIndex!).to.equal(1);
          simulate(bar.node, 'keydown', { keyCode: 39 });
          expect(bar.activeIndex!).to.equal(2);
          simulate(bar.node, 'keydown', { keyCode: 39 });
          expect(bar.activeIndex!).to.equal(0);
        });

        it('should open the menu matching a mnemonic', () => {
          simulate(bar.node, 'keydown', { keyCode: 97 });  // '1';
          expect(bar.activeIndex!).to.equal(1);
          let menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(true);
        });

        it('should select the next menu matching by first letter', () => {
          bar.activeIndex = 1;
          simulate(bar.node, 'keydown', { keyCode: 77 });  // 'M';
          expect(bar.activeIndex!).to.equal(1);
          let menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(false);
        });

        it('should select the first menu matching the mnemonic', () => {
          let menu = new Menu({ commands });
          menu.title.label = 'Test1';
          menu.title.mnemonic = 4;
          bar.addMenu(menu);
          simulate(bar.node, 'keydown', { keyCode: 97 });  // '1';
          expect(bar.activeIndex).to.equal(1);
          menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(false);
        });

        it('should select the only menu matching the first letter', () => {
          let menu = new Menu({ commands });
          menu.title.label = 'Test1';
          bar.addMenu(menu);
          bar.addMenu(new Menu({ commands }));
          simulate(bar.node, 'keydown', { keyCode: 84 });  // 'T';
          expect(bar.activeIndex).to.equal(3);
          menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(false);
        });

      });

      context('mousedown', () => {

        it('should bail if the mouse press was not on the menu bar', () => {
          let evt = generate('mousedown', { clientX: -10 });
          bar.node.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.equal(false);
        });

        it('should close an open menu if the press was not on an item', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          simulate(bar.node, 'mousedown');
          expect(bar.activeIndex).to.equal(-1);
          expect(menu.isAttached).to.equal(false);
        });

        it('should close an active menu', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousedown', { clientX: rect.left, clientY: rect.top });
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(false);
        });

        it('should open an active menu', () => {
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousedown', { clientX: rect.left, clientY: rect.top });
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });

        it('should not close an active menu if not a left mouse press', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousedown', { button: 1, clientX: rect.left, clientY: rect.top });
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });

      });

      context('mousemove', () => {

        it('should open a new menu if a menu is already open', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[1] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top });
          expect(bar.activeIndex).to.equal(1);
          expect(menu.isAttached).to.equal(false);
          expect(bar.activeMenu!.isAttached).to.equal(true);
        });

        it('should be a no-op if the active index will not change', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName('p-MenuBar-item')[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          simulate(bar.node, 'mousemove', { clientX: rect.left, clientY: rect.top + 1 });
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });

        it('should be a no-op if the mouse is not over an item and there is a menu open', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          simulate(bar.node, 'mousemove');
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });

      });

      context('mouseleave', () => {

        it('should reset the active index if there is no open menu', () => {
          simulate(bar.node, 'mouseleave');
          expect(bar.activeIndex).to.equal(-1);
        });

        it('should be a no-op if there is an open menu', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          simulate(bar.node, 'mouseleave');
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });

      });

      context('contextmenu', () => {

        it('should prevent default', () => {
          let evt = generate('contextmenu');
          let cancelled = !bar.node.dispatchEvent(evt);
          expect(cancelled).to.equal(true);
        });

      });

    });

    describe('#onBeforeAttach()', () => {

      it('should add event listeners', () => {
        let bar = new LogMenuBar();
        let node = bar.node;
        Widget.attach(bar, document.body);
        expect(bar.methods.indexOf('onBeforeAttach')).to.not.equal(-1);
        simulate(node, 'keydown');
        expect(bar.events.indexOf('keydown')).to.not.equal(-1);
        simulate(node, 'mousedown');
        expect(bar.events.indexOf('mousedown')).to.not.equal(-1);
        simulate(node, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.not.equal(-1);
        simulate(node, 'mouseleave');
        expect(bar.events.indexOf('mouseleave')).to.not.equal(-1);
        simulate(node, 'contextmenu');
        expect(bar.events.indexOf('contextmenu')).to.not.equal(-1);
        bar.dispose();
      });

    });

    describe('#onAfterDetach()', () => {

      it('should remove event listeners', () => {
        let bar = new LogMenuBar();
        let node = bar.node;
        Widget.attach(bar, document.body);
        Widget.detach(bar);
        expect(bar.methods.indexOf('onBeforeAttach')).to.not.equal(-1);
        simulate(node, 'keydown');
        expect(bar.events.indexOf('keydown')).to.equal(-1);
        simulate(node, 'mousedown');
        expect(bar.events.indexOf('mousedown')).to.equal(-1);
        simulate(node, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.equal(-1);
        simulate(node, 'mouseleave');
        expect(bar.events.indexOf('mouseleave')).to.equal(-1);
        simulate(node, 'contextmenu');
        expect(bar.events.indexOf('contextmenu')).to.equal(-1);
        bar.dispose();
      });

    });

    describe('#onActivateRequest()', () => {

      it('should be a no-op if not attached', () => {
        let bar = createMenuBar();
        Widget.detach(bar);
        MessageLoop.sendMessage(bar, Widget.Msg.ActivateRequest);
        expect(bar.node.contains(document.activeElement)).to.equal(false);
      });

      it('should focus the node if attached', () => {
        let bar = createMenuBar();
        MessageLoop.sendMessage(bar, Widget.Msg.ActivateRequest);
        expect(bar.node.contains(document.activeElement)).to.equal(true);
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be called when the title of a menu changes', (done) => {
        let bar = new LogMenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.methods.indexOf('onUpdateRequest')).to.equal(-1);
        menu.title.label = 'foo';
        expect(bar.methods.indexOf('onUpdateRequest')).to.equal(-1);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
          done();
        });

      });

      it('should render the content', () => {
        let bar = new LogMenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        expect(bar.contentNode.children.length).to.equal(0);
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        let child = bar.contentNode.firstChild as HTMLElement;
        expect(child.className).to.contain('p-MenuBar-item');
      });

    });

    context('`menuRequested` signal', () => {

      it('should activate the next menu', () => {
        let bar = createMenuBar();
        bar.openActiveMenu();
        (bar.activeMenu!.menuRequested as any).emit('next');
        expect(bar.activeIndex).to.equal(1);
        bar.dispose();
      });

      it('should activate the previous menu', () => {
        let bar = createMenuBar();
        bar.openActiveMenu();
        (bar.activeMenu!.menuRequested as any).emit('previous');
        expect(bar.activeIndex).to.equal(2);
        bar.dispose();
      });

      it('should be a no-op if the sender is not the open menu', () => {
        let bar = createMenuBar();
        (bar.activeMenu!.menuRequested as any).emit('next');
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });

    });

    describe('.Renderer', () => {

      const renderer = new MenuBar.Renderer();
      let data: MenuBar.IRenderData;

      before(() => {
        let widget = new Widget();
        widget.title.label = 'foo';
        widget.title.icon = 'bar';
        widget.title.className = 'baz';
        widget.title.closable = true;
        data = {
          title: widget.title,
          active: true
        };
      });

      describe('#renderItem()', () => {

        it('should render the virtual element for a menu bar item', () => {
          let node = VirtualDOM.realize(renderer.renderItem(data));
          expect(node.classList.contains('p-MenuBar-item')).to.equal(true);
          expect(node.getElementsByClassName('p-MenuBar-itemIcon').length).to.equal(1);
          expect(node.getElementsByClassName('p-MenuBar-itemLabel').length).to.equal(1);
        });

      });

      describe('#renderIcon()', () => {

        it('should render the icon element for a menu bar item', () => {
          let node = VirtualDOM.realize(renderer.renderIcon(data));
          expect(node.className).to.contain('p-MenuBar-itemIcon');
          expect(node.className).to.contain('bar');
        });

      });

      describe('#renderLabel()', () => {

        it('should render the label element for a menu item', () => {
          let node = VirtualDOM.realize(renderer.renderLabel(data));
          expect(node.className).to.contain('p-MenuBar-itemLabel');
          expect(node.textContent).to.equal('foo');
        });

      });

      describe('#createItemClass()', () => {

        it('should create the class name for the menu bar item', () => {
          let itemClass = renderer.createItemClass(data);
          expect(itemClass).to.contain('baz');
          expect(itemClass).to.contain('p-mod-active');
        });

      });

      describe('#createIconClass()', () => {

        it('should create the class name for the menu bar item icon', () => {
          let iconClass = renderer.createIconClass(data);
          expect(iconClass).to.contain('p-MenuBar-itemIcon');
          expect(iconClass).to.contain('bar');
        });

      });

      describe('#formatLabel()', () => {

        it('should format a label into HTML for display', () => {
          data.title.mnemonic = 1;
          let label = renderer.formatLabel(data);
          expect((label as any)[0]).to.equal('f');
          let node = VirtualDOM.realize(((label as any)[1]) as VirtualElement);
          expect(node.className).to.contain('p-MenuBar-itemMnemonic');
          expect(node.textContent).to.equal('o');
          expect((label as any)[2]).to.equal('o');
        });

        it('should not add a mnemonic if the index is out of range', () => {
          data.title.mnemonic = -1;
          let label = renderer.formatLabel(data);
          expect(label).to.equal('foo');
        });

      });

    });

    describe('.defaultRenderer', () => {

      it('should be an instance of `Renderer`', () => {
        expect(MenuBar.defaultRenderer).to.be.an.instanceof(MenuBar.Renderer);
      });

    });

  });

});
