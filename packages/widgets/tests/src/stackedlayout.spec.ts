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
  IMessageHandler, IMessageHook, Message, MessageLoop
} from '@phosphor/messaging';

import {
  StackedLayout, Widget
} from '@phosphor/widgets';


class LogHook implements IMessageHook {

  messages: string[] = [];

  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type);
    return true;
  }
}


class LogStackedLayout extends StackedLayout {

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


describe('@phosphor/widgets', () => {

  describe('StackedLayout', () => {

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(parent.node.contains(widget.node)).to.equal(true);
      });

      it("should send before/after attach messages if the parent is attached", () => {
        let layout = new LogStackedLayout();
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

      it('should post a fit request for the parent widget', (done) => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
        parent.layout = layout;
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
        let layout = new LogStackedLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        layout.insertWidget(2, widgets[0]);
        expect(layout.methods).to.contain('moveWidget');
        expect(layout.widgets[2]).to.equal(widgets[0]);
      });

      it('should post an update request to the parent', (done) => {
        let layout = new LogStackedLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        layout.insertWidget(2, widgets[0]);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onUpdateRequest');
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
        expect(layout.methods).to.contain('detachWidget');
        expect(parent.node.contains(widget.node)).to.equal(false);
        parent.dispose();
      });

      it("should send before/after detach message if the parent is attached", () => {
        let layout = new LogStackedLayout();
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
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
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

      it('should reset the z-index for the widget', (done) => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget1 = new Widget();
        let widget2 = new Widget();
        parent.layout = layout;
        layout.addWidget(widget1);
        layout.addWidget(widget2);
        Widget.attach(parent, document.body);
        requestAnimationFrame(() => {
          // string casts are required for IE
          expect(`${widget1.node.style.zIndex}`).to.equal('0');
          expect(`${widget2.node.style.zIndex}`).to.equal('1');
          layout.removeWidget(widget1);
          expect(`${widget1.node.style.zIndex}`).to.equal('');
          expect(`${widget2.node.style.zIndex}`).to.equal('1');
          layout.removeWidget(widget2);
          expect(`${widget2.node.style.zIndex}`).to.equal('');
          parent.dispose();
          done();
        });
      });

    });

    describe('#onAfterShow()', () => {

      it('should post an update to the parent', (done) => {
        let layout = new LogStackedLayout();
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
        let layout = new LogStackedLayout();
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

      it('should post or send a fit request to the parent', (done) => {
        let parent = new Widget();
        let layout = new LogStackedLayout();
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

      it('should post or send a fit request to the parent', (done) => {
        let parent = new Widget();
        let layout = new LogStackedLayout();
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

  });

});
