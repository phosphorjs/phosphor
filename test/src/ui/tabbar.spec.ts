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
  each, toArray
} from '../../../lib/algorithm/iteration';

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
        let bar = new TabBar({ renderer: new TabBar.ContentRenderer() });
        expect(bar).to.be.a(TabBar);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.dispose();
        expect(bar.titles.length).to.be(0);
        expect(bar.isDisposed).to.be(true);
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current tab is changed', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.previousIndex).to.be(0);
          expect(args.previousTitle).to.be(titles[0]);
          expect(args.currentIndex).to.be(1);
          expect(args.currentTitle).to.be(titles[1]);
          called = true;
        });
        bar.currentTitle = titles[1];
        expect(called).to.be(true);
      });

      it('should not be emitted when another tab is inserted', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        bar.insertTab(0, new Title());
        expect(called).to.be(false);
      });

      it('should not be emitted when another tab is removed', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let called = false;
        bar.currentIndex = 1;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        bar.removeTab(titles[0]);
        expect(called).to.be(false);
      });

      it('should not be emitted when the current tab is moved', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        bar.insertTab(2, titles[0]);
        expect(called).to.be(false);
      });

    });

    describe('#tabMoved', () => {

      it('should be emitted when a tab is moved by the user', () => {

      });

      it('should not be emitted when a tab is moved programmatically', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let called = false;
        bar.tabMoved.connect((sender, args) => {
          called = true;
        });
        bar.insertTab(2, titles[0]);
        expect(called).to.be(false);
      });

    });

    describe('#tabCloseRequested', () => {

      it('should be emitted when a tab close icon is clicked', () => {

      });

      it('should not be emitted if the tab title is not `closable`', () => {

      });

    });

    describe('#tabDetachRequested', () => {

      it('should be emitted when a tab is dragged beyond the detach threshold', () => {

      });

      it('should be handled by calling `releaseMouse` and removing the tab', () => {

      });

      it('should only be emitted once per drag cycle', () => {

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
        each(titles, t => bar.addTab(t));
        expect(toArray(bar.titles)).to.eql(titles);
      });

      it('should be read-only', () => {
        let bar = new TabBar();
        expect(() => { bar.titles = null; }).to.throwError();
      });

    });

    describe('#currentTitle', () => {

      it('should get the currently selected title', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        expect(bar.currentTitle).to.be(titles[0]);
      });

      it('should be `null` if no tab is selected', () => {
        let bar = new TabBar();
        expect(bar.currentTitle).to.be(null);
      });

      it('should set the currently selected title', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.currentTitle = titles[1];
        expect(bar.currentTitle).to.be(titles[1]);
      });

      it('should set the title to `null` if the title does not exist', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.currentTitle =  new Title();
        expect(bar.currentTitle).to.be(null);
      });

    });

    describe('#currentIndex', () => {

      it('should get index of the currently selected tab', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        expect(bar.currentIndex).to.be(0);
      });

      it('should be `null` if no tab is selected', () => {
        let bar = new TabBar();
        expect(bar.currentIndex).to.be(-1);
      });

      it('should set index of the currently selected tab', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.currentIndex = 1;
        expect(bar.currentIndex).to.be(1);
      });

      it('should set the index to `-1` if the value is out of range', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.currentIndex = -1;
        expect(bar.currentIndex).to.be(-1);
        bar.currentIndex = 10;
        expect(bar.currentIndex).to.be(-1);
      });

      it('should emit the `currentChanged` signal', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.be(bar);
          expect(args.previousIndex).to.be(0);
          expect(args.previousTitle).to.be(titles[0]);
          expect(args.currentIndex).to.be(1);
          expect(args.currentTitle).to.be(titles[1]);
          called = true;
        });
        bar.currentIndex = 1;
        expect(called).to.be(true);
      });

      it('should schedule an update of the tabs', (done) => {
        let bar = new LogTabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
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
        let bar = new LogTabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
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
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.insertTab(2, titles[0]);
        expect(bar.titles.at(2)).to.be(titles[0]);
      });

    });

    describe('#addTab()', () => {

      it('should add a tab to the end of the tab bar', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
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
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.addTab(titles[0]);
        expect(bar.titles.at(2)).to.be(titles[0]);
      });

    });

    describe('#insertTab()', () => {

      it('should insert a tab into the tab bar at the specified index', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let title = new Title();
        bar.insertTab(1, title);
        expect(bar.titles.at(1)).to.be(title);
      });

      it('should accept a title options object', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let title = bar.insertTab(1, { label: 'foo' });
        expect(title).to.be.a(Title);
        expect(title.label).to.be('foo');
      });

      it('should clamp the index to the bounds of the tabs', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let title = new Title();
        bar.insertTab(-1, title);
        expect(bar.titles.at(0)).to.be(title);
        title = new Title();
        bar.insertTab(10, title);
        expect(bar.titles.at(4)).to.be(title);
      });

      it('should move an existing tab', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
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
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.removeTab(titles[0]);
        expect(bar.titles.at(0)).to.be(titles[1]);
      });

      it('should remove a tab from the tab bar by index', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.removeTab(1);
        expect(bar.titles.at(1)).to.be(titles[2]);
      });

      it('should bail if the title is not in the tab bar', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.removeTab(new Title());
        expect(bar.titles.length).to.be(3);
      });

      it('should bail if the index is out of range', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
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
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        bar.clearTabs();
        expect(bar.titles.length).to.be(0);
      });

      it('should be a no-op if there are no tabs', () => {
        let bar = new TabBar();
        bar.clearTabs();
        expect(bar.titles.length).to.be(0);
      });

      it('should emit the `currentChanged` signal if there was a selected tab', () => {
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
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
        let bar = new TabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        let called = false;
        bar.currentIndex = -1;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        bar.clearTabs();
        expect(called).to.be(false);
      });

    });

    describe('#releaseMouse()', () => {

      it('should release the mouse and restore the non-dragged tab positions', () => {

      });

    });

    describe('#handleEvent()', () => {

      let bar: LogTabBar;

      beforeEach((done) => {
        bar = new LogTabBar();
        let titles = [new Title(), new Title(), new Title()];
        each(titles, t => bar.addTab(t));
        each(titles, t => t.label = 'Test');
        bar.tabsMovable = true;
        Widget.attach(bar, document.body);
        requestAnimationFrame(() => done());
      });

      afterEach(() => bar.dispose());

      context('click', () => {


      });

      context('mousedown', () => {

        it('should add event listeners if the tabs are movable', () => {
          let content = bar.contentNode;
          let tab = content.firstChild as HTMLElement;
          let label = tab.getElementsByClassName('p-TabBar-tabLabel')[0] as HTMLElement;
          let rect = label.getBoundingClientRect();
          simulate(tab, 'mousedown', { clientX: rect.left, clientY: rect.top });
          simulate(document.body, 'mousemove');
          expect(bar.events.indexOf('mousemove')).to.not.be(-1);
        });

      });

      context('mousemove', () => {

      });

      context('mouseup', () => {

      });

      context('keydown', () => {

      });

      context('contextmenu', () => {

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

      it('should remove event listeners from the node', () => {

      });

    });

    describe('#onUpdateRequest()', () => {

    });

  });

  describe('TabBar.ContentRenderer', () => {

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

});
