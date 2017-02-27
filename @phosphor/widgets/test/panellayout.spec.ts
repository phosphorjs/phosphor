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
  PanelLayout, Widget
} from '@phosphor/widgets';


class LogHook implements IMessageHook {

  messages: string[] = [];

  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type);
    return true;
  }
}


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

  protected onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
  }
}


describe('@phosphor/widgets', () => {

  describe('PanelLayout', () => {

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        layout.dispose();
        expect(every(widgets, w => w.isDisposed)).to.equal(true);
      });

    });

    describe('#widgets', () => {

      it('should be a read-only sequence of widgets in the layout', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        let widgets = layout.widgets;
        expect(widgets.length).to.equal(1);
        expect(widgets[0]).to.equal(widget);
      });

    });

    describe('#iter()', () => {

      it('should create an iterator over the widgets in the layout', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        each(widgets, w => { w.title.label = 'foo'; });
        let iter = layout.iter();
        expect(every(iter, w => w.title.label === 'foo')).to.equal(true);
        expect(layout.iter()).to.not.equal(iter);
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the layout', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.widgets[1]).to.equal(widget);
      });

      it('should move an existing widget to the end', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.addWidget(widget);
        expect(layout.widgets[1]).to.equal(widget);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget at the specified index', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(0, widget);
        expect(layout.widgets[0]).to.equal(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.widgets[0]).to.equal(widget);
      });

      it('should clamp the index to the bounds of the widgets', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(-2, widget);
        expect(layout.widgets[0]).to.equal(widget);
        layout.insertWidget(10, widget);
        expect(layout.widgets[1]).to.equal(widget);
      });

      it('should be a no-op if the index does not change', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(0, widget);
        expect(layout.widgets[0]).to.equal(widget);
      });

    });

    describe('#removeWidget()', () => {

      it('should remove a widget by value', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidget(widget);
        expect(layout.widgets.length).to.equal(1);
        expect(layout.widgets[0]).to.not.equal(widget);
      });

    });

    describe('#removeWidgetAt()', () => {

      it('should remove a widget at a given index', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidgetAt(0);
        expect(layout.widgets.length).to.equal(1);
        expect(layout.widgets[0]).to.not.equal(widget);
      });

    });

    describe('#init()', () => {

      it('should be invoked when the layout is installed on its parent', () => {
        let widget = new Widget();
        let layout = new LogPanelLayout();
        widget.layout = layout;
        expect(layout.methods).to.contain('init');
      });

      it('should attach all widgets to the DOM', () => {
        let parent = new Widget();
        Widget.attach(parent, document.body);
        let layout = new LogPanelLayout();
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
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.insertWidget(0, widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(panel.node.children[0]).to.equal(widget.node);
        panel.dispose();
      });

      it("should send before/after attach messages if the parent is attached", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        let hook = new LogHook();
        panel.layout = layout;
        MessageLoop.installMessageHook(widget, hook);
        Widget.attach(panel, document.body);
        layout.insertWidget(0, widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(hook.messages).to.contain('before-attach');
        expect(hook.messages).to.contain('after-attach');
        panel.dispose();
      });

    });

    describe('#moveWidget()', () => {

      it("should move a widget in the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(1, widget);
        expect(layout.methods).to.contain('moveWidget');
        expect(panel.node.children[1]).to.equal(widget.node);
        panel.dispose();
      });

      it("should send before/after detach/attach messages if the parent is attached", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        panel.layout = layout;
        Widget.attach(panel, document.body);
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(1, widget);
        expect(layout.methods).to.contain('moveWidget');
        expect(hook.messages).to.contain('before-detach');
        expect(hook.messages).to.contain('after-detach');
        expect(hook.messages).to.contain('before-attach');
        expect(hook.messages).to.contain('after-attach');
        panel.dispose();
      });

    });

    describe('#detachWidget()', () => {

      it("should detach a widget from the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.insertWidget(0, widget);
        expect(panel.node.children[0]).to.equal(widget.node);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        panel.dispose();
      });

      it("should send before/after detach message if the parent is attached", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        panel.layout = layout;
        Widget.attach(panel, document.body);
        layout.insertWidget(0, widget);
        expect(panel.node.children[0]).to.equal(widget.node);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(hook.messages).to.contain('before-detach');
        expect(hook.messages).to.contain('after-detach');
        panel.dispose();
      });

    });

    describe('#onChildRemoved()', () => {

      it('should be called when a widget is removed from its parent', () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        widget.parent = null;
        expect(layout.methods).to.contain('onChildRemoved');
      });

      it('should remove the widget from the layout', () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        widget.parent = null;
        expect(layout.widgets.length).to.equal(0);
      });

    });

  });

});
