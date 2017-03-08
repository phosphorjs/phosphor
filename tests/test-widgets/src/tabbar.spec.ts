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
  each, range
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
  bar.currentIndex = index;
  // Force an update.
  MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
  simulateOnNode(tab, 'mousedown');
  let called = true;
  bar.tabDetachRequested.connect((sender, args) => { called = true; });
  let rect = bar.contentNode.getBoundingClientRect();
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


function simulateOnNode(node: Element, eventName: string): void {
  let rect = node.getBoundingClientRect();
  simulate(node, eventName, { clientX: rect.left + 1, clientY: rect.top });
}


describe('@phosphor/widgets', () => {

  describe('TabBar', () => {

    let bar: LogTabBar;

    beforeEach(() => {
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
        let titles = bar.titles.slice();
        bar.tabMoved.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.fromIndex).to.equal(0);
          expect(args.toIndex).to.equal(2);
          expect(args.title).to.equal(titles[0]);
          done();
        });
        startDrag(bar);
        simulate(document.body, 'mouseup');
      });

      it('should be emitted when a tab is moved left by the user', (done) => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.tabMoved.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.fromIndex).to.equal(2);
          expect(args.toIndex).to.equal(0);
          expect(args.title).to.equal(titles[2]);
          done();
        });
        startDrag(bar, 2, 'left');
        simulate(document.body, 'mouseup');
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

      let tab: HTMLElement;

      beforeEach(() => {
        populateBar(bar);
        bar.tabsMovable = false;
        tab = bar.contentNode.getElementsByClassName('p-TabBar-tab')[2] as HTMLElement;
      });

      it('should be emitted when a tab is left pressed by the user', () => {
        let called = false;
        bar.currentIndex = 0;
        // Force an update.
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        bar.tabActivateRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(2);
          expect(args.title).to.equal(bar.titles[2]);
          called = true;
        });
        simulateOnNode(tab, 'mousedown');
        expect(called).to.equal(true);
      });

      it('should make the tab current and emit the `currentChanged` signal', () => {
        let called = 0;
        bar.currentIndex = 1;
        // Force an update.
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        bar.tabActivateRequested.connect(() => { called++; });
        bar.currentChanged.connect(() => { called++; });
        simulateOnNode(tab, 'mousedown');
        expect(bar.currentIndex).to.equal(2);
        expect(called).to.equal(2);
      });

      it('should emit even if the pressed tab is the current tab', () => {
        let called = false;
        bar.currentIndex = 2;
        // Force an update.
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        bar.tabActivateRequested.connect(() => { called = true; });
        simulateOnNode(tab, 'mousedown');
        expect(bar.currentIndex).to.equal(2);
        expect(called).to.equal(true);
      });

    });

    describe('#tabCloseRequested', () => {

      let tab: Element;
      let closeIcon: Element;

      beforeEach(() => {
        populateBar(bar);
        bar.currentIndex = 0;
        tab = bar.contentNode.children[0];
        closeIcon = tab.querySelector(bar.renderer.closeIconSelector)!;
      });

      it('should be emitted when a tab close icon is left clicked', () => {
        let called = false;
        let rect = closeIcon.getBoundingClientRect();
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        simulate(closeIcon, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 0 });
        simulate(closeIcon, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 0 });
        expect(called).to.equal(true);
      });

      it('should be emitted when a tab is middle clicked', () => {
        let called = false;
        let rect = tab.getBoundingClientRect();
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
        simulate(tab, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 1 });
        expect(called).to.equal(true);
      });

      it('should not be emitted if the tab title is not `closable`', () => {
        let called = false;
        let title = bar.titles[0];
        title.closable = false;
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        let rect1 = closeIcon.getBoundingClientRect();
        let rect2 = tab.getBoundingClientRect();
        simulate(closeIcon, 'mousedown', { clientX: rect1.left, clientY: rect1.top, button: 0 });
        simulate(closeIcon, 'mouseup', { clientX: rect1.left, clientY: rect1.top, button: 0 });
        simulate(tab, 'mousedown', { clientX: rect2.left, clientY: rect2.top, button: 1 });
        simulate(tab, 'mouseup', { clientX: rect2.left, clientY: rect2.top, button: 1 });
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
        simulateOnNode(tab, 'mousedown');
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          expect(args.clientX).to.equal(rect.right + 200);
          expect(args.clientY).to.equal(rect.top);
          called = true;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(true);
      });

      it('should be handled by calling `releaseMouse` and removing the tab', () => {
        simulateOnNode(tab, 'mousedown');
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTabAt(args.index);
          called = true;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(true);
      });

      it('should only be emitted once per drag cycle', () => {
        simulateOnNode(tab, 'mousedown');
        let called = 0;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTabAt(args.index);
          called++;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(1);
        simulate(document.body, 'mousemove', { clientX: rect.right + 201, clientY: rect.top });
        expect(called).to.equal(1);
      });

      it('should add the `p-mod-dragging` class to the tab and the bar', () => {
        simulateOnNode(tab, 'mousedown');
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(tab.classList.contains('p-mod-dragging')).to.equal(true);
          expect(bar.hasClass('p-mod-dragging')).to.equal(true);
          called = true;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
        expect(called).to.equal(true);
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
        let titles = bar.titles.slice();
        bar.insertTab(2, titles[0]);
        expect(bar.titles[2]).to.equal(titles[0]);
      });

    });

    describe('#allowDeselect', () => {

      it('should determine whether a tab can be deselected by the user', () => {
        populateBar(bar);
        bar.allowDeselect = false;
        bar.tabsMovable = false;
        bar.currentIndex = 2;
        // Force the tabs to render
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        let tab = bar.contentNode.getElementsByClassName('p-TabBar-tab')[2] as HTMLElement;
        simulateOnNode(tab, 'mousedown');
        expect(bar.currentIndex).to.equal(2);
        simulateOnNode(tab, 'mouseup');

        bar.allowDeselect = true;
        simulateOnNode(tab, 'mousedown');
        expect(bar.currentIndex).to.equal(-1);
        simulateOnNode(tab, 'mouseup');
      });

      it('should always allow programmatic deselection', () => {
        populateBar(bar);
        bar.allowDeselect = false;
        bar.currentIndex = -1;
        expect(bar.currentIndex).to.equal(-1);
      });

    });

    describe('#insertBehavior', () => {

      it('should not change the selection', () => {
        populateBar(bar);
        bar.insertBehavior = 'none';
        bar.currentIndex = 0;
        bar.insertTab(2, new Widget().title);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should select the tab', () => {
        populateBar(bar);
        bar.insertBehavior = 'select-tab';
        bar.currentIndex = 0;
        bar.insertTab(2, new Widget().title);
        expect(bar.currentIndex).to.equal(2);

        bar.currentIndex = -1;
        bar.insertTab(1, new Widget().title);
        expect(bar.currentIndex).to.equal(1);
      });

      it('should select the tab if needed', () => {
        populateBar(bar);
        bar.insertBehavior = 'select-tab-if-needed';
        bar.currentIndex = 0;
        bar.insertTab(2, new Widget().title);
        expect(bar.currentIndex).to.equal(0);

        bar.currentIndex = -1;
        bar.insertTab(1, new Widget().title);
        expect(bar.currentIndex).to.equal(1);
      });

    });

    describe('#removeBehavior', () => {

      it('should select no tab', () => {
        populateBar(bar);
        bar.removeBehavior = 'none';
        bar.currentIndex = 2;
        bar.removeTabAt(2);
        expect(bar.currentIndex).to.equal(-1);
      });

      it('should select the tab after the removed tab if possible', () => {
        populateBar(bar);
        bar.removeBehavior = 'select-tab-after';
        bar.currentIndex = 0;
        bar.removeTabAt(0);
        expect(bar.currentIndex).to.equal(0);

        bar.currentIndex = 1;
        bar.removeTabAt(1);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should select the tab before the removed tab if possible', () => {
        populateBar(bar);
        bar.removeBehavior = 'select-tab-before';
        bar.currentIndex = 1;
        bar.removeTabAt(1);
        expect(bar.currentIndex).to.equal(0);
        bar.removeTabAt(0);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should select the previously selected tab if possible', () => {
        populateBar(bar);
        bar.removeBehavior = 'select-previous-tab';
        bar.currentIndex = 0;
        bar.currentIndex = 2;
        bar.removeTabAt(2);
        expect(bar.currentIndex).to.equal(0);

        // Reset the bar.
        bar.removeTabAt(0);
        bar.removeTabAt(0);
        populateBar(bar);

        bar.currentIndex = 1;
        bar.removeTabAt(1);
        expect(bar.currentIndex).to.equal(0);
      });

    });

    describe('#currentTitle', () => {

      it('should get the currently selected title', () => {
        populateBar(bar);
        bar.currentIndex = 0;
        expect(bar.currentTitle).to.equal(bar.titles[0]);
      });

      it('should be `null` if no tab is selected', () => {
        populateBar(bar);
        bar.currentIndex = -1;
        expect(bar.currentTitle).to.equal(null);
      });

      it('should set the currently selected title', () => {
        populateBar(bar);
        bar.currentTitle = bar.titles[1];
        expect(bar.currentTitle).to.equal(bar.titles[1]);
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

    describe('#orientation', () => {

      it('should be the orientation of the tab bar', () => {
        expect(bar.orientation).to.equal('horizontal');
        bar.orientation = 'vertical';
        expect(bar.orientation).to.equal('vertical');
      });

      it('should set the orientation attribute of the tab bar', () => {
        bar.orientation = 'horizontal';
        expect(bar.node.getAttribute('data-orientation')).to.equal('horizontal');
        bar.orientation = 'vertical';
        expect(bar.node.getAttribute('data-orientation')).to.equal('vertical');
      });

    });

    describe('#titles', () => {

      it('should get the read-only array of titles in the tab bar', () => {
        let bar = new TabBar<Widget>();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, widget => { bar.addTab(widget.title); });
        expect(bar.titles.length).to.equal(3);
        each(bar.titles, (title, i) => {
          expect(title.owner).to.equal(widgets[i]);
        });
      });

    });

    describe('#contentNode', () => {

      it('should get the tab bar content node', () => {
        expect(bar.contentNode.classList.contains('p-TabBar-content')).to.equal(true);
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
        let owner = new Widget();
        bar.addTab({ owner, label: 'foo' });
        expect(bar.titles[0]).to.be.an.instanceof(Title);
        expect(bar.titles[0].label).to.equal('foo');
      });

      it('should move an existing title to the end', () => {
        populateBar(bar);
        let titles = bar.titles.slice();
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
        let titles = bar.titles.slice();
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
        let titles = bar.titles.slice();
        bar.removeTab(titles[0]);
        expect(bar.titles[0]).to.equal(titles[1]);
      });

      it('should return be a no-op if the title is not in the tab bar', () => {
        populateBar(bar);
        bar.removeTab(new Widget().title);
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
        let titles = bar.titles.slice();
        bar.removeTabAt(0);
        expect(bar.titles[0]).to.equal(titles[1]);
      });

      it('should return be a no-op if the index is out of range', () => {
        populateBar(bar);
        bar.removeTabAt(9);
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
        let called = false;
        bar.currentIndex = 0;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.previousIndex).to.equal(0);
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

      let tab: Element;
      let closeIcon: Element;

      beforeEach(() => {
        bar.tabsMovable = true;
        populateBar(bar);
        bar.currentIndex = 0;
        tab = bar.contentNode.children[0];
        closeIcon = tab.querySelector(bar.renderer.closeIconSelector)!;
      });

      context('left click', () => {

        it('should emit a tab close requested signal', () => {
          let called = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            called = true;
          });
          simulate(closeIcon, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 0 });
          simulate(closeIcon, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 0 });
          expect(called).to.equal(true);
        });

        it('should do nothing if a drag is in progress', () => {
          startDrag(bar, 1, 'up');
          let called = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 0 });
          simulate(closeIcon, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 0 });
          expect(called).to.equal(false);
        });

        it('should do nothing if the click is not on a close icon', () => {
          let called = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 0 });
          simulate(closeIcon, 'mouseup', { clientX: rect.left - 1, clientY: rect.top - 1, button: 0 });
          expect(called).to.equal(false);
          expect(called).to.equal(false);
        });

        it('should do nothing if the tab is not closable', () => {
          let called = false;
          bar.titles[0].closable = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(closeIcon, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 0 });
          simulate(closeIcon, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 0 });
          expect(called).to.equal(false);
        });

      });

      context('middle click', () => {

        it('should emit a tab close requested signal', () => {
          let called = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            called = true;
          });
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
          simulate(tab, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 1 });
          expect(called).to.equal(true);
        });

        it('should do nothing if a drag is in progress', () => {
          startDrag(bar, 1, 'up');
          let called = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
          simulate(tab, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 1 });
          expect(called).to.equal(false);
        });

        it('should do nothing if the click is not on the tab', () => {
          let called = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
          simulate(tab, 'mouseup', { clientX: rect.left - 1, clientY: rect.top - 1, button: 1 });
          expect(called).to.equal(false);
          expect(called).to.equal(false);
        });

        it('should do nothing if the tab is not closable', () => {
          let called = false;
          bar.titles[0].closable = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => { called = true; });
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
          simulate(tab, 'mouseup', { clientX: rect.left, clientY: rect.top, button: 1 });
          expect(called).to.equal(false);
        });

      });

      context('mousedown', () => {

        it('should add event listeners if the tabs are movable', () => {
          simulateOnNode(tab, 'mousedown');
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.not.equal(-1);
        });

        it('should do nothing if not a left mouse press', () => {
          let rect = tab.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top, button: 1 });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if the press is not on a tab', () => {
          let rect = tab.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left - 1, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if the press is on a close icon', () => {
          simulateOnNode(closeIcon, 'mousedown');
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if the tabs are not movable', () => {
          bar.tabsMovable = false;
          simulateOnNode(tab, 'mousedown');
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.equal(-1);
        });

        it('should do nothing if there is a drag in progress', () => {
          startDrag(bar, 2, 'down');
          let rect = tab.getBoundingClientRect();
          let evt = generate('mousedown', { clientX: rect.left, clientY: rect.top });
          let cancelled = !tab.dispatchEvent(evt);
          expect(cancelled).to.equal(false);
        });

      });

      context('mousemove', () => {

        it('should do nothing if there is a drag in progress', () => {
          simulateOnNode(tab, 'mousedown');
          let called = 0;
          bar.tabDetachRequested.connect((sender, args) => { called++; });
          let rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(1);
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(1);
        });

        it('should bail if the drag threshold is not exceeded', () => {
          simulateOnNode(tab, 'mousedown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse();
            called = true;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 1, clientY: rect.top });
          expect(called).to.equal(false);
        });

        it('should emit the detach requested signal if the threshold is exceeded', () => {
          simulateOnNode(tab, 'mousedown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            expect(args.clientX).to.equal(rect.right + 200);
            expect(args.clientY).to.equal(rect.top);
            called = true;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(true);
        });

        it('should bail if the signal handler aborted the drag', () => {
          simulateOnNode(tab, 'mousedown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse();
            called = true;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(true);
          let left = rect.left;
          rect = tab.getBoundingClientRect();
          expect(left).to.equal(rect.left);
        });

        it('should update the positions of the tabs', () => {
          simulateOnNode(tab, 'mousedown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => { called = true; });
          let rect = bar.contentNode.getBoundingClientRect();
          simulate(document.body, 'mousemove', { clientX: rect.right + 200, clientY: rect.top });
          expect(called).to.equal(true);
          let left = rect.left;
          rect = tab.getBoundingClientRect();
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

        it('should cancel a middle mouse release', () => {
          startDrag(bar);
          let evt = generate('mouseup', { button: 1 });
          let cancelled = !document.body.dispatchEvent(evt);
          expect(cancelled).to.equal(true);
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
          simulateOnNode(tab, 'mousedown');
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

    describe('#onBeforeAttach()', () => {

      it('should add event listeners to the node', () => {
        let bar = new LogTabBar();
        Widget.attach(bar, document.body);
        expect(bar.methods).to.contain('onBeforeAttach');
        simulate(bar.node, 'mousedown');
        expect(bar.events.indexOf('mousedown')).to.not.equal(-1);
        bar.dispose();
      });

    });

    describe('#onAfterDetach()', () => {

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
        expect(bar.methods).to.contain('onAfterDetach');
        simulate(document.body, 'mousemove');
        expect(bar.events.indexOf('mousemove')).to.equal(-1);
        simulate(document.body, 'mouseup');
        expect(bar.events.indexOf('mouseup')).to.equal(-1);
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should render tabs and set styles', () => {
        populateBar(bar);
        bar.currentIndex = 0;
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
        each(bar.titles, (title, i) => {
          let tab = bar.contentNode.children[i] as HTMLElement;
          let label = tab.getElementsByClassName('p-TabBar-tabLabel')[0] as HTMLElement;
          expect(label.textContent).to.equal(title.label);
          let current = i === 0;
          expect(tab.classList.contains('p-mod-current')).to.equal(current);
        });
      });

    });

    describe('.Renderer', () => {

      let title: Title<Widget>;

      beforeEach(() => {
        let owner = new Widget();
        title = new Title({
          owner,
          label: 'foo',
          closable: true,
          icon: 'bar',
          className: 'fizz',
          caption: 'this is a caption'
        });
      });

      describe('#closeIconSelector', () => {

        it('should be `.p-TabBar-tabCloseIcon`', () => {
          let renderer = new TabBar.Renderer();
          expect(renderer.closeIconSelector).to.equal('.p-TabBar-tabCloseIcon');
        });

      });

      describe('#renderTab()', () => {

        it('should render a virtual node for a tab', () => {
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

      describe('#renderIcon()', () => {

        it('should render the icon element for a tab', () => {
          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderIcon({ title, current: true, zIndex: 1 });
          let node = VirtualDOM.realize(vNode);
          expect(node.className).to.contain('p-TabBar-tabIcon');
          expect(node.classList.contains(title.icon)).to.equal(true);
        });

      });

      describe('#renderLabel()', () => {

        it('should render the label element for a tab', () => {
          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderLabel({ title, current: true, zIndex: 1 });
          let label = VirtualDOM.realize(vNode);
          expect(label.className).to.contain('p-TabBar-tabLabel');
          expect(label.textContent).to.equal(title.label);
        });

      });

      describe('#renderCloseIcon()', () => {

        it('should render the close icon element for a tab', () => {
          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderCloseIcon({ title, current: true, zIndex: 1 });
          let icon = VirtualDOM.realize(vNode);
          expect(icon.className).to.contain('p-TabBar-tabCloseIcon');
        });

      });

      describe('#createTabKey()', () => {

        it('should create a unique render key for the tab', () => {
          let renderer = new TabBar.Renderer();
          let key = renderer.createTabKey({ title, current: true, zIndex: 1 });
          let newKey = renderer.createTabKey({ title, current: true, zIndex: 1 });
          expect(key).to.equal(newKey);
        });

      });

      describe('#createTabStyle()', () => {

        it('should create the inline style object for a tab', () => {
          let renderer = new TabBar.Renderer();
          let style = renderer.createTabStyle({ title, current: true, zIndex: 1 });
          expect(style['zIndex']).to.equal('1');
        });

      });

      describe('#createTabClass()', () => {

        it('should create the class name for the tab', () => {
          let renderer = new TabBar.Renderer();
          let className = renderer.createTabClass({
            title, current: true, zIndex: 1
          });
          expect(className).to.contain('p-TabBar-tab');
          expect(className).to.contain('p-mod-closable');
          expect(className).to.contain('p-mod-current');
        });

      });

      describe('#createIconClass()', () => {

        it('should create class name for the tab icon', () => {
          let renderer = new TabBar.Renderer();
          let className = renderer.createIconClass({
            title, current: true, zIndex: 1
          });
          expect(className).to.contain('p-TabBar-tabIcon');
          expect(className).to.contain(title.icon);
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
