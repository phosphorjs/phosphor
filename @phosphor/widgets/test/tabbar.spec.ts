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
  each, range, toArray
} from '@phosphor/algorithm';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  TabBar, Title, Widget
} from '@phosphor/widgets';

import {
  VirtualDOM
} from '@phosphor/virtualdom';


class LogTabBar extends TabBar<Widget> {

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


function populateBar(bar: TabBar<Widget>): void {
  // Add some tabs with labels.
  each(range(3), i => {
    let widget = new Widget();
    widget.title.label = `Test - ${i}`;
    widget.title.closable = true;
    bar.addTab(widget.title);
  });
  // Force the tabs to render
  MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
  // Add the close icon content.
  each(range(3), i => {
    let tab = bar.contentNode.children[i];
    let icon = tab.querySelector(bar.renderer.closeIconSelector);
    icon!.textContent = 'X';
  });
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
  expect(called).to.equal(true);
  bar.events = [];
}


describe('@phosphor/widgets', () => {

  describe('TabBar', () => {

    let bar: LogTabBar;

    beforeEach((done) => {
      bar = new LogTabBar();
      Widget.attach(bar, document.body);
    });

    afterEach(() => {
      bar.dispose();
    });

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let newBar = new TabBar<Widget>();
        expect(newBar).to.be.an.instanceof(TabBar);
      });

      it('should take an options argument', () => {
        let renderer = new TabBar.Renderer();
        let newBar = new TabBar<Widget>({
          orientation: 'horizontal',
          tabsMovable: true,
          allowDeselect: true,
          insertBehavior: 'select-tab',
          removeBehavior: 'select-previous-tab',
          renderer
        });
        expect(newBar).to.be.an.instanceof(TabBar);
        expect(newBar.tabsMovable).to.equal(true);
        expect(newBar.renderer).to.equal(renderer);
      });

      it('should add the `p-TabBar` class', () => {
        let newBar = new TabBar<Widget>();
        expect(newBar.hasClass('p-TabBar')).to.equal(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current tab is changed', () => {
        populateBar(bar);
        let called = false;
        let titles = bar.titles;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.previousIndex).to.equal(0);
          expect(args.previousTitle).to.equal(titles[0]);
          expect(args.currentIndex).to.equal(1);
          expect(args.currentTitle).to.equal(titles[1]);
          called = true;
        });
        bar.currentTitle = titles[1];
        expect(called).to.equal(true);
      });

      it('should not be emitted when another tab is inserted', () => {
        populateBar(bar);
        let called = false;
        bar.currentChanged.connect((sender, args) => { called = true; });
        let widget = new Widget();
        bar.insertTab(0, widget.title);
        expect(called).to.equal(false);
      });

      it('should not be emitted when another tab is removed', () => {
        populateBar(bar);
        let called = false;
        bar.currentIndex = 1;
        bar.currentChanged.connect((sender, args) => { called = true; });
        bar.removeTab(bar.titles[0]);
        expect(called).to.equal(false);
      });

