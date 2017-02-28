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
  each
} from '@phosphor/algorithm';

import {
  StackedPanel, TabBar, TabPanel, Widget
} from '@phosphor/widgets';

import {
  LogWidget
} from './widget.spec';


describe('@phosphor/widgets', () => {

  describe('TabPanel', () => {

    describe('#constructor()', () => {

      it('should construct a new tab panel and take no arguments', () => {
        let panel = new TabPanel();
        expect(panel).to.be.an.instanceof(TabPanel);
      });

      it('should accept options', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let panel = new TabPanel({
          tabPlacement: 'left',
          tabsMovable: true,
          renderer
        });
        expect(panel.tabBar.tabsMovable).to.equal(true);
        expect(panel.tabBar.renderer).to.equal(renderer);
      });

      it('should add a `p-TabPanel` class', () => {
        let panel = new TabPanel();
        expect(panel.hasClass('p-TabPanel')).to.equal(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.dispose();
        expect(panel.isDisposed).to.equal(true);
        panel.dispose();
        expect(panel.isDisposed).to.equal(true);
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current tab is changed', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        let widgets = panel.widgets;
        panel.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(panel);
          expect(args.previousIndex).to.equal(0);
          expect(args.previousWidget).to.equal(widgets[0]);
          expect(args.currentIndex).to.equal(1);
          expect(args.currentWidget).to.equal(widgets[1]);
          called = true;
        });
        panel.currentIndex = 1;
        expect(called).to.equal(true);
      });

      it('should not be emitted when another tab is inserted', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        panel.currentChanged.connect((sender, args) => { called = true; });
        panel.insertWidget(0, new Widget());
        expect(called).to.equal(false);
      });

      it('should not be emitted when another tab is removed', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        panel.currentIndex = 1;
        panel.currentChanged.connect((sender, args) => { called = true; });
        panel.widgets[0].parent = null;
        expect(called).to.equal(false);
      });

      it('should not be emitted when the current tab is moved', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        panel.currentChanged.connect((sender, args) => { called = true; });
        panel.insertWidget(2, panel.widgets[0]);
        expect(called).to.equal(false);
      });

    });

    describe('#currentIndex', () => {

      it('should get the index of the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        expect(panel.currentIndex).to.equal(0);
      });

      it('should be `-1` if no tab is selected', () => {
        let panel = new TabPanel();
        expect(panel.currentIndex).to.equal(-1);
      });

      it('should set the index of the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentIndex = 1;
        expect(panel.currentIndex).to.equal(1);
      });

      it('should set the index to `-1` if out of range', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentIndex = -2;
        expect(panel.currentIndex).to.equal(-1);
        panel.currentIndex = 2;
        expect(panel.currentIndex).to.equal(-1);
      });

    });

    describe('#currentWidget', () => {

      it('should get the currently selected tab', () => {
        let panel = new TabPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.currentWidget).to.equal(widget);
      });

      it('should be `null` if no tab is selected', () => {
        let panel = new TabPanel();
        expect(panel.currentWidget).to.equal(null);
      });

      it('should set the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.addWidget(widget);
        panel.currentWidget = widget;
        expect(panel.currentWidget).to.equal(widget);
      });

      it('should set `null` if the widget is not in the panel', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentWidget = new Widget();
        expect(panel.currentWidget).to.equal(null);
      });

    });

    describe('#tabsMovable', () => {

      it('should be the tabsMovable property of the tabBar', () => {
        let panel = new TabPanel();
        expect(panel.tabsMovable).to.equal(false);
        panel.tabsMovable = true;
        expect(panel.tabBar.tabsMovable).to.equal(true);
      });

    });

    describe('#tabPlacement', () => {

      it('should be the tab placement for the tab panel', () => {
        let panel = new TabPanel();
        expect(panel.tabPlacement).to.equal('top');
        expect(panel.tabBar.orientation).to.equal('horizontal');
        expect(panel.tabBar.hasClass('p-mod-top')).to.equal(true);

        panel.tabPlacement = 'bottom';
        expect(panel.tabBar.orientation).to.equal('horizontal');
        expect(panel.tabBar.hasClass('p-mod-bottom')).to.equal(true);

        panel.tabPlacement = 'left';
        expect(panel.tabBar.orientation).to.equal('vertical');
        expect(panel.tabBar.hasClass('p-mod-left')).to.equal(true);

        panel.tabPlacement = 'right';
        expect(panel.tabBar.orientation).to.equal('vertical');
        expect(panel.tabBar.hasClass('p-mod-right')).to.equal(true);
      });

    });

    describe('#tabBar', () => {

      it('should get the tab bar associated with the tab panel', () => {
        let panel = new TabPanel();
        let bar = panel.tabBar;
        expect(bar).to.be.an.instanceof(TabBar);
      });

      it('should have the "p-TabPanel-tabBar" class', () => {
        let panel = new TabPanel();
        let bar = panel.tabBar;
        expect(bar.hasClass('p-TabPanel-tabBar')).to.equal(true);
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
          expect(stack.widgets[1]).to.equal(widgets[0]);
          called = true;
        });
        (bar.tabMoved as any).emit({
          fromIndex: 0,
          toIndex: 1,
          title: widgets[0].title
        });
        expect(called).to.equal(true);
        panel.dispose();
      });

      it('should show the new widget when the current tab changes', () => {
        let panel = new TabPanel();
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { panel.addWidget(w); });
        each(widgets, w => { w.node.tabIndex = -1; });
        Widget.attach(panel, document.body);
        panel.tabBar.currentChanged.connect((sender, args) => {
          expect(widgets[args.previousIndex].isVisible).to.equal(false);
          expect(widgets[args.currentIndex].isVisible).to.equal(true);
        });
        panel.tabBar.currentIndex = 1;
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
          expect(widget.methods.indexOf('onCloseRequest')).to.not.equal(-1);
          called = true;
        });
        (bar.tabCloseRequested as any).emit({ index: 0, title: widget.title });
        expect(called).to.equal(true);
        panel.dispose();
      });

    });

    describe('#stackedPanel', () => {

      it('should get the stacked panel associated with the tab panel', () => {
        let panel = new TabPanel();
        let stack = panel.stackedPanel;
        expect(stack).to.be.an.instanceof(StackedPanel);
      });

      it('should have the "p-TabPanel-stackedPanel" class', () => {
        let panel = new TabPanel();
        let stack = panel.stackedPanel;
        expect(stack.hasClass('p-TabPanel-stackedPanel')).to.equal(true);
      });

      it('remove a tab when a widget is removed from the stacked panel', () => {
        let panel = new TabPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        let stack = panel.stackedPanel;
        let called = false;
        stack.widgetRemoved.connect(() => {
          let bar = panel.tabBar;
          expect(bar.titles).to.deep.equal([]);
          called = true;
        });
        widget.parent = null;
        expect(called).to.equal(true);
      });

    });

    describe('#widgets', () => {

      it('should get a read-only array of the widgets in the panel', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        expect(panel.widgets).to.deep.equal(widgets);
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the tab panel', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.widgets[3]).to.equal(widget);
        expect(panel.tabBar.titles[2]).to.equal(widgets[2].title);
      });

      it('should move an existing widget', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.addWidget(widgets[0]);
        expect(panel.widgets[2]).to.equal(widgets[0]);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget into the tab panel at a specified index', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        let widget = new Widget();
        panel.insertWidget(1, widget);
        expect(panel.widgets[1]).to.equal(widget);
        expect(panel.tabBar.titles[1]).to.equal(widget.title);
      });

      it('should move an existing widget', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.insertWidget(0, widgets[2]);
        expect(panel.widgets[0]).to.equal(widgets[2]);
      });

    });

  });

});
