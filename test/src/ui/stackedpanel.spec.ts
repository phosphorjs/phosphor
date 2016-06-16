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
  Message, sendMessage
} from '../../../lib/core/messaging';

import {
  IS_IE
} from '../../../lib/dom/platform';

import {
  StackedLayout, StackedPanel
} from '../../../lib/ui/stackedpanel';

import {
  ChildMessage, ResizeMessage, Widget, WidgetMessage
} from '../../../lib/ui/widget';


class LogStackedPanel extends StackedPanel {

  methods: string[] = [];

  protected onChildAdded(msg: ChildMessage): void {
    super.onChildAdded(msg);
    this.methods.push('onChildAdded');
  }

  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
  }
}


class LogStackedLayout extends StackedLayout {

  methods: string[] = [];

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

  protected onLayoutChanged(msg: Message): void {
    super.onLayoutChanged(msg);
    this.methods.push('onLayoutChanged');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onChildShown(msg: ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }

  protected onResize(msg: ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }
}


class LogWidget extends Widget {

  methods: string[] = [];

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }
}


describe('ui/stackedpanel', () => {

  describe('StackedPanel', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let panel = new StackedPanel();
        expect(panel).to.be.a(StackedPanel);
      });

      it('should take options', () => {
        let layout = new StackedLayout();
        let panel = new StackedPanel({ layout });
        expect(panel.layout).to.be(layout);
      });

      it('should add the `p-StackedPanel` class', () => {
        let panel = new StackedPanel();
        expect(panel.hasClass('p-StackedPanel')).to.be(true);
      });

    });

    describe('#widgetRemoved', () => {

      it('should be emitted when a widget is removed from a stacked panel', () => {
        let panel = new StackedPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        panel.widgetRemoved.connect((sender, args) => {
          expect(sender).to.be(panel);
          expect(args).to.be(widget);
        });
        widget.parent = null;
      });

    });

    describe('#onChildAdded()', () => {

      it('should add a class to the child widget', () => {
        let panel = new LogStackedPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.methods.indexOf('onChildAdded')).to.not.be(-1);
        expect(widget.hasClass('p-StackedPanel-child')).to.be(true);
      });

    });

    describe('#onChildRemoved()', () => {

      it('should remove a class to the child widget', () => {
        let panel = new LogStackedPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(panel.methods.indexOf('onChildRemoved')).to.not.be(-1);
        expect(widget.hasClass('p-StackedPanel-child')).to.be(false);
      });

    });

  });

  describe('StackedLayout', () => {

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(parent.node.contains(widget.node)).to.be(true);
      });

      it("should send an `'after-attach'` message if the parent is attached", () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        parent.layout = layout;
        let widget = new LogWidget();
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        expect(widget.methods.indexOf('onAfterAttach')).to.not.be(-1);
      });

      it('should post a layout request for the parent widget', (done) => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

    });

    describe('#moveWidget()', () => {

      it("should move a widget in the parent's DOM node", () => {
        let layout = new LogStackedLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        let widget = widgets[0];
        layout.insertWidget(2, widget);
        expect(layout.methods.indexOf('moveWidget')).to.not.be(-1);
        expect(layout.widgets.at(2)).to.be(widget);
      });

      it('should post a a layout request to the parent', (done) => {
        let layout = new LogStackedLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        let widget = widgets[0];
        layout.insertWidget(2, widget);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

    });

    describe('#detachWidget()', () => {

      it("should detach a widget from the parent's DOM node", () => {
        let layout = new LogStackedLayout();
        let widget = new Widget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods.indexOf('detachWidget')).to.not.be(-1);
        expect(parent.node.contains(widget.node)).to.be(false);
        parent.dispose();
      });

      it("should send a `'before-detach'` message if the parent is attached", (done) => {
        let layout = new LogStackedLayout();
        let widget = new LogWidget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        expect(layout.methods.indexOf('detachWidget')).to.not.be(-1);
        requestAnimationFrame(() => {
          expect(widget.methods.indexOf('onBeforeDetach')).to.not.be(-1);
          parent.dispose();
          done();
        });
      });

      it('should post a a layout request to the parent', (done) => {
        let layout = new LogStackedLayout();
        let widget = new LogWidget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

      it('should reset the z-index for the widget', (done) => {
        let layout = new LogStackedLayout();
        let widget = new LogWidget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        requestAnimationFrame(() => {
          expect(widget.node.style.zIndex).to.be('0');
          layout.removeWidget(widget);
          expect(widget.node.style.zIndex).to.be('');
          done();
        });
      });

    });

    describe('#onAfterShow()', () => {

      it('should post an update to the parent', (done) => {
        let layout = new LogStackedLayout();
        let parent = new LogWidget();
        parent.layout = layout;
        parent.hide();
        Widget.attach(parent, document.body);
        parent.show();
        expect(layout.methods.indexOf('onAfterShow')).to.not.be(-1);
        requestAnimationFrame(() => {
          expect(parent.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          done();
        });
      });

      it('should send an `after-show` message to non hidden widgets in the layout', () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        parent.layout = layout;
        let children = [new LogWidget(), new LogWidget(), new LogWidget()];
        let hidden = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(children, w => { layout.addWidget(w); });
        each(hidden, w => { layout.addWidget(w); });
        each(hidden, w => { w.hide(); });
        parent.hide();
        Widget.attach(parent, document.body);
        parent.show();
        expect(every(children, w => w.methods.indexOf('onAfterShow') !== -1)).to.be(true);
        expect(every(hidden, w => w.methods.indexOf('onAfterShow') === -1)).to.be(true);
        parent.dispose();
      });

    });

    describe('#onAfterAttach()', () => {

      it('should post a layout request to the parent', (done) => {
        let layout = new LogStackedLayout();
        let parent = new LogWidget();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        expect(layout.methods.indexOf('onAfterAttach')).to.not.be(-1);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

      it('should send an `after-attach` message to each of the widgets in the layout', () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let children = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(children, w => { layout.addWidget(w); });
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.AfterAttach);
        expect(layout.methods.indexOf('onAfterAttach')).to.not.be(-1);
        expect(every(children, child => {
          return child.methods.indexOf('onAfterAttach') !== -1;
        })).to.be(true);
      });

    });

    describe('#onChildShown()', () => {

      it('should post or send a fit request to the parent', (done) => {
        let parent = new LogWidget();
        let layout = new LogStackedLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        widgets[0].hide();
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        widgets[0].show();
        expect(layout.methods.indexOf('onChildShown')).to.not.be(-1);
        if (IS_IE) {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
        }
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          parent.dispose();
          done();
        });
      });

    });

    describe('#onChildHidden()', () => {

      it('should post or send a fit request to the parent', (done) => {
        let parent = new LogWidget();
        let layout = new LogStackedLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        widgets[0].hide();
        expect(layout.methods.indexOf('onChildHidden')).to.not.be(-1);
        if (IS_IE) {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
        }
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          parent.dispose();
          done();
        });
      });

    });

    describe('#onResize', () => {

      it('should be called when a resize event is sent to the parent', () => {
        let parent = new LogWidget();
        let layout = new LogStackedLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        let msg = new ResizeMessage(10, 10);
        sendMessage(parent, msg);
        expect(layout.methods.indexOf('onResize')).to.not.be(-1);
        parent.dispose();
      });

      it('should be a no-op if the parent is hidden', () => {
        let parent = new LogWidget();
        let layout = new LogStackedLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        parent.hide();
        sendMessage(parent, ResizeMessage.UnknownSize);
        expect(layout.methods.indexOf('onResize')).to.not.be(-1);
        parent.dispose();
      });

    });

    describe('#onUpdateRequest()', () => {

      let parent: LogWidget;
      let layout: LogStackedLayout;

      beforeEach(() => {
        parent = new LogWidget();
        layout = new LogStackedLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
      });

      afterEach(() => {
        parent.dispose();
      });

      it('should be called when the parent is updated', () => {
        sendMessage(parent, WidgetMessage.UpdateRequest);
        expect(layout.methods.indexOf('onUpdateRequest')).to.not.be(-1);
      });

      it('should be a no-op if the parent is hidden', () => {
        parent.hide();
        sendMessage(parent, WidgetMessage.UpdateRequest);
        expect(layout.methods.indexOf('onUpdateRequest')).to.not.be(-1);
      });

    });

    describe('#onFitRequest()', () => {

      let parent: LogWidget;
      let layout: LogStackedLayout;

      beforeEach(() => {
        parent = new LogWidget();
        layout = new LogStackedLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
      });

      afterEach(() => {
        parent.dispose();
      });

      it('should be called when the parent fit is requested', () => {
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
      });

      it('should send a fit request to an ancestor widget', () => {
        Widget.detach(parent);
        let ancestor = new LogWidget();
        let ancestorLayout = new LogStackedLayout();
        ancestor.layout = ancestorLayout;
        ancestorLayout.addWidget(parent);
        parent.layout = layout;
        Widget.attach(ancestor, document.body);
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(ancestorLayout.methods.indexOf('onFitRequest')).to.not.be(-1);
        parent.dispose();
      });

    });

  });

});
