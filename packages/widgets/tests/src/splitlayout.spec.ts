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
  IMessageHandler, IMessageHook, Message, MessageLoop
} from '@phosphor/messaging';

import {
  SplitLayout, Widget
} from '@phosphor/widgets';


const renderer: SplitLayout.IRenderer = {
  createHandle: () => document.createElement('div')
};


class LogSplitLayout extends SplitLayout {

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


class LogHook implements IMessageHook {

  messages: string[] = [];

  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type);
    return true;
  }
}


describe('@phosphor/widgets', () => {

  describe('SplitLayout', () => {

    describe('#constructor()', () => {

      it('should accept a renderer', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout).to.be.an.instanceof(SplitLayout);
      });

    });

    describe('#orientation', () => {

      it('should get the layout orientation for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout.orientation).to.equal('horizontal');
      });

      it('should set the layout orientation for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        layout.orientation = 'vertical';
        expect(layout.orientation).to.equal('vertical');
      });

      it('should set the orientation attribute of the parent widget', () => {
        let parent = new Widget();
        let layout = new SplitLayout({ renderer });
        parent.layout = layout;
        layout.orientation = 'vertical';
        expect(parent.node.getAttribute('data-orientation')).to.equal('vertical');
        layout.orientation = 'horizontal';
        expect(parent.node.getAttribute('data-orientation')).to.equal('horizontal');
      });

      it('should post a fit request to the parent widget', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.orientation = 'vertical';
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.orientation = 'horizontal';
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });

    });

    describe('#spacing', () => {

      it('should get the inter-element spacing for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout.spacing).to.equal(4);
      });

      it('should set the inter-element spacing for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        layout.spacing = 10;
        expect(layout.spacing).to.equal(10);
      });

      it('should post a fit rquest to the parent widget', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.spacing = 10;
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.spacing = 4;
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });

    });

    describe('#renderer', () => {

      it('should get the renderer for the layout', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout.renderer).to.equal(renderer);
      });

    });

    describe('#handles', () => {

      it('should be a read-only sequence of the split handles in the layout', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        expect(every(layout.handles, h => h instanceof HTMLElement));
      });

    });

    describe('#relativeSizes()', () => {

      it('should get the current sizes of the widgets in the layout', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        let sizes = layout.relativeSizes();
        expect(sizes).to.deep.equal([1/3, 1/3, 1/3]);
        parent.dispose();
      });

    });

    describe('#setRelativeSizes()', () => {

      it('should set the desired sizes for the widgets in the panel', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        layout.setRelativeSizes([10, 10, 10]);
        let sizes = layout.relativeSizes();
        expect(sizes).to.deep.equal([10/30, 10/30, 10/30]);
        parent.dispose();
      });

      it('should ignore extra values', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        layout.setRelativeSizes([10, 15, 20, 20]);
        let sizes = layout.relativeSizes();
        expect(sizes).to.deep.equal([10/45, 15/45, 20/45]);
        parent.dispose();
      });

    });

    describe('#moveHandle()', () => {

      it('should set the offset position of a split handle', (done) => {
        let parent = new Widget();
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        each(widgets, w => { w.node.style.minHeight = '100px'; });
        each(widgets, w => { w.node.style.minWidth = '100px'; });
        parent.layout = layout;
        Widget.attach(parent, document.body);
        MessageLoop.flush();
        let handle = layout.handles[1];
        let left = handle.offsetLeft;
        layout.moveHandle(1, left + 20);
        requestAnimationFrame(() => {
          expect(handle.offsetLeft).to.not.equal(left);
          done();
        });
      });

    });

    describe('#init()', () => {

      it('should set the orientation attribute of the parent widget', () => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        expect(layout.methods).to.contain('init');
        expect(parent.node.getAttribute('data-orientation')).to.equal('horizontal');
      });

      it('should attach all widgets to the DOM', () => {
        let parent = new Widget();
        Widget.attach(parent, document.body);
        let layout = new LogSplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        parent.layout = layout;
        expect(every(widgets, w => w.parent === parent)).to.equal(true);
        expect(every(widgets, w => w.isAttached)).to.equal(true);
        parent.dispose();
      });

    });

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(parent.node.contains(widget.node)).to.equal(true);
        expect(layout.handles.length).to.equal(1);
      });

      it("should send before/after attach messages if the parent is attached", () => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        parent.layout = layout;
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        expect(hook.messages).to.contain('before-attach');
        expect(hook.messages).to.contain('after-attach');
      });

      it('should post a layout request for the parent widget', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

    });

    describe('#moveWidget()', () => {

      it("should move a widget in the parent's DOM node", () => {
        let layout = new LogSplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        let widget = widgets[0];
        let handle = layout.handles[0];
        layout.insertWidget(2, widget);
        expect(layout.methods).to.contain('moveWidget');
        expect(layout.handles[2]).to.equal(handle);
        expect(layout.widgets[2]).to.equal(widget);
      });

      it('should post a a layout request to the parent', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        let widget = widgets[0];
        layout.insertWidget(2, widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

    });

    describe('#detachWidget()', () => {

      it("should detach a widget from the parent's DOM node", () => {
        let layout = new LogSplitLayout({ renderer });
        let widget = new Widget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(parent.node.contains(widget.node)).to.equal(false);
        parent.dispose();
      });

      it("should send before/after detach message if the parent is attached", () => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(hook.messages).to.contain('before-detach');
        expect(hook.messages).to.contain('after-detach');
        parent.dispose();
      });

      it('should post a a layout request to the parent', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let widget = new Widget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });

    });

    describe('#onAfterShow()', () => {

      it('should post an update to the parent', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        parent.hide();
        Widget.attach(parent, document.body);
        parent.show();
        expect(layout.methods).to.contain('onAfterShow');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onUpdateRequest');
          parent.dispose();
          done();
        });
      });

    });

    describe('#onAfterAttach()', () => {

      it('should post a layout request to the parent', (done) => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        expect(layout.methods).to.contain('onAfterAttach');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });

    });

    describe('#onChildShown()', () => {

      it('should post a fit request to the parent', (done) => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
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
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
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

    describe('#onResize', () => {

      it('should be called when a resize event is sent to the parent', () => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        parent.dispose();
      });

    });

    describe('.getStretch()', () => {

      it('should get the split layout stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(SplitLayout.getStretch(widget)).to.equal(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the split layout stretch factor for the given widget', () => {
        let widget = new Widget();
        SplitLayout.setStretch(widget, 10);
        expect(SplitLayout.getStretch(widget)).to.equal(10);
      });

      it('should post a fit request to the parent', (done) => {
        let parent = new Widget();
        let widget = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        layout.addWidget(widget);
        SplitLayout.setStretch(widget, 10);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

    });

  });

});
