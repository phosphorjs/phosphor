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
  each, every
} from '@phosphor/algorithm';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  BoxLayout, Widget
} from '@phosphor/widgets';


class LogBoxLayout extends BoxLayout {

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

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }

  protected onResize(msg: Widget.ResizeMessage): void {
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


describe('@phosphor/widgets', () => {

  describe('BoxLayout', () => {

    describe('constructor()', () => {

      it('should take no arguments', () => {
        let layout = new BoxLayout();
        expect(layout).to.be.an.instanceof(BoxLayout);
      });

      it('should accept options', () => {
        let layout = new BoxLayout({ direction: 'bottom-to-top', spacing: 10 });
        expect(layout.direction).to.equal('bottom-to-top');
        expect(layout.spacing).to.equal(10);
      });

    });

    describe('#direction', () => {

      it('should default to `"top-to-bottom"`', () => {
        let layout = new BoxLayout();
        expect(layout.direction).to.equal('top-to-bottom');
      });

      it('should set the layout direction for the box layout', () => {
        let layout = new BoxLayout();
        layout.direction = 'left-to-right';
        expect(layout.direction).to.equal('left-to-right');
      });

      it('should set the direction attribute of the parent widget', () => {
        let parent = new Widget();
        let layout = new BoxLayout();
        parent.layout = layout;
        layout.direction = 'top-to-bottom';
        expect(parent.node.getAttribute('data-direction')).to.equal('top-to-bottom');
        layout.direction = 'bottom-to-top';
        expect(parent.node.getAttribute('data-direction')).to.equal('bottom-to-top');
        layout.direction = 'left-to-right';
        expect(parent.node.getAttribute('data-direction')).to.equal('left-to-right');
        layout.direction = 'right-to-left';
        expect(parent.node.getAttribute('data-direction')).to.equal('right-to-left');
      });

      it('should post a fit request to the parent widget', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.direction = 'right-to-left';
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.direction = 'top-to-bottom';
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });

    });

    describe('#spacing', () => {

      it('should default to `4`', () => {
        let layout = new BoxLayout();
        expect(layout.spacing).to.equal(4);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let layout = new BoxLayout();
        layout.spacing = 8;
        expect(layout.spacing).to.equal(8);
      });

      it('should post a fit request to the parent widget', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.spacing = 8;
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.spacing = 4;
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });

    });

    describe('#init()', () => {

      it('should set the direction attribute on the parent widget', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        expect(parent.node.getAttribute('data-direction')).to.equal('top-to-bottom');
        expect(layout.methods).to.contain('init');
        parent.dispose();
      });

      it('should attach the child widgets', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        parent.layout = layout;
        expect(every(widgets, w => w.parent === parent));
        expect(layout.methods).to.contain('attachWidget');
        parent.dispose();
      });

    });

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(panel.node.contains(widget.node)).to.equal(true);
        panel.dispose();
      });

      it("should send an `'after-attach'` message if the parent is attached", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new LogWidget();
        panel.layout = layout;
        Widget.attach(panel, document.body);
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(widget.methods).to.contain('onAfterAttach');
        panel.dispose();
      });

      it('should post a layout request for the parent widget', (done) => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        panel.layout = layout;
        layout.addWidget(new Widget());
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          panel.dispose();
          done();
        });
      });

    });

    describe('#moveWidget()', () => {

      it('should post an update request for the parent widget', (done) => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        panel.layout = layout;
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.methods).to.contain('moveWidget');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onUpdateRequest');
          panel.dispose();
          done();
        });
      });

    });

    describe('#detachWidget()', () => {

      it("should detach a widget from the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(panel.node.contains(widget.node)).to.equal(false);
        panel.dispose();
      });

      it("should send a `'before-detach'` message if the parent is attached", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        panel.layout = layout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(widget.methods).to.contain('onBeforeDetach');
        panel.dispose();
      });

      it('should post a layout request for the parent widget', (done) => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          layout.removeWidget(widget);
          layout.methods = [];
          requestAnimationFrame(() => {
            expect(layout.methods).to.contain('onFitRequest');
            panel.dispose();
            done();
          });
        });
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
        expect(parent.methods).to.contain('onAfterShow');
        expect(layout.methods).to.contain('onAfterShow');
        requestAnimationFrame(() => {
          expect(parent.methods).to.contain('onUpdateRequest');
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
        expect(parent.methods).to.contain('onAfterShow');
        expect(layout.methods).to.contain('onAfterShow');
        parent.dispose();
      });

    });

    describe('#onAfterAttach()', () => {

      it('should post a fit request to the parent', (done) => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        expect(parent.methods).to.contain('onAfterAttach');
        expect(layout.methods).to.contain('onAfterAttach');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
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
        expect(parent.methods).to.contain('onAfterAttach');
        expect(layout.methods).to.contain('onAfterAttach');
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
        expect(layout.methods).to.contain('onChildShown');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });

    });

    describe('#onChildHidden()', () => {

      it('should post a fit request to the parent', (done) => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        widgets[0].hide();
        expect(layout.methods).to.contain('onChildHidden');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
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
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        parent.dispose();
      });

      it('should be a no-op if the parent is hidden', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        parent.hide();
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        parent.dispose();
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be called when the parent is updated', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest);
        expect(layout.methods).to.contain('onUpdateRequest');
      });

    });

    describe('#onFitRequest()', () => {

      it('should be called when the parent fit is requested', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.FitRequest);
        expect(layout.methods).to.contain('onFitRequest');
      });

    });

    describe('.getStretch()', () => {

      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getStretch(widget)).to.equal(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setStretch(widget, 8);
        expect(BoxLayout.getStretch(widget)).to.equal(8);
      });

      it("should post a fit request to the widget's parent", (done) => {
        let parent = new Widget();
        let widget = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.addWidget(widget);
        BoxLayout.setStretch(widget, 8);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

    });

    describe('.getSizeBasis()', () => {

      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getSizeBasis(widget)).to.equal(0);
      });

    });

    describe('.setSizeBasis()', () => {

      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setSizeBasis(widget, 8);
        expect(BoxLayout.getSizeBasis(widget)).to.equal(8);
      });

      it("should post a fit request to the widget's parent", (done) => {
        let parent = new Widget();
        let widget = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.addWidget(widget);
        BoxLayout.setSizeBasis(widget, 8);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

    });

  });

});
