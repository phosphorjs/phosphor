/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  each, toArray
} from '../../../lib/algorithm/iteration';

import {
  Message
} from '../../../lib/core/messaging';

import {
  StackedLayout, StackedPanel
} from '../../../lib/ui/stackedpanel';

import {
  TabBar
} from '../../../lib/ui/tabbar';

import {
  TabPanel
} from '../../../lib/ui/tabpanel';

import {
  Widget
} from '../../../lib/ui/widget';


class LogWidget extends Widget {

  methods: string[] = [];

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.methods.push('onCloseRequest');
  }
}


describe('ui/tabpanel', () => {

  describe('TabPanel', () => {

    describe('#constructor()', () => {

      it('should construct a new tab panel and take no arguments', () => {
        let panel = new TabPanel();
        expect(panel).to.be.a(TabPanel);
      });

      it('should accept options', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let panel = new TabPanel({ tabsMovable: true, renderer });
        expect(panel.tabsMovable).to.be(true);
        expect(panel.tabBar.renderer).to.be(renderer);
      });

      it('should add a `p-TabPanel` class', () => {
        let panel = new TabPanel();
        expect(panel.hasClass('p-TabPanel')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.dispose();
        expect(panel.stackedPanel).to.be(null);
        expect(panel.tabBar).to.be(null);
        expect(panel.isDisposed).to.be(true);
      });

    });

    describe('#currentIndex', () => {

      it('should get the index of the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        expect(panel.currentIndex).to.be(0);
      });

      it('should be `-1` if no tab is selected', () => {
        let panel = new TabPanel();
        expect(panel.currentIndex).to.be(-1);
      });

      it('should set the index of the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentIndex = 1;
        expect(panel.currentIndex).to.be(1);
      });

      it('should set the index to `-1` if out of range', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentIndex = -2;
        expect(panel.currentIndex).to.be(-1);
        panel.currentIndex = 2;
        expect(panel.currentIndex).to.be(-1);
      });

    });

    describe('#currentWidget', () => {

      it('should get the currently selected tab', () => {
        let panel = new TabPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.currentWidget).to.be(widget);
      });

      it('should be `null` if no tab is selected', () => {
        let panel = new TabPanel();
        expect(panel.currentWidget).to.be(null);
      });

      it('should set the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.addWidget(widget);
        panel.currentWidget = widget;
        expect(panel.currentWidget).to.be(widget);
      });

      it('should set `null` if the widget is not in the panel', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentWidget = new Widget();
        expect(panel.currentWidget).to.be(null);
      });

    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {
        let panel = new TabPanel();
        expect(panel.tabsMovable).to.be(false);
      });

      it('should set whether the tabs are movable by the user', () => {
        let panel = new TabPanel();
        panel.tabsMovable = true;
        expect(panel.tabsMovable).to.be(true);
      });

    });

    describe('#tabBar', () => {

      it('should get the tab bar associated with the tab panel', () => {
        let panel = new TabPanel();
        let bar = panel.tabBar;
        expect(bar).to.be.a(TabBar);
      });

      it('should have the "p-TabPanel-tabBar" class', () => {
        let panel = new TabPanel();
        let bar = panel.tabBar;
        expect(bar.hasClass('p-TabPanel-tabBar')).to.be(true);
      });

      it('should be read-only', () => {
        let panel = new TabPanel();
        expect(() => { panel.tabBar = null; }).to.throwError();
      });

      it('should move the widget in the stacked panel when a tab is moved', () => {
        let panel = new TabPanel();
        let widgets = [new LogWidget(), new LogWidget()];
        each(widgets, w => { panel.addWidget(w); });
        Widget.attach(panel, document.body);
        let bar = panel.tabBar;
        let called = false;
        bar.tabMoved.connect(() => {
          let stack = panel.stackedPanel;
          expect(stack.widgets.at(1)).to.be(widgets[0]);
          called = true;
        });
        bar.tabMoved.emit({
          fromIndex: 0,
          toIndex: 1,
          title: widgets[0].title
        });
        expect(called).to.be(true);
        panel.dispose();
      });

      it('should show and focus the new widget when the current tab changes', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        each(widgets, w => { w.node.tabIndex = -1; });
        Widget.attach(panel, document.body);
        let bar = panel.tabBar;
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(widgets[args.previousIndex].isVisible).to.be(false);
          let widget = widgets[args.currentIndex];
          expect(widget.isVisible).to.be(true);
          expect(widget.node.contains(document.activeElement)).to.be(true);
          called = true;
        });
        bar.currentIndex = 1;
        expect(called).to.be(true);
        panel.dispose();
      });

      it('should close the widget when a tab is closed', () => {
        let panel = new TabPanel();
        let widget = new LogWidget();
        panel.addWidget(widget);
        Widget.attach(panel, document.body);
        let bar = panel.tabBar;
        let called = false;
        bar.tabCloseRequested.connect(() => {
          expect(widget.methods.indexOf('onCloseRequest')).to.not.be(-1);
          called = true;
        });
        bar.tabCloseRequested.emit({ index: 0, title: widget.title });
        expect(called).to.be(true);
        panel.dispose();
      });

    });

    describe('#stackedPanel', () => {

      it('should get the stacked panel associated with the tab panel', () => {
        let panel = new TabPanel();
        let stack = panel.stackedPanel;
        expect(stack).to.be.a(StackedPanel);
      });

      it('should have the "p-TabPanel-stackedPanel" class', () => {
        let panel = new TabPanel();
        let stack = panel.stackedPanel;
        expect(stack.hasClass('p-TabPanel-stackedPanel')).to.be(true);
      });

      it('should be read-only', () => {
        let panel = new TabPanel();
        expect(() => { panel.stackedPanel = null; }).to.throwError();
      });

      it('remove a tab when a widget is removed from the stacked panel', () => {
        let panel = new TabPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        let stack = panel.stackedPanel;
        let called = false;
        stack.widgetRemoved.connect(() => {
          let bar = panel.tabBar;
          expect(toArray(bar.titles)).to.eql([]);
          called = true;
        });
        widget.parent = null;
        expect(called).to.be(true);
      });

    });

    describe('#widgets', () => {

      it('should get a read-only sequence of the widgets in the panel', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        expect(toArray(panel.widgets)).to.eql(widgets);
      });

      it('should be read-only', () => {
        let panel = new TabPanel();
        expect(() => { panel.widgets = null; }).to.throwError();
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the tab panel', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.widgets.at(3)).to.be(widget);
      });

      it('should move an existing widget', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.addWidget(widgets[0]);
        expect(panel.widgets.at(2)).to.be(widgets[0]);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget into the tab panel at a specified index', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        let widget = new Widget();
        panel.insertWidget(1, widget);
        expect(panel.widgets.at(1)).to.be(widget);
      });

      it('should move an existing widget', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.insertWidget(0, widgets[2]);
        expect(panel.widgets.at(0)).to.be(widgets[2]);
      });

    });

  });

});
