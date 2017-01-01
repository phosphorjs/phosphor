/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  each, every
} from '../../../lib/algorithm/iteration';

import {
  Message
} from '../../../lib/core/messaging';

import {
  Panel, PanelLayout
} from '../../../lib/ui/panel';

import {
  ChildMessage, Widget
} from '../../../lib/ui/widget';


class LogPanelLayout extends PanelLayout {

  methods: string[] = [];

  protected init(): void {
    super.init();
    this.methods.push('init');
  }

  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget);
    this.methods.push('attachWidget');
  }

  protected moveWidget(fromIndex: number, toIndex: number, widget: Widget): void {
    super.moveWidget(fromIndex, toIndex, widget);
    this.methods.push('moveWidget');
  }

  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget);
    this.methods.push('detachWidget');
  }

  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
  }
}


class LogPanel extends Panel {

  constructor() {
    super({ layout: new LogPanelLayout() });
  }
}


class LogWidget extends Widget {

  methods: string[] = [];

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onBeforeDetach');
  }
}


describe('ui/panel', () => {

  describe('Panel', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let panel = new Panel();
        expect(panel.layout).to.be.a(PanelLayout);
      });

      it('should accept options', () => {
        let node = document.createElement('div');
        let layout = new PanelLayout();
        let panel = new Panel({ node, layout });
        expect(panel.node).to.be(node);
        expect(panel.layout).to.be(layout);
      });

      it('should add the `p-Panel` class', () => {
        let panel = new Panel();
        expect(panel.hasClass('p-Panel')).to.be(true);
      });

    });

    describe('#widgets', () => {

      it('should be a read-only sequence of widgets in the panel', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        let widgets = panel.widgets;
        expect(widgets.length).to.be(1);
        expect(widgets.at(0)).to.be(widget);
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the panel', () => {
        let panel = new Panel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.widgets.at(1)).to.be(widget);
      });

      it('should move an existing widget to the end', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        expect(panel.widgets.at(1)).to.be(widget);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget at the specified index', () => {
        let panel = new Panel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.insertWidget(0, widget);
        expect(panel.widgets.at(0)).to.be(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let panel = new Panel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.addWidget(widget);
        panel.insertWidget(0, widget);
        expect(panel.widgets.at(0)).to.be(widget);
      });

    });

  });

  describe('PanelLayout', () => {

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        layout.dispose();
        expect(every(widgets, w => w.isDisposed)).to.be(true);
      });

    });

    describe('#widgets', () => {

      it('should be a read-only sequence of widgets in the layout', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        let widgets = layout.widgets;
        expect(widgets.length).to.be(1);
        expect(widgets.at(0)).to.be(widget);
      });

    });

    describe('#iter()', () => {

      it('should create an iterator over the widgets in the layout', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        each(widgets, w => { w.title.label = 'foo'; });
        let iter = layout.iter();
        expect(every(iter, w => w.title.label === 'foo')).to.be(true);
        expect(layout.iter()).to.not.be(iter);
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the layout', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.widgets.at(1)).to.be(widget);
      });

      it('should move an existing widget to the end', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.addWidget(widget);
        expect(layout.widgets.at(1)).to.be(widget);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget at the specified index', () => {
        let panel = new Panel();
        let layout = panel.layout as PanelLayout;
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(0, widget);
        expect(layout.widgets.at(0)).to.be(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.widgets.at(0)).to.be(widget);
      });

      it('should clamp the index to the bounds of the widgets', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(-2, widget);
        expect(layout.widgets.at(0)).to.be(widget);
        layout.insertWidget(10, widget);
        expect(layout.widgets.at(1)).to.be(widget);
      });

      it('should be a no-op if the index does not change', () => {
        let layout = new PanelLayout();
        let widget = new LogWidget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(0, widget);
      });

    });

    describe('#removeWidget()', () => {

      it('should remove a widget by value', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidget(widget);
        expect(layout.widgets.length).to.be(1);
        expect(layout.widgets.at(0)).to.not.be(widget);
      });

    });

    describe('#removeWidgetAt()', () => {

      it('should remove a widget at a given index', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidgetAt(0);
        expect(layout.widgets.length).to.be(1);
        expect(layout.widgets.at(0)).to.not.be(widget);
      });

    });

    describe('#init()', () => {

      it('should be invoked when the layout is installed on its parent', () => {
        let widget = new Widget();
        let layout = new LogPanelLayout();
        widget.layout = layout;
        expect(layout.methods.indexOf('init')).to.not.be(-1);
      });

      it('should attach all widgets to the DOM', () => {
        let parent = new Widget();
        Widget.attach(parent, document.body);
        let layout = new LogPanelLayout();
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
        parent.layout = layout;
        expect(layout.methods.indexOf('init')).to.not.be(-1);
        expect(every(widgets, w => w.parent === parent)).to.be(true);
        expect(every(widgets, w => w.methods.indexOf('onAfterAttach') !== -1)).to.be(true);
        parent.dispose();
      });

    });

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let panel = new LogPanel();
        let layout = panel.layout as LogPanelLayout;
        let widget = new LogWidget();
        layout.insertWidget(0, widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(panel.node.children.item(0)).to.be(widget.node);
        panel.dispose();
      });

      it("should send an `'after-attach'` message if the parent is attached", () => {
        let panel = new LogPanel();
        Widget.attach(panel, document.body);
        let layout = panel.layout as LogPanelLayout;
        let widget = new LogWidget();
        layout.insertWidget(0, widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(widget.methods.indexOf('onAfterAttach')).to.not.be(-1);
        panel.dispose();
      });

    });

    describe('#moveWidget()', () => {

      it("should move a widget in the parent's DOM node", () => {
        let panel = new LogPanel();
        let layout = panel.layout as LogPanelLayout;
        let widget = new LogWidget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(1, widget);
        expect(layout.methods.indexOf('moveWidget')).to.not.be(-1);
        expect(panel.node.children.item(1)).to.be(widget.node);
        panel.dispose();
      });

      it("should send `'before-detach'` and `'after-attach'` messages if the parent is attached", () => {
        let panel = new LogPanel();
        let layout = panel.layout as LogPanelLayout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        widget.methods = [];
        layout.insertWidget(1, widget);
        expect(layout.methods.indexOf('moveWidget')).to.not.be(-1);
        expect(widget.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        expect(widget.methods.indexOf('onAfterAttach')).to.not.be(-1);
        panel.dispose();
      });

    });

    describe('#detachWidget()', () => {

      it("should detach a widget from the parent's DOM node", () => {
        let panel = new LogPanel();
        let layout = panel.layout as LogPanelLayout;
        let widget = new LogWidget();
        layout.insertWidget(0, widget);
        expect(panel.node.children.item(0)).to.be(widget.node);
        layout.removeWidget(widget);
        expect(layout.methods.indexOf('detachWidget')).to.not.be(-1);
        panel.dispose();
      });

      it("should send an `'before-detach'` message if the parent is attached", () => {
        let panel = new LogPanel();
        let layout = panel.layout as LogPanelLayout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        layout.insertWidget(0, widget);
        expect(panel.node.children.item(0)).to.be(widget.node);
        layout.removeWidget(widget);
        expect(layout.methods.indexOf('detachWidget')).to.not.be(-1);
        expect(widget.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        panel.dispose();
      });

    });

    describe('#onChildRemoved()', () => {

      it('should be called when a widget is removed from its parent', () => {
        let panel = new LogPanel();
        let layout = panel.layout as LogPanelLayout;
        let widget = new Widget();
        layout.addWidget(widget);
        widget.parent = null;
        expect(layout.methods.indexOf('onChildRemoved')).to.not.be(-1);
      });

      it('should remove the widget from the layout', () => {
        let panel = new LogPanel();
        let layout = panel.layout as LogPanelLayout;
        let widget = new Widget();
        layout.addWidget(widget);
        widget.parent = null;
        expect(layout.methods.indexOf('onChildRemoved')).to.not.be(-1);
        expect(layout.widgets.length).to.be(0);
      });

    });

  });

});
