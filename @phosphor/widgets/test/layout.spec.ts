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
  ArrayExt, IIterator, every, iter, toArray
} from '@phosphor/algorithm';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  Layout, Widget
} from '@phosphor/widgets';

import {
  LogWidget
} from './widget.spec';


class LogLayout extends Layout {

  methods: string[] = [];

  widgets = [new LogWidget(), new LogWidget()];

  dispose(): void {
    while (this.widgets.length !== 0) {
      this.widgets.pop()!.dispose();
    }
    super.dispose();
  }

  iter(): IIterator<Widget> {
    return iter(this.widgets);
  }

  removeWidget(widget: Widget): void {
    this.methods.push('removeWidget');
    ArrayExt.removeFirstOf(this.widgets, widget);
  }

  protected init(): void {
    this.methods.push('init');
    super.init();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

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

  protected onBeforeHide(msg: Message): void {
    super.onBeforeHide(msg);
    this.methods.push('onBeforeHide');
  }

  protected onFitRequest(msg: Widget.ChildMessage): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }

  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }
}


describe('@phosphor/widgets', () => {

  describe('Layout', () => {

    describe('#iter()', () => {

      it('should create an iterator over the widgets in the layout', () => {
        let layout = new LogLayout();
        expect(every(layout, child => child instanceof Widget)).to.equal(true);
      });

    });

    describe('#removeWidget()', () => {

      it("should be invoked when a child widget's `parent` property is set to `null`", () => {
        let parent = new Widget();
        let layout = new LogLayout();
        parent.layout = layout;
        layout.widgets[0].parent = null;
        expect(layout.methods).to.contain('removeWidget');
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resource held by the layout', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        let children = toArray(widget.children());
        layout.dispose();
        expect(layout.parent).to.equal(null);
        expect(every(children, w => w.isDisposed)).to.equal(true);
      });

      it('should be called automatically when the parent is disposed', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.parent).to.equal(null);
        expect(layout.isDisposed).to.equal(true);
      });

    });

    describe('#isDisposed', () => {

      it('should test whether the layout is disposed', () => {
        let layout = new LogLayout();
        expect(layout.isDisposed).to.equal(false);
        layout.dispose();
        expect(layout.isDisposed).to.equal(true);
      });

    });

    describe('#parent', () => {

      it('should get the parent widget of the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(layout.parent).to.equal(parent);
      });

      it('should throw an error if set to `null`', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(() => { layout.parent = null; }).to.throw(Error);
      });

      it ('should throw an error if set to a different value', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(() => { layout.parent = new Widget(); }).to.throw(Error);
      });

      it('should be a no-op if the parent is set to the same value', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        layout.parent = parent;
        expect(layout.parent).to.equal(parent);
      });

    });

    describe('#init()', () => {

      it('should be invoked when the layout is installed on its parent widget', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        expect(layout.methods).to.contain('init');
      });

      it('should reparent the child widgets', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        expect(every(layout, child => child.parent === widget)).to.equal(true);
      });

    });

    describe('#onResize()', () => {

      it('should be invoked on a `resize` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
      });

      it('should send a `resize` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        expect(layout.widgets[0].methods).to.contain('onResize');
        expect(layout.widgets[1].methods).to.contain('onResize');
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be invoked on an `update-request` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest);
        expect(layout.methods).to.contain('onUpdateRequest');
      });

      it('should send a `resize` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest);
        expect(layout.methods).to.contain('onUpdateRequest');
        expect(layout.widgets[0].methods).to.contain('onResize');
        expect(layout.widgets[1].methods).to.contain('onResize');
      });

    });

    describe('#onAfterAttach()', () => {

      it('should be invoked on an `after-attach` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.AfterAttach);
        expect(layout.methods).to.contain('onAfterAttach');
      });

      it('should send an `after-attach` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.AfterAttach);
        expect(layout.methods).to.contain('onAfterAttach');
        expect(layout.widgets[0].methods).to.contain('onAfterAttach');
        expect(layout.widgets[1].methods).to.contain('onAfterAttach');
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should be invoked on an `before-detach` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeDetach);
        expect(layout.methods).to.contain('onBeforeDetach');
      });

      it('should send a `before-detach` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeDetach);
        expect(layout.methods).to.contain('onBeforeDetach');
        expect(layout.widgets[0].methods).to.contain('onBeforeDetach');
        expect(layout.widgets[1].methods).to.contain('onBeforeDetach');
      });

    });

    describe('#onAfterShow()', () => {

      it('should be invoked on an `after-show` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.AfterShow);
        expect(layout.methods).to.contain('onAfterShow');
      });

      it('should send an `after-show` message to non hidden of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        layout.widgets[0].hide();
        MessageLoop.sendMessage(parent, Widget.Msg.AfterShow);
        expect(layout.methods).to.contain('onAfterShow');
        expect(layout.widgets[0].methods).to.not.contain('onAfterShow');
        expect(layout.widgets[1].methods).to.contain('onAfterShow');
      });

    });

    describe('#onBeforeHide()', () => {

      it('should be invoked on a `before-hide` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeHide);
        expect(layout.methods).to.contain('onBeforeHide');
      });

      it('should send a `before-hide` message to non hidden of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        layout.widgets[0].hide();
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeHide);
        expect(layout.methods).to.contain('onBeforeHide');
        expect(layout.widgets[0].methods).to.not.contain('onBeforeHide');
        expect(layout.widgets[1].methods).to.contain('onBeforeHide');
      });

    });

    describe('#onFitRequest()', () => {

      it('should be invoked on an `fit-request` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.FitRequest);
        expect(layout.methods).to.contain('onFitRequest');
      });

    });

    describe('#onChildShown()', () => {

      it('should be invoked on an `child-shown` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let msg = new Widget.ChildMessage('child-shown', new Widget());
        MessageLoop.sendMessage(parent, msg);
        expect(layout.methods).to.contain('onChildShown');
      });

    });

    describe('#onChildHidden()', () => {

      it('should be invoked on an `child-hidden` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let msg = new Widget.ChildMessage('child-hidden', new Widget());
        MessageLoop.sendMessage(parent, msg);
        expect(layout.methods).to.contain('onChildHidden');
      });

    });

  });

});
