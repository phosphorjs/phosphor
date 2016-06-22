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
} from  '../../../lib/algorithm/iteration';

import {
  Message, sendMessage
} from '../../../lib/core/messaging';

import {
  IS_IE
} from '../../../lib/dom/platform';

import {
  BoxLayout, BoxPanel
} from '../../../lib/ui/boxpanel';

import {
  ChildMessage, ResizeMessage, Widget, WidgetMessage
} from '../../../lib/ui/widget';


class LogBoxLayout extends BoxLayout {

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


class LogBoxPanel extends BoxPanel {

  methods: string[] = [];

  constructor() {
    super({ layout: new LogBoxLayout() });
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onChildAdded(msg: ChildMessage): void {
    super.onChildAdded(msg);
    this.methods.push('onChildAdded');
  }

  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
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


describe('ui/boxpanel', () => {

  describe('BoxPanel', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let panel = new BoxPanel();
        expect(panel).to.be.a(BoxPanel);
      });

      it('should accept options', () => {
        let panel = new BoxPanel({ direction: 'bottom-to-top', spacing: 10 });
        expect(panel.direction).to.be('bottom-to-top');
        expect(panel.spacing).to.be(10);
      });

      it('should accept a layout option', () => {
        let layout = new BoxLayout();
        let panel = new BoxPanel({ layout });
        expect(panel.layout).to.be(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let layout = new BoxLayout();
        let panel = new BoxPanel({
          layout, direction: 'bottom-to-top', spacing: 10
        });
        expect(panel.layout).to.be(layout);
        expect(panel.direction).to.be('top-to-bottom');
        expect(panel.spacing).to.be(4);
      });

      it('should add the `p-BoxPanel` class', () => {
        let panel = new BoxPanel();
        expect(panel.hasClass('p-BoxPanel')).to.be(true);
      });

    });

    describe('#direction', () => {

      it('should default to `"top-to-bottom"`', () => {
        let panel = new BoxPanel();
        expect(panel.direction).to.be('top-to-bottom');
      });

      it('should set the layout direction for the box panel', () => {
        let panel = new BoxPanel();
        panel.direction = 'left-to-right';
        expect(panel.direction).to.be('left-to-right');
      });

    });

    describe('#spacing', () => {

      it('should default to `4`', () => {
        let panel = new BoxPanel();
        expect(panel.spacing).to.be(4);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let panel = new BoxPanel();
        panel.spacing = 8;
        expect(panel.spacing).to.be(8);
      });

    });

    describe('#onChildAdded()', () => {

      it('should add the child class to a child added to the panel', () => {
        let panel = new LogBoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.methods.indexOf('onChildAdded')).to.not.be(-1);
        expect(widget.hasClass('p-BoxPanel-child')).to.be(true);
      });

    });

    describe('#onChildRemoved()', () => {

      it('should remove the child class from a child removed from the panel', () => {
        let panel = new LogBoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(panel.methods.indexOf('onChildRemoved')).to.not.be(-1);
        expect(widget.hasClass('p-BoxPanel-child')).to.be(false);
      });

    });

