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
  each, toArray
} from '../../../lib/algorithm/iteration';

import {
  range
} from '../../../lib/algorithm/range';

import {
  Message
} from '../../../lib/core/messaging';

import {
  TabBar
} from '../../../lib/ui/tabbar';

import {
  Title
} from '../../../lib/ui/title';

import {
  Widget
} from '../../../lib/ui/widget';


class LogTabBar extends TabBar {

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


function createBar(): LogTabBar {
  let bar = new LogTabBar();
  each(range(3), i => {
    bar.addTab({ label: `Test - ${i}`, closable: true });
  });
  return bar;
}


type Direction = 'left' | 'right' | 'up' | 'down';


function startDrag(bar: LogTabBar, index = 0, direction: Direction = 'right'): void {
  bar.tabsMovable = true;
  let tab = bar.contentNode.children[index] as HTMLElement;
  let rect = tab.getBoundingClientRect();
  simulate(tab, 'mousedown', { clientX: rect.left + 1, clientY: rect.top });
  let called = true;
  bar.tabDetachRequested.connect((sender, args) => { called = true; });
  rect = bar.contentNode.getBoundingClientRect();
  let args: any;
  switch (direction) {
  case 'left':
    args = { clientX: rect.left - 200, clientY: rect.top };
    break;
  case 'up':
    args = { clientX: rect.left, clientY: rect.top - 200 };
    break;
  case 'down':
    args = { clientX: rect.left, clientY: rect.bottom + 200 };
    break;
  default:
    args = { clientX: rect.right + 200, clientY: rect.top };
    break;
  }
  simulate(document.body, 'mousemove', args);
  expect(called).to.be(true);
  bar.events = [];
}


describe('ui/tabbar', () => {

  describe('TabBar', () => {

    describe('.createNode()', () => {

      it('should create the DOM node for a tab bar', () => {
        let node = TabBar.createNode();
        expect(node.getElementsByClassName('p-TabBar-header').length).to.be(1);
        expect(node.getElementsByClassName('p-TabBar-footer').length).to.be(1);
        expect(node.getElementsByClassName('p-TabBar-body').length).to.be(1);
        expect(node.getElementsByClassName('p-TabBar-content').length).to.be(1);
      });

    });

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let bar = new TabBar();
        expect(bar).to.be.a(TabBar);
      });

      it('should take an options argument', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let bar = new TabBar({ tabsMovable: true, renderer });
        expect(bar).to.be.a(TabBar);
        expect(bar.tabsMovable).to.be(true);
        expect(bar.renderer).to.be(renderer);
      });

      it('should add the `p-TabBar` class', () => {
        let bar = new TabBar();
        expect(bar.hasClass('p-TabBar')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let bar = createBar();
        bar.dispose();
        expect(bar.titles.length).to.be(0);
        expect(bar.isDisposed).to.be(true);
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current tab is changed', () => {
        let bar = createBar();
        let called = false;
        let titles = bar.titles;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.previousIndex).to.be(0);
          expect(args.previousTitle).to.be(titles.at(0));
          expect(args.currentIndex).to.be(1);
          expect(args.currentTitle).to.be(titles.at(1));
          called = true;
        });
        bar.currentTitle = titles.at(1);
        expect(called).to.be(true);
      });

      it('should not be emitted when another tab is inserted', () => {
        let bar = createBar();
        let called = false;
        bar.currentChanged.connect((sender, args) => { called = true; });
        bar.insertTab(0, new Title());
        expect(called).to.be(false);
      });

      it('should not be emitted when another tab is removed', () => {
        let bar = createBar();
        let called = false;
        bar.currentIndex = 1;
        bar.currentChanged.connect((sender, args) => { called = true; });
        bar.removeTab(bar.titles.at(0));
        expect(called).to.be(false);
      });

      it('should not be emitted when the current tab is moved', () => {
        let bar = createBar();
        let called = false;
        bar.currentChanged.connect((sender, args) => { called = true; });
        bar.insertTab(2, bar.titles.at(0));
        expect(called).to.be(false);
      });

    });

    describe('#tabMoved', () => {

      it('should be emitted when a tab is moved right by the user', (done) => {
        let bar = createBar();
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => {
          let titles = toArray(bar.titles);
          bar.tabMoved.connect((sender, args) => {
            expect(sender).to.be(bar);
            expect(args.fromIndex).to.be(0);
            expect(args.toIndex).to.be(2);
            expect(args.title).to.be(titles[0]);
            bar.dispose();
            done();
          });
          startDrag(bar);
          simulate(document.body, 'mouseup');
        });
      });

      it('should be emitted when a tab is moved left by the user', (done) => {
        let bar = createBar();
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => {
          let titles = toArray(bar.titles);
          bar.tabMoved.connect((sender, args) => {
            expect(sender).to.be(bar);
            expect(args.fromIndex).to.be(2);
            expect(args.toIndex).to.be(0);
            expect(args.title).to.be(titles[2]);
            bar.dispose();
            done();
          });
          startDrag(bar, 2, 'left');
          simulate(document.body, 'mouseup');
        });
      });

      it('should not be emitted when a tab is moved programmatically', () => {
        let bar = createBar();
        let called = false;
        bar.tabMoved.connect((sender, args) => { called = true; });
        bar.insertTab(2, bar.titles.at(0));
        expect(called).to.be(false);
      });

    });

    describe('#tabCloseRequested', () => {

      let bar: LogTabBar;
      let closeIcon: HTMLElement;

      beforeEach((done) => {
        bar = createBar();
        let tab = bar.contentNode.firstChild as HTMLElement;
        closeIcon = tab.getElementsByClassName('p-TabBar-tabCloseIcon')[0] as HTMLElement;
        closeIcon.textContent = 'X';
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => { done(); });
      });

      afterEach(() => {
        bar.dispose();
      });

      it('should be emitted when a tab close icon is clicked', () => {
        let rect = closeIcon.getBoundingClientRect();
        let called = false;
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.index).to.be(0);
          expect(args.title).to.be(bar.titles.at(0));
          called = true;
        });
        simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
        expect(called).to.be(true);
      });

      it('should not be emitted if the tab title is not `closable`', () => {
        let rect = closeIcon.getBoundingClientRect();
        let called = false;
        let title = bar.titles.at(0);
        title.closable = false;
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.index).to.be(0);
          expect(args.title).to.be(bar.titles.at(0));
          called = true;
        });
        simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
        expect(called).to.be(false);
      });

    });

    describe('#tabDetachRequested', () => {

      let bar: LogTabBar;
      let tab: HTMLElement;

      beforeEach((done) => {
        bar = createBar();
        bar.tabsMovable = true;
        tab = bar.contentNode.firstChild as HTMLElement;
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => { done(); });
      });

      afterEach(() => {
        bar.dispose();
      });

      it('should be emitted when a tab is dragged beyond the detach threshold', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.index).to.be(0);
          expect(args.title).to.be(bar.titles.at(0));
          expect(args.clientX).to.be(rect.right + 200);
          expect(args.clientY).to.be(rect.top);
          called = true;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.be(true);
      });

      it('should be handled by calling `releaseMouse` and removing the tab', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTab(args.index);
          called = true;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.be(true);
      });

      it('should only be emitted once per drag cycle', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = 0;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTab(args.index);
          called++;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.be(1);
        simulate(document.body, 'mousemove', { clientX: rect.right + 201, clientY: rect.top });
        expect(called).to.be(1);
      });

      it('should add the `p-mod-dragging` class to the tab and the bar', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(tab.classList.contains('p-mod-dragging')).to.be(true);
          expect(bar.hasClass('p-mod-dragging')).to.be(true);
          called = true;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.be(true);
      });

    });

    describe('#headerNode', () => {

      it('should get the tab bar header node', () => {
        let bar = new TabBar();
        expect(bar.headerNode.classList.contains('p-TabBar-header')).to.be(true);
      });

      it('should be read-only', () => {
        let bar = new TabBar();
        expect(() => { bar.headerNode = null; }).to.throwError();
      });

    });

    describe('#bodyNode', () => {

      it('should get the tab bar body node', () => {
        let bar = new TabBar();
        expect(bar.bodyNode.classList.contains('p-TabBar-body')).to.be(true);
      });

      it('should be read-only', () => {
        let bar = new TabBar();
        expect(() => { bar.bodyNode = null; }).to.throwError();
      });

    });

    describe('#footerNode', () => {

      it('should get the tab bar foorter node', () => {
        let bar = new TabBar();
        expect(bar.footerNode.classList.contains('p-TabBar-footer')).to.be(true);
      });

      it('should be read-only', () => {
        let bar = new TabBar();
        expect(() => { bar.footerNode = null; }).to.throwError();
      });

    });

    describe('#contentNode', () => {

      it('should get the tab bar content node', () => {
        let bar = new TabBar();
        expect(bar.contentNode.classList.contains('p-TabBar-content')).to.be(true);
      });

      it('should be read-only', () => {
        let bar = new TabBar();
        expect(() => { bar.contentNode = null; }).to.throwError();
      });

    });

    describe('#titles', () => {

      it('should get the read-only sequence of titles in the tab bar', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => { bar.addTab(t); });
        expect(toArray(bar.titles)).to.eql(titles);
      });

      it('should be read-only', () => {
        let bar = new TabBar();
        expect(() => { bar.titles = null; }).to.throwError();
      });

    });

    describe('#currentTitle', () => {

      it('should get the currently selected title', () => {
        let bar = createBar();
        expect(bar.currentTitle).to.be(bar.titles.at(0));
      });

      it('should be `null` if no tab is selected', () => {
        let bar = new TabBar();
        expect(bar.currentTitle).to.be(null);
      });

      it('should set the currently selected title', () => {
        let bar = createBar();
        let titles = toArray(bar.titles);
        bar.currentTitle = titles[1];
        expect(bar.currentTitle).to.be(titles[1]);
      });

      it('should set the title to `null` if the title does not exist', () => {
        let bar = createBar();
        bar.currentTitle =  new Title();
        expect(bar.currentTitle).to.be(null);
      });

    });

    describe('#currentIndex', () => {

      it('should get index of the currently selected tab', () => {
        let bar = createBar();
        expect(bar.currentIndex).to.be(0);
      });

      it('should be `null` if no tab is selected', () => {
        let bar = new TabBar();
        expect(bar.currentIndex).to.be(-1);
      });

      it('should set index of the currently selected tab', () => {
        let bar = createBar();
        bar.currentIndex = 1;
        expect(bar.currentIndex).to.be(1);
      });

      it('should set the index to `-1` if the value is out of range', () => {
        let bar = createBar();
        bar.currentIndex = -1;
        expect(bar.currentIndex).to.be(-1);
        bar.currentIndex = 10;
        expect(bar.currentIndex).to.be(-1);
      });

      it('should emit the `currentChanged` signal', () => {
        let bar = createBar();
        let titles = bar.titles;
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.previousIndex).to.be(0);
          expect(args.previousTitle).to.be(titles.at(0));
          expect(args.currentIndex).to.be(1);
          expect(args.currentTitle).to.be(titles.at(1));
          called = true;
        });
        bar.currentIndex = 1;
        expect(called).to.be(true);
      });

      it('should schedule an update of the tabs', (done) => {
        let bar = createBar();
        requestAnimationFrame(() => {
          bar.currentIndex = 1;
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
            done();
          });
        });
      });

      it('should be a no-op if the index does not change', (done) => {
        let bar = createBar();
        requestAnimationFrame(() => {
          bar.currentIndex = 0;
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.be(-1);
            done();
          });
        });
      });

    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {
        let bar = new TabBar();
        expect(bar.tabsMovable).to.be(false);
      });

      it('should set whether the tabs are movable by the user', () => {
        let bar = new TabBar();
        bar.tabsMovable = true;
        expect(bar.tabsMovable).to.be(true);
      });

      it('should still allow programmatic moves', () => {
        let bar = createBar();
        let titles = toArray(bar.titles);
        bar.insertTab(2, titles[0]);
        expect(bar.titles.at(2)).to.be(titles[0]);
      });

    });

    describe('#renderer', () => {

      it('should be the tab bar renderer', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let bar = new TabBar({ renderer });
        expect(bar.renderer).to.be(renderer);
      });

      it('should default to the default renderer', () => {
        let bar = new TabBar();
        expect(bar.renderer).to.be(TabBar.defaultRenderer);
      });

      it('should be read-only', () => {
        let bar = new TabBar();
        expect(() => { bar.renderer = null; }).to.throwError();
      });

    });

    describe('#addTab()', () => {

      it('should add a tab to the end of the tab bar', () => {
        let bar = createBar();
        let title = new Title();
        bar.addTab(title);
        expect(bar.titles.at(3)).to.be(title);
      });

      it('should accept a title options object', () => {
        let bar = new TabBar();
        bar.addTab({ label: 'foo' });
        expect(bar.titles.at(0)).to.be.a(Title);
        expect(bar.titles.at(0).label).to.be('foo');
      });

      it('should move an existing title to the end', () => {
        let bar = createBar();
        let titles = toArray(bar.titles);
        bar.addTab(titles[0]);
        expect(bar.titles.at(2)).to.be(titles[0]);
      });

    });

    describe('#insertTab()', () => {

      it('should insert a tab into the tab bar at the specified index', () => {
        let bar = createBar();
        let title = new Title();
        bar.insertTab(1, title);
        expect(bar.titles.at(1)).to.be(title);
      });

      it('should accept a title options object', () => {
        let bar = createBar();
        let title = bar.insertTab(1, { label: 'foo' });
        expect(title).to.be.a(Title);
        expect(title.label).to.be('foo');
      });

      it('should clamp the index to the bounds of the tabs', () => {
        let bar = createBar();
        let title = new Title();
        bar.insertTab(-1, title);
        expect(bar.titles.at(0)).to.be(title);
        title = new Title();
        bar.insertTab(10, title);
        expect(bar.titles.at(4)).to.be(title);
      });

      it('should move an existing tab', () => {
        let bar = createBar();
        let titles = toArray(bar.titles);
        bar.insertTab(1, titles[0]);
        expect(bar.titles.at(1)).to.be(titles[0]);
      });

      it('should schedule an update of the tabs', (done) => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Title());
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          done();
        });
      });

      it('should schedule an update if the title changes', (done) => {
        let bar = new LogTabBar();
        let title = new Title();
        bar.insertTab(0, title);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          bar.methods = [];
          title.label = 'foo';
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
            done();
          });
        });
      });

    });

    describe('#removeTab()', () => {

      it('should remove a tab from the tab bar by value', () => {
        let bar = createBar();
        let titles = toArray(bar.titles);
        bar.removeTab(titles[0]);
        expect(bar.titles.at(0)).to.be(titles[1]);
      });

      it('should remove a tab from the tab bar by index', () => {
        let bar = createBar();
        let titles = toArray(bar.titles);
        bar.removeTab(1);
        expect(bar.titles.at(1)).to.be(titles[2]);
      });

      it('should bail if the title is not in the tab bar', () => {
        let bar = createBar();
        bar.removeTab(new Title());
        expect(bar.titles.length).to.be(3);
      });

      it('should bail if the index is out of range', () => {
        let bar = createBar();
        bar.removeTab(-1);
        expect(bar.titles.length).to.be(3);
        bar.removeTab(3);
        expect(bar.titles.length).to.be(3);
      });

      it('should schedule an update of the tabs', (done) => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Title());
        requestAnimationFrame(() => {
          bar.removeTab(0);
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
            done();
          });
        });
      });

    });

    describe('#clearTabs()', () => {

      it('should remove all tabs from the tab bar', () => {
        let bar = createBar();
        bar.clearTabs();
        expect(bar.titles.length).to.be(0);
      });

      it('should be a no-op if there are no tabs', () => {
        let bar = new TabBar();
        bar.clearTabs();
        expect(bar.titles.length).to.be(0);
      });

      it('should emit the `currentChanged` signal if there was a selected tab', () => {
        let bar = createBar();
        let titles = toArray(bar.titles);
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.previousIndex).to.be(0);
          expect(args.previousTitle).to.be(titles[0]);
          expect(args.currentIndex).to.be(-1);
          expect(args.currentTitle).to.be(null);
          called = true;
        });
        bar.clearTabs();
        expect(called).to.be(true);
      });

      it('should not emit the `currentChanged` signal if there was no selected tab', () => {
        let bar = createBar();
        let called = false;
        bar.currentIndex = -1;
        bar.currentChanged.connect((sender, args) => { called = true; });
        bar.clearTabs();
        expect(called).to.be(false);
      });

    });

    describe('#releaseMouse()', () => {

      it('should release the mouse and restore the non-dragged tab positions', () => {
        let bar = createBar();
        startDrag(bar, 0, 'left');
        bar.releaseMouse();
        simulate(document.body, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.be(-1);
      });

    });

    describe('#handleEvent()', () => {

      let bar: LogTabBar;
      let tab: HTMLElement;
      let label: HTMLElement;
      let closeIcon: HTMLElement;

      beforeEach((done) => {
        bar = createBar();
        bar.tabsMovable = true;
        let content = bar.contentNode;
        tab = content.firstChild as HTMLElement;
        label = tab.getElementsByClassName('p-TabBar-tabLabel')[0] as HTMLElement;
        closeIcon = tab.getElementsByClassName('p-TabBar-tabCloseIcon')[0] as HTMLElement;
        closeIcon.textContent = 'X';
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => { done(); });
      });

      afterEach(() => {
        bar.dispose();
      });

      context('click', () => {

        it('should emit a tab close requested signal', () => {
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => {
            expect(sender).to.be(bar);
            expect(args.index).to.be(0);
            expect(args.title).to.be(bar.titles.at(0));
            called = true;
          });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.be(true);
        });

        it('should do nothing if it is not a left click', () => {
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top, button: 1 });
          expect(called).to.be(false);
        });

        it('should do nothing if a drag is in progress', () => {
          startDrag(bar, 1, 'up');
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.be(false);
        });

        it('should do nothing if the click is not on a tab', () => {
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(tab, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.be(false);
        });

        it('should do nothing if the tab is not closable', () => {
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          let title = bar.titles.at(0);
          title.closable = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.be(false);
        });

        it('should do nothing if the click is not on a close icon', () => {
          let rect = label.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(label, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.be(false);
        });

      });

      context('mousedown', () => {

        it('should add event listeners if the tabs are movable', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.not.be(-1);
        });

        it('should do nothing if not a left mouse press', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.be(-1);
        });

        it('should do nothing if the click is not on a tab', () => {
          simulate(tab, 'mousedown');
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.be(-1);
        });

        it('should do nothing if the click is on a close icon', () => {
          let rect = closeIcon.getBoundingClientRect();
          simulate(closeIcon, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.be(-1);
        });

        it('should do nothing if the tabs are not movable', () => {
          bar.tabsMovable = false;
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.be(-1);
        });

        it('should do nothing if there is a drag in progress', () => {
          startDrag(bar, 2, 'down');
          let rect = label.getBoundingClientRect();
          let evt = generate('mousedown', { clientX: rect.left, clientY: rect.top });
          tab.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(false);
        });

      });

      context('mousemove', () => {

        it('should do nothing if there is a drag in progress', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          let called = 0;
          bar.tabDetachRequested.connect((sender, args) => { called++; });
          rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.be(1);
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.be(1);
        });

        it('should bail if the drag threshold is not exceeded', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse();
            called = true;
          });
          rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 1, clientY: rect.top });
          expect(called).to.be(false);
        });

        it('should emit the detach requested signal if the threshold is exceeded', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            expect(sender).to.be(bar);
            expect(args.index).to.be(0);
            expect(args.title).to.be(bar.titles.at(0));
            expect(args.clientX).to.be(rect.right + 200);
            expect(args.clientY).to.be(rect.top);
            called = true;
          });
          rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.be(true);
        });

        it('should bail if the signal handler aborted the drag', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse();
            called = true;
          });
          rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.be(true);
          let left = rect.left;
          rect = label.getBoundingClientRect();
          expect(left).to.be(rect.left);
        });

        it('should update the positions of the tabs', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => { called = true; });
          rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.be(true);
          let left = rect.left;
          rect = label.getBoundingClientRect();
          expect(left).to.not.be(rect.left);
        });

      });

      context('mouseup', () => {

        it('should emit the `tabMoved` signal', (done) => {
          startDrag(bar);
          simulate(document.body, 'mouseup');
          bar.tabMoved.connect(() => { done(); });
        });

        it('should move the tab to its final position', (done) => {
          startDrag(bar);
          simulate(document.body, 'mouseup');
          let title = bar.titles.at(0);
          bar.tabMoved.connect(() => {
            expect(bar.titles.at(2)).to.be(title);
            done();
          });
        });

        it('should bail if it is not a left mouse release', () => {
          startDrag(bar);
          let evt = generate('mouseup', { button: 1 });
          document.body.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(false);
        });

        it('should bail if the drag is not active', (done) => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mouseup');
          let title = bar.titles.at(0);
          bar.methods = [];
          setTimeout(() => {
            expect(bar.titles.at(0)).to.be(title);
            expect(bar.methods.indexOf('onUpdateRequest')).to.be(-1);
            done();
          }, 200);
        });

      });

      context('keydown', () => {

        it('should prevent default', () => {
          startDrag(bar);
          let evt = generate('keydown');
          document.body.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(true);
        });

        it('should release the mouse if `Escape` is pressed', () => {
          startDrag(bar);
          simulate(document.body, 'keydown', { keyCode: 27 });
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          expect(bar.events.indexOf('mousemove')).to.be(-1);
        });

      });

      context('contextmenu', () => {

        it('should prevent default', () => {
          startDrag(bar);
          let evt = generate('contextmenu');
          document.body.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(true);
        });

      });

    });

    describe('#onAfterAttach()', () => {

      it('should add event listeners to the node', () => {
        let bar = new LogTabBar();
        Widget.attach(bar, document.body);
        simulate(bar.node, 'click');
        expect(bar.events.indexOf('click')).to.not.be(-1);
        simulate(bar.node, 'mousedown');
        expect(bar.events.indexOf('mousedown')).to.not.be(-1);
        bar.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should remove event listeners', () => {
        let bar = new LogTabBar();
        bar.addTab(new Title({ label: 'foo' }));
        Widget.attach(bar, document.body);
        let tab = bar.contentNode.firstChild as HTMLElement;
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        Widget.detach(bar);
        simulate(document.body, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.be(-1);
        simulate(bar.node, 'click');
        expect(bar.events.indexOf('click')).to.be(-1);
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should render tabs and set styles', (done) => {
        let bar = createBar();
        let tab = bar.contentNode.firstChild as HTMLElement;
        let title = bar.titles.at(0);
        let label = tab.getElementsByClassName('p-TabBar-tabLabel')[0] as HTMLElement;
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          expect(label.textContent).to.be(title.label);
          expect(tab.classList.contains('p-mod-current')).to.be(true);
          done();
        });
      });

    });

    describe('.ContentRenderer', () => {

      describe('#createTabNode()', () => {

        it('should create a node for a tab', () => {
          let renderer = new TabBar.ContentRenderer();
          let node = renderer.createTabNode();
          expect(node.classList.contains('p-TabBar-tab')).to.be(true);
          expect(node.getElementsByClassName('p-TabBar-tabIcon').length).to.be(1);
          expect(node.getElementsByClassName('p-TabBar-tabLabel').length).to.be(1);
          expect(node.getElementsByClassName('p-TabBar-tabCloseIcon').length).to.be(1);
        });

      });

      describe('#updateTabNode()', () => {

        it('should update a tab node to reflect the state of a title', () => {
          let title = new Title({
            label: 'foo',
            closable: true,
            icon: 'bar',
            className: 'fizz',
            caption: 'this is a caption'
          });
          let renderer = new TabBar.ContentRenderer();
          let node = renderer.createTabNode();
          renderer.updateTabNode(node, title);
          expect(node.classList.contains(title.className)).to.be(true);
          expect(node.classList.contains('p-mod-closable')).to.be(true);
          let icon = node.getElementsByClassName('p-TabBar-tabIcon')[0] as HTMLElement;
          expect(icon.classList.contains(title.icon)).to.be(true);
          let label = node.getElementsByClassName('p-TabBar-tabLabel')[0] as HTMLElement;
          expect(label.textContent).to.be(title.label);
          expect(label.title).to.be(title.caption);
        });

      });

      describe('#closeIconNode()', () => {

        it('should look up the close icon descendant node for a tab node', () => {
          let renderer = new TabBar.ContentRenderer();
          let node = renderer.createTabNode();
          let closeNode = renderer.closeIconNode(node);
          expect(closeNode.classList.contains('p-TabBar-tabCloseIcon')).to.be(true);
        });

      });

    });

    describe('.defaultRenderer', () => {

      it('should be a `ContentRenderer`', () => {
        expect(TabBar.defaultRenderer).to.be.a(TabBar.ContentRenderer);
      });

    });

  });

});