      it('should not be emitted when the current tab is moved', () => {
        populateBar(bar);
        let called = false;
        bar.currentChanged.connect((sender, args) => { called = true; });
        bar.insertTab(2, bar.titles[0]);
        expect(called).to.equal(false);
      });

    });

    describe('#tabMoved', () => {

      it('should be emitted when a tab is moved right by the user', (done) => {
        populateBar(bar);
        let called = false;
        bar.tabMoved.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.fromIndex).to.equal(0);
          expect(args.toIndex).to.equal(2);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        startDrag(bar);
        simulate(document.body, 'mouseup');
        expect(called).to.equal(true);
      });

      it('should be emitted when a tab is moved left by the user', () => {
        populateBar(bar);
        let called = false;
        bar.tabMoved.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.fromIndex).to.equal(2);
          expect(args.toIndex).to.equal(0);
          expect(args.title).to.equal(bar.titles[2]);
          called = true;
        });
        startDrag(bar, 2, 'left');
        simulate(document.body, 'mouseup');
        expect(called).to.equal(true);
      });

      it('should not be emitted when a tab is moved programmatically', () => {
        populateBar(bar);
        let called = false;
        bar.tabMoved.connect((sender, args) => { called = true; });
        bar.insertTab(2, bar.titles[0]);
        expect(called).to.equal(false);
      });

    });

    describe('#tabActivateRequested', () => {

      it('should be emitted when a tab is clicked by the user', () => {
        populateBar(bar)
        let called = false;
        bar.tabActivateRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(2);
          expect(args.title).to.equal(bar.titles[2]);
          called = true;
        });
        let tab = bar.contentNode.getElementsByClassName('p-TabBar-tab')[2] as HTMLElement;
        simulate(tab, 'click');
        expect(called).to.equal(true);
      });

      it('should make the tab current and emit the `currentChanged` signal', () => {
        populateBar(bar);
        let called = 0;
        bar.currentIndex = 1;
        bar.tabActivateRequested.connect(() => { called++; });
        bar.currentChanged.connect(() => { called++; });
        let tab = bar.contentNode.getElementsByClassName('p-TabBar-tab')[2] as HTMLElement;
        simulate(tab, 'click');
        expect(bar.currentIndex).to.equal(2);
        expect(called).to.equal(2);
      });

      it('should emit even if the clicked tab is the current tab', () => {
        populateBar(bar);
        let called = 0;
        bar.currentIndex = 2;
        bar.tabActivateRequested.connect(() => { called++; });
        let tab = bar.contentNode.getElementsByClassName('p-TabBar-tab')[2] as HTMLElement;
        simulate(tab, 'click');
        expect(bar.currentIndex).to.equal(2);
        expect(called).to.equal(2);
      });

    });

    describe('#tabCloseRequested', () => {

      let closeIcon: Element;

      beforeEach(() => {
        populateBar(bar);
        let tab = bar.contentNode.children[bar.currentIndex];
        closeIcon = tab.querySelector(bar.renderer.closeIconSelector)!;
      });

      it('should be emitted when a tab close icon is clicked', () => {
        let rect = closeIcon.getBoundingClientRect();
        let called = false;
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
        expect(called).to.equal(true);
      });

      it('should not be emitted if the tab title is not `closable`', () => {
        let rect = closeIcon.getBoundingClientRect();
        let called = false;
        let title = bar.titles[0];
        title.closable = false;
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
        expect(called).to.equal(false);
      });

    });

    describe('#tabDetachRequested', () => {

      let tab: HTMLElement;

      beforeEach(() => {
        populateBar(bar);
        bar.tabsMovable = true;
        tab = bar.contentNode.children[bar.currentIndex] as HTMLElement;
      });

      it('should be emitted when a tab is dragged beyond the detach threshold', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          expect(args.clientX).to.equal(rect.right + 200);
          expect(args.clientY).to.equal(rect.top);
          called = true;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(true);
      });

      it('should be handled by calling `releaseMouse` and removing the tab', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTabAt(args.index);
          called = true;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(true);
      });

      it('should only be emitted once per drag cycle', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = 0;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTabAt(args.index);
          called++;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(1);
        simulate(document.body, 'mousemove', { clientX: rect.right + 201, clientY: rect.top });
        expect(called).to.equal(1);
      });

      it('should add the `p-mod-dragging` class to the tab and the bar', () => {
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(tab.classList.contains('p-mod-dragging')).to.equal(true);
          expect(bar.hasClass('p-mod-dragging')).to.equal(true);
          called = true;
        });
        rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(true);
      });

    });

    describe('#contentNode', () => {

      it('should get the tab bar content node', () => {
        let bar = new TabBar<Widget>();
        expect(bar.contentNode.classList.contains('p-TabBar-content')).to.equal(true);
      });

    });

    describe('#titles', () => {

      it('should get the read-only sequence of titles in the tab bar', () => {
        let bar = new TabBar<Widget>();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, widget => { bar.addTab(widget.title); });
        each(bar.titles, (title, i) => {
          expect(title.owner).to.equal(widgets[i]);
        });
      });

    });

    describe('#currentTitle', () => {

      it('should get the currently selected title', () => {
        populateBar(bar);
        expect(bar.currentTitle).to.equal(bar.titles[0]);
      });

      it('should be `null` if no tab is selected', () => {
        let bar = new TabBar<Widget>();
        expect(bar.currentTitle).to.equal(null);
      });

      it('should set the currently selected title', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        bar.currentTitle = titles[1];
        expect(bar.currentTitle).to.equal(titles[1]);
      });

      it('should set the title to `null` if the title does not exist', () => {
        populateBar(bar);
        bar.currentTitle =  new Widget().title;
        expect(bar.currentTitle).to.equal(null);
      });

    });

    describe('#currentIndex', () => {

      it('should get index of the currently selected tab', () => {
        populateBar(bar);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should be `null` if no tab is selected', () => {
        let bar = new TabBar<Widget>();
        expect(bar.currentIndex).to.equal(-1);
      });

      it('should set index of the currently selected tab', () => {
        populateBar(bar);
        bar.currentIndex = 1;
        expect(bar.currentIndex).to.equal(1);
      });

      it('should set the index to `-1` if the value is out of range', () => {
        populateBar(bar);
        bar.currentIndex = -1;
        expect(bar.currentIndex).to.equal(-1);
        bar.currentIndex = 10;
        expect(bar.currentIndex).to.equal(-1);
      });

      it('should emit the `currentChanged` signal', () => {
        populateBar(bar);
        let titles = bar.titles;
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.previousIndex).to.equal(0);
          expect(args.previousTitle).to.equal(titles[0]);
          expect(args.currentIndex).to.equal(1);
          expect(args.currentTitle).to.equal(titles[1]);
          called = true;
        });
        bar.currentIndex = 1;
        expect(called).to.equal(true);
      });

      it('should schedule an update of the tabs', (done) => {
        populateBar(bar);
        requestAnimationFrame(() => {
          bar.currentIndex = 1;
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });

      it('should be a no-op if the index does not change', (done) => {
        populateBar(bar);
        requestAnimationFrame(() => {
          bar.currentIndex = 0;
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.equal(-1);
            done();
          });
        });
      });

    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {
        let bar = new TabBar<Widget>();
        expect(bar.tabsMovable).to.equal(false);
      });

      it('should set whether the tabs are movable by the user', () => {
        let bar = new TabBar<Widget>();
        bar.tabsMovable = true;
        expect(bar.tabsMovable).to.equal(true);
      });

      it('should still allow programmatic moves', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        bar.insertTab(2, titles[0]);
        expect(bar.titles[2]).to.equal(titles[0]);
      });

    });

    describe('#renderer', () => {

      it('should be the tab bar renderer', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let bar = new TabBar<Widget>({ renderer });
        expect(bar.renderer).to.equal(renderer);
      });

      it('should default to the default renderer', () => {
        let bar = new TabBar<Widget>();
        expect(bar.renderer).to.equal(TabBar.defaultRenderer);
      });

    });

    describe('#addTab()', () => {

      it('should add a tab to the end of the tab bar', () => {
        populateBar(bar);
        let title = new Widget().title;
        bar.addTab(title);
        expect(bar.titles[3]).to.equal(title);
      });

      it('should accept a title options object', () => {
        let bar = new TabBar<Widget>();
        let owner = new Widget();
        bar.addTab({ owner, label: 'foo' });
        expect(bar.titles[0]).to.be.an.instanceof(Title);
        expect(bar.titles[0].label).to.equal('foo');
      });

      it('should move an existing title to the end', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        bar.addTab(titles[0]);
        expect(bar.titles[2]).to.equal(titles[0]);
      });

    });

    describe('#insertTab()', () => {

      it('should insert a tab into the tab bar at the specified index', () => {
        populateBar(bar);
        let title = new Widget().title;
        bar.insertTab(1, title);
        expect(bar.titles[1]).to.equal(title);
      });

      it('should accept a title options object', () => {
        populateBar(bar);
        let title = bar.insertTab(1, { owner: new Widget(), label: 'foo' });
        expect(title).to.be.an.instanceof(Title);
        expect(title.label).to.equal('foo');
      });

      it('should clamp the index to the bounds of the tabs', () => {
        populateBar(bar);
        let title = new Widget().title;
        bar.insertTab(-1, title);
        expect(bar.titles[0]).to.equal(title);
        title = new Widget().title;
        bar.insertTab(10, title);
        expect(bar.titles[4]).to.equal(title);
      });

      it('should move an existing tab', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        bar.insertTab(1, titles[0]);
        expect(bar.titles[1]).to.equal(titles[0]);
      });

      it('should schedule an update of the tabs', (done) => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Widget().title);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
          done();
        });
      });

      it('should schedule an update if the title changes', (done) => {
        let bar = new LogTabBar();
        let title = new Widget().title;
        bar.insertTab(0, title);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
          bar.methods = [];
          title.label = 'foo';
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });

    });

    describe('#removeTab()', () => {

      it('should remove a tab from the tab bar by value', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        bar.removeTab(titles[0]);
        expect(bar.titles[0]).to.equal(titles[1]);
      });

      it('should return the index of the removed tab', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        expect(bar.removeTab(titles[0])).to.equal(0);
      });

      it('should return `-1` if the title is not in the tab bar', () => {
        populateBar(bar);
        expect(bar.removeTab(new Widget().title)).to.equal(-1);
      });

      it('should schedule an update of the tabs', (done) => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Widget().title);
        requestAnimationFrame(() => {
          bar.removeTab(bar.titles[0]);
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });

    });

    describe('#removeTabAt()', () => {

      it('should remove a tab at a specific index', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        bar.removeTabAt(0);
        expect(bar.titles[0]).to.equal(titles[1]);
      });

      it('should return the removed title', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        expect(bar.removeTabAt(0)).to.equal(titles[0]);
      });

      it('should return `null` if the index is out of range', () => {
        populateBar(bar);
        expect(bar.removeTabAt(9)).to.equal(null);
      });

      it('should schedule an update of the tabs', (done) => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Widget().title);
        requestAnimationFrame(() => {
          bar.removeTabAt(0);
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });

    });

    describe('#clearTabs()', () => {

      it('should remove all tabs from the tab bar', () => {
        populateBar(bar);
        bar.clearTabs();
        expect(bar.titles.length).to.equal(0);
      });

      it('should be a no-op if there are no tabs', () => {
        let bar = new TabBar<Widget>();
        bar.clearTabs();
        expect(bar.titles.length).to.equal(0);
      });

      it('should emit the `currentChanged` signal if there was a selected tab', () => {
        populateBar(bar);
        let titles = toArray(bar.titles);
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.previousIndex).to.equal(0);
          expect(args.previousTitle).to.equal(titles[0]);
          expect(args.currentIndex).to.equal(-1);
          expect(args.currentTitle).to.equal(null);
          called = true;
        });
        bar.clearTabs();
        expect(called).to.equal(true);
      });

      it('should not emit the `currentChanged` signal if there was no selected tab', () => {
        populateBar(bar);
        let called = false;
        bar.currentIndex = -1;
        bar.currentChanged.connect((sender, args) => { called = true; });
        bar.clearTabs();
        expect(called).to.equal(false);
      });

    });

    describe('#releaseMouse()', () => {

      it('should release the mouse and restore the non-dragged tab positions', () => {
        populateBar(bar);
        startDrag(bar, 0, 'left');
        bar.releaseMouse();
        simulate(document.body, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.equal(-1);
      });

    });

    describe('#handleEvent()', () => {

      let bar: LogTabBar;
      let tab: HTMLElement;
      let label: HTMLElement;
      let closeIcon: HTMLElement;

      beforeEach((done) => {
        bar = new LogTabBar();
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
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            called = true;
          });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.equal(true);
        });

        it('should do nothing if it is not a left click', () => {
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top, button: 1 });
          expect(called).to.equal(false);
        });

        it('should do nothing if a drag is in progress', () => {
          startDrag(bar, 1, 'up');
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.equal(false);
        });

        it('should do nothing if the click is not on a tab', () => {
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(tab, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.equal(false);
        });

        it('should do nothing if the tab is not closable', () => {
          let rect = closeIcon.getBoundingClientRect();
          let called = false;
          let title = bar.titles[0];
          title.closable = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.equal(false);
        });

        it('should do nothing if the click is not on a close icon', () => {
          let rect = label.getBoundingClientRect();
          let called = false;
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(label, 'click', { clientX: rect.left, clientY: rect.top });
          expect(called).to.equal(false);
        });

      });

      context('mousedown', () => {

        it('should add event listeners if the tabs are movable', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.not.equal(-1);
        });

        it('should do nothing if not a left mouse press', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if the click is not on a tab', () => {
          simulate(tab, 'mousedown');
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if the click is on a close icon', () => {
          let rect = closeIcon.getBoundingClientRect();
          simulate(closeIcon, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if the tabs are not movable', () => {
          bar.tabsMovable = false;
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if there is a drag in progress', () => {
          startDrag(bar, 2, 'down');
          let rect = label.getBoundingClientRect();
          let evt = generate('mousedown', { clientX: rect.left, clientY: rect.top });
          let cancelled = !tab.dispatchEvent(evt);
          expect(cancelled).to.equal(false);
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
          expect(called).to.equal(1);
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(1);
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
          expect(called).to.equal(false);
        });

        it('should emit the detach requested signal if the threshold is exceeded', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            expect(args.clientX).to.equal(rect.right + 200);
            expect(args.clientY).to.equal(rect.top);
            called = true;
          });
          rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(true);
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
          expect(called).to.equal(true);
          let left = rect.left;
          rect = label.getBoundingClientRect();
          expect(left).to.equal(rect.left);
        });

        it('should update the positions of the tabs', () => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => { called = true; });
          rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(true);
          let left = rect.left;
          rect = label.getBoundingClientRect();
          expect(left).to.not.equal(rect.left);
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
          let title = bar.titles[0];
          bar.tabMoved.connect(() => {
            expect(bar.titles[2]).to.equal(title);
            done();
          });
        });

        it('should bail if it is not a left mouse release', () => {
          startDrag(bar);
          let evt = generate('mouseup', { button: 1 });
          let cancelled = !document.body.dispatchEvent(evt);
          expect(cancelled).to.equal(false);
        });

        it('should bail if the drag is not active', (done) => {
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mouseup');
          let title = bar.titles[0];
          bar.methods = [];
          setTimeout(() => {
            expect(bar.titles[0]).to.equal(title);
            expect(bar.methods.indexOf('onUpdateRequest')).to.equal(-1);
            done();
          }, 200);
        });

      });

      context('keydown', () => {

        it('should prevent default', () => {
          startDrag(bar);
          let evt = generate('keydown');
          let cancelled = !document.body.dispatchEvent(evt);
          expect(cancelled).to.equal(true);
        });

        it('should release the mouse if `Escape` is pressed', () => {
          startDrag(bar);
          simulate(document.body, 'keydown', { keyCode: 27 });
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

      });

      context('contextmenu', () => {

        it('should prevent default', () => {
          startDrag(bar);
          let evt = generate('contextmenu');
          let cancelled = !document.body.dispatchEvent(evt);
          expect(cancelled).to.equal(true);
        });

      });

    });

    describe('#onAfterAttach()', () => {

      it('should add event listeners to the node', () => {
        let bar = new LogTabBar();
        Widget.attach(bar, document.body);
        simulate(bar.node, 'click');
        expect(bar.events.indexOf('click')).to.not.equal(-1);
        simulate(bar.node, 'mousedown');
        expect(bar.events.indexOf('mousedown')).to.not.equal(-1);
        bar.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should remove event listeners', () => {
        let bar = new LogTabBar();
        let owner = new Widget();
        bar.addTab(new Title({ owner, label: 'foo' }));
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        Widget.attach(bar, document.body);
        let tab = bar.contentNode.firstChild as HTMLElement;
        let rect = tab.getBoundingClientRect();
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
        Widget.detach(bar);
        simulate(document.body, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.equal(-1);
        simulate(bar.node, 'click');
        expect(bar.events.indexOf('click')).to.equal(-1);
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should render tabs and set styles', (done) => {
        populateBar(bar);
        let tab = bar.contentNode.firstChild as HTMLElement;
        let title = bar.titles[0];
        let label = tab.getElementsByClassName('p-TabBar-tabLabel')[0] as HTMLElement;
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
          expect(label.textContent).to.equal(title.label);
          expect(tab.classList.contains('p-mod-current')).to.equal(true);
          done();
        });
      });

    });

    describe('.Renderer', () => {

      describe('#closeIconSelector', () => {

        it('should be `.p-TabBar-tabCloseIcon`', () => {
          let renderer = new TabBar.Renderer();
          expect(renderer.closeIconSelector).to.equal('.p-TabBar-tabCloseIcon');
        });

      });

      describe('#renderTab()', () => {

        it('should render a virtual node for a tab', () => {
          let owner = new Widget();
          let title = new Title({
            owner,
            label: 'foo',
            closable: true,
            icon: 'bar',
            className: 'fizz',
            caption: 'this is a caption'
          });

          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderTab({ title, current: true, zIndex: 1 });
          let node = VirtualDOM.realize(vNode);

          expect(node.getElementsByClassName('p-TabBar-tabIcon').length).to.equal(1);
          expect(node.getElementsByClassName('p-TabBar-tabLabel').length).to.equal(1);
          expect(node.getElementsByClassName('p-TabBar-tabCloseIcon').length).to.equal(1);

          expect(node.classList.contains('p-TabBar-tab')).to.equal(true);
          expect(node.classList.contains(title.className)).to.equal(true);
          expect(node.classList.contains('p-mod-current')).to.equal(true);
          expect(node.classList.contains('p-mod-closable')).to.equal(true);
          expect(node.title).to.equal(title.caption);

          let icon = node.getElementsByClassName('p-TabBar-tabIcon')[0] as HTMLElement;
          let label = node.getElementsByClassName('p-TabBar-tabLabel')[0] as HTMLElement;
          expect(icon.classList.contains(title.icon)).to.equal(true);
          expect(label.textContent).to.equal(title.label);
        });

      });

    });

    describe('.defaultRenderer', () => {

      it('should be an instance of `Renderer`', () => {
        expect(TabBar.defaultRenderer).to.be.an.instanceof(TabBar.Renderer);
      });

    });

  });

});