    describe('.getStretch()', () => {

      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getStretch(widget)).to.be(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setStretch(widget, 8);
        expect(BoxPanel.getStretch(widget)).to.be(8);
      });

    });

    describe('.getSizeBasis()', () => {

      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getSizeBasis(widget)).to.be(0);
      });

    });

    describe('.setSizeBasis()', () => {

      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setSizeBasis(widget, 8);
        expect(BoxPanel.getSizeBasis(widget)).to.be(8);
      });

    });

  });

  describe('BoxLayout', () => {

    describe('constructor()', () => {

      it('should take no arguments', () => {
        let layout = new BoxLayout();
        expect(layout).to.be.a(BoxLayout);
      });

      it('should accept options', () => {
        let layout = new BoxLayout({ direction: 'bottom-to-top', spacing: 10 });
        expect(layout.direction).to.be('bottom-to-top');
        expect(layout.spacing).to.be(10);
      });

    });

    describe('#direction', () => {

      it('should default to `"top-to-bottom"`', () => {
        let layout = new BoxLayout();
        expect(layout.direction).to.be('top-to-bottom');
      });

      it('should set the layout direction for the box layout', () => {
        let layout = new BoxLayout();
        layout.direction = 'left-to-right';
        expect(layout.direction).to.be('left-to-right');
      });

      it('should post a fit request to the parent widget', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.direction = 'right-to-left';
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.direction = 'top-to-bottom';
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.be(-1);
          done();
        });
      });

    });

    describe('#spacing', () => {

      it('should default to `4`', () => {
        let layout = new BoxLayout();
        expect(layout.spacing).to.be(4);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let layout = new BoxLayout();
        layout.spacing = 8;
        expect(layout.spacing).to.be(8);
      });

      it('should post a fit request to the parent widget', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.spacing = 8;
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.spacing = 4;
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.be(-1);
          done();
        });
      });

    });

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new Widget();
        panel.addWidget(widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(panel.node.contains(widget.node)).to.be(true);
        panel.dispose();
      });

      it("should send an `'after-attach'` message if the parent is attached", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        panel.addWidget(widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(widget.methods.indexOf('onAfterAttach')).to.not.be(-1);
        panel.dispose();
      });

      it('should post a layout request for the parent widget', (done) => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        panel.addWidget(new Widget());
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          panel.dispose();
          done();
        });
      });

    });

    describe('#moveWidget()', () => {

      it('should post an update request for the parent widget', (done) => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.methods.indexOf('moveWidget')).to.not.be(-1);
        requestAnimationFrame(() => {
          expect(panel.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          panel.dispose();
          done();
        });
      });

    });

    describe('#detachWidget()', () => {

      it("should detach a widget from the parent's DOM node", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new Widget();
        panel.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods.indexOf('detachWidget')).to.not.be(-1);
        expect(panel.node.contains(widget.node)).to.be(false);
        panel.dispose();
      });

      it("should send a `'before-detach'` message if the parent is attached", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        panel.addWidget(widget);
        layout.removeWidget(widget);
        expect(widget.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        panel.dispose();
      });

      it('should post a layout request for the parent widget', (done) => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new Widget();
        panel.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          layout.removeWidget(widget);
          layout.methods = [];
          requestAnimationFrame(() => {
            expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
            panel.dispose();
            done();
          });
        });
      });

    });

    describe('#onLayoutChanged()', () => {

      it('should set the direction class on the parent widget', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        expect(parent.hasClass('p-mod-top-to-bottom')).to.be(true);
        expect(layout.methods.indexOf('onLayoutChanged')).to.not.be(-1);
        parent.dispose();
      });

      it('should attach the child widgets', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        parent.layout = layout;
        expect(every(widgets, w => w.parent === parent));
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        parent.dispose();
      });

    });

    describe('#onAfterShow()', () => {

      it('should post an update request to the parent', (done) => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        parent.hide();
        parent.show();
        expect(parent.methods.indexOf('onAfterShow')).to.not.be(-1);
        expect(layout.methods.indexOf('onAfterShow')).to.not.be(-1);
        requestAnimationFrame(() => {
          expect(parent.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          parent.dispose();
          done();
        });
      });

      it('should send an `after-show` message to non-hidden child widgets', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        let hiddenWidgets = [new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
        each(hiddenWidgets, w => { layout.addWidget(w); });
        each(hiddenWidgets, w => { w.hide(); });
        Widget.attach(parent, document.body);
        parent.layout = layout;
        parent.hide();
        parent.show();
        expect(every(widgets, w => w.methods.indexOf('after-show') !== -1));
        expect(every(hiddenWidgets, w => w.methods.indexOf('after-show') === -1));
        expect(parent.methods.indexOf('onAfterShow')).to.not.be(-1);
        expect(layout.methods.indexOf('onAfterShow')).to.not.be(-1);
        parent.dispose();
      });

    });

    describe('#onAfterAttach()', () => {

      it('should post a fit request to the parent', (done) => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        expect(parent.methods.indexOf('onAfterAttach')).to.not.be(-1);
        expect(layout.methods.indexOf('onAfterAttach')).to.not.be(-1);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          parent.dispose();
          done();
        });
      });

      it('should send `after-attach` to all child widgets', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        expect(parent.methods.indexOf('onAfterAttach')).to.not.be(-1);
        expect(layout.methods.indexOf('onAfterAttach')).to.not.be(-1);
        expect(every(widgets, w => w.methods.indexOf('onAfterAttach') !== -1));
        parent.dispose();
      });

    });

    describe('#onChildShown()', () => {

      it('should post or send a fit request to the parent', (done) => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
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
        let layout = new LogBoxLayout();
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

    describe('#onResize()', () => {

      it('should be called when a resize event is sent to the parent', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
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
        let layout = new LogBoxLayout();
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
      let layout: LogBoxLayout;

      beforeEach(() => {
        parent = new LogWidget();
        layout = new LogBoxLayout();
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

      it('should handle `bottom-to-top`', () => {
        layout.direction = 'bottom-to-top';
        sendMessage(parent, WidgetMessage.UpdateRequest);
        expect(layout.methods.indexOf('onUpdateRequest')).to.not.be(-1);
      });

      it('should handle `left-to-right`', () => {
        layout.direction = 'left-to-right';
        sendMessage(parent, WidgetMessage.UpdateRequest);
        expect(layout.methods.indexOf('onUpdateRequest')).to.not.be(-1);
      });

      it('should handle `right-to-left`', () => {
        layout.direction = 'right-to-left';
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
      let layout: LogBoxLayout;

      beforeEach(() => {
        parent = new LogWidget();
        layout = new LogBoxLayout();
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

      it('should fit `bottom-to-top`', () => {
        layout.direction = 'bottom-to-top';
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
      });

      it('should fit `left-to-right`', () => {
        layout.direction = 'left-to-right';
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
      });

      it('should fit `right-to-left`', () => {
        layout.direction = 'right-to-left';
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
      });

      it('should be a no-op if the parent is hidden', () => {
        parent.hide();
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
      });

      it('should send a fit request to an ancestor widget', () => {
        Widget.detach(parent);
        let ancestor = new LogWidget();
        let ancestorLayout = new LogBoxLayout();
        ancestor.layout = ancestorLayout;
        ancestorLayout.addWidget(parent);
        parent.layout = layout;
        Widget.attach(ancestor, document.body);
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(ancestorLayout.methods.indexOf('onFitRequest')).to.not.be(-1);
        parent.dispose();
      });

    });

    describe('.getStretch()', () => {

      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getStretch(widget)).to.be(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setStretch(widget, 8);
        expect(BoxLayout.getStretch(widget)).to.be(8);
      });

      it("should post a fit request to the widget's parent", (done) => {
        let parent = new LogWidget();
        let widget = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.addWidget(widget);
        BoxLayout.setStretch(widget, 8);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

    });

    describe('.getSizeBasis()', () => {

      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getSizeBasis(widget)).to.be(0);
      });

    });

    describe('.setSizeBasis()', () => {

      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setSizeBasis(widget, 8);
        expect(BoxLayout.getSizeBasis(widget)).to.be(8);
      });

      it("should post a fit request to the widget's parent", (done) => {
        let parent = new LogWidget();
        let widget = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.addWidget(widget);
        BoxLayout.setSizeBasis(widget, 8);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

    });

  });

});
