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
  ArrayExt, IIterator, each, iter
} from '@phosphor/algorithm';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  Layout, Title, Widget
} from '@phosphor/widgets';


export
class LogWidget extends Widget {

  messages: string[] = [];

  methods: string[] = [];

  raw: Message[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    this.messages.push(msg.type);
  }

  protected notifyLayout(msg: Message): void {
    super.notifyLayout(msg);
    this.methods.push('notifyLayout');
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.methods.push('onActivateRequest');
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.methods.push('onCloseRequest');
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onBeforeHide(msg: Message): void {
    super.onBeforeHide(msg);
    this.methods.push('onBeforeHide');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onChildAdded(msg: Widget.ChildMessage): void {
    super.onChildAdded(msg);
    this.methods.push('onChildAdded');
    this.raw.push(msg);
  }

  protected onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
    this.raw.push(msg);
  }
}


class TestLayout extends Layout {

  dispose(): void {
    while (this._widgets.length !== 0) {
      this._widgets.pop()!.dispose();
    }
    super.dispose();
  }

  iter(): IIterator<Widget> {
    return iter(this._widgets);
  }

  removeWidget(widget: Widget): void {
    ArrayExt.removeFirstOf(this._widgets, widget);
  }

  private _widgets = [new Widget(), new Widget()];
}


describe('@phosphor/widgets', () => {

  describe('Widget', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let widget = new Widget();
        expect(widget).to.be.an.instanceof(Widget);
      });

      it('should accept options', () => {
        let span = document.createElement('span');
        let widget = new Widget({ node: span });
        expect(widget.node).to.equal(span);
      });

      it('should add the `p-Widget` class', () => {
        let widget = new Widget();
        expect(widget.hasClass('p-Widget')).to.equal(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the widget', () => {
        let widget = new Widget();
        widget.dispose();
        expect(widget.isDisposed).to.equal(true);
      });

      it('should be a no-op if the widget already disposed', () => {
        let called = false;
        let widget = new Widget();
        widget.dispose();
        widget.disposed.connect(() => { called = true; });
        widget.dispose();
        expect(called).to.equal(false);
        expect(widget.isDisposed).to.equal(true);
      });

      it('should remove the widget from its parent', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        child.dispose();
        expect(parent.isDisposed).to.equal(false);
        expect(child.isDisposed).to.equal(true);
        expect(child.parent).to.equal(null);
      });

      it('should automatically detach the widget', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        widget.dispose();
        expect(widget.isAttached).to.equal(false);
      });

      it('should dispose of the widget layout', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.isDisposed).to.equal(true);
      });

    });

    describe('#disposed', () => {

      it('should be emitted when the widget is disposed', () => {
        let called = false;
        let widget = new Widget();
        widget.disposed.connect(() => { called = true; });
        widget.dispose();
        expect(called).to.equal(true);
      });

    });

    describe('#isDisposed', () => {

      it('should be `true` if the widget is disposed', () => {
        let widget = new Widget();
        widget.dispose();
        expect(widget.isDisposed).to.equal(true);
      });

      it('should be `false` if the widget is not disposed', () => {
        let widget = new Widget();
        expect(widget.isDisposed).to.equal(false);
      });

    });

    describe('#isAttached', () => {

      it('should be `true` if the widget is attached', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not attached', () => {
        let widget = new Widget();
        expect(widget.isAttached).to.equal(false);
      });

    });

    describe('#isHidden', () => {

      it('should be `true` if the widget is hidden', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.isHidden).to.equal(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not hidden', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isHidden).to.equal(false);
        widget.dispose();
      });

    });

    describe('#isVisible', () => {

      it('should be `true` if the widget is visible', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isVisible).to.equal(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not visible', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.isVisible).to.equal(false);
        widget.dispose();
      });

      it('should be `false` if the widget is not attached', () => {
        let widget = new Widget();
        expect(widget.isVisible).to.equal(false);
      });

    });

    describe('#node', () => {

      it('should get the DOM node owned by the widget', () => {
        let widget = new Widget();
        let node = widget.node;
        expect(node.tagName.toLowerCase()).to.equal('div');
      });

    });

    describe('#id', () => {

      it('should get the id of the widget node', () => {
        let widget = new Widget();
        widget.node.id = 'foo';
        expect(widget.id).to.equal('foo');
      });

      it('should set the id of the widget node', () => {
        let widget = new Widget();
        widget.id = 'bar';
        expect(widget.node.id).to.equal('bar');
      });

    });

    describe('#title', () => {

      it('should get the title data object for the widget', () => {
        let widget = new Widget();
        expect(widget.title).to.be.an.instanceof(Title);
      });

    });

    describe('#parent', () => {

      it('should default to `null`', () => {
        let widget = new Widget();
        expect(widget.parent).to.equal(null);
      });

      it('should set the parent and send a `child-added` messagee', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(child.parent).to.equal(parent);
        expect(parent.messages).to.contain('child-added');
      });

      it('should remove itself from the current parent', () => {
        let parent0 = new LogWidget();
        let parent1 = new LogWidget();
        let child = new Widget();
        child.parent = parent0;
        child.parent = parent1;
        expect(parent0.messages).to.contain('child-removed');
        expect(parent1.messages).to.contain('child-added');
      });

      it('should throw an error if the widget contains the parent', () => {
        let widget0 = new Widget();
        let widget1 = new Widget();
        widget0.parent = widget1;
        expect(() => { widget1.parent = widget0; }).to.throw(Error);
      });

      it('should be a no-op if there is no parent change', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.parent = parent;
        expect(parent.messages).to.not.contain('child-removed');
      });

    });

    describe('#layout', () => {

      it('should default to `null`', () => {
        let widget = new Widget();
        expect(widget.layout).to.equal(null);
      });

      it('should set the layout for the widget', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        expect(widget.layout).to.equal(layout);
      });

      it('should be single-use only', () => {
        let widget = new Widget();
        widget.layout = new TestLayout();
        expect(() => { widget.layout = new TestLayout(); }).to.throw(Error);
      });

      it('should be disposed when the widget is disposed', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.isDisposed).to.equal(true);
      });

      it('should be a no-op if the layout is the same', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        widget.layout = layout;
        expect(widget.layout).to.equal(layout);
      });

      it('should throw an error if the layout already has a parent', () => {
        let widget0 = new Widget();
        let widget1 = new Widget();
        let layout = new TestLayout();
        widget0.layout = layout;
        expect(() => { widget1.layout = layout; }).to.throw(Error);
      });

      it('should throw an error if the `DisallowLayout` flag is set', () => {
        let widget = new Widget();
        widget.setFlag(Widget.Flag.DisallowLayout);
        let layout = new TestLayout();
        expect(() => { widget.layout = layout; }).to.throw(Error);
      });

    });

    describe('#children()', () => {

      it('should return an iterator over the widget children', () => {
        let widget = new Widget();
        widget.layout = new TestLayout();
        each(widget.children(), child => {
          expect(child).to.be.an.instanceof(Widget);
        });
      });

      it('should return an empty iterator if there is no layout', () => {
        let widget = new Widget();
        expect(widget.children().next()).to.equal(undefined);
      });

    });

    describe('#contains()', () => {

      it('should return `true` if the widget is a descendant', () => {
        let p1 = new Widget();
        let p2 = new Widget();
        let p3 = new Widget();
        let w1 = new Widget();
        let w2 = new Widget();
        p2.parent = p1;
        p3.parent = p2;
        w1.parent = p2;
        w2.parent = p3;
        expect(p1.contains(p1)).to.equal(true);
        expect(p1.contains(p2)).to.equal(true);
        expect(p1.contains(p3)).to.equal(true);
        expect(p1.contains(w1)).to.equal(true);
        expect(p1.contains(w2)).to.equal(true);
        expect(p2.contains(p2)).to.equal(true);
        expect(p2.contains(p3)).to.equal(true);
        expect(p2.contains(w1)).to.equal(true);
        expect(p2.contains(w2)).to.equal(true);
        expect(p3.contains(p3)).to.equal(true);
        expect(p3.contains(w2)).to.equal(true);
      });

      it('should return `false` if the widget is not a descendant', () => {
        let p1 = new Widget();
        let p2 = new Widget();
        let p3 = new Widget();
        let w1 = new Widget();
        let w2 = new Widget();
        p2.parent = p1;
        p3.parent = p2;
        w1.parent = p2;
        w2.parent = p3;
        expect(p2.contains(p1)).to.equal(false);
        expect(p3.contains(p1)).to.equal(false);
        expect(p3.contains(p2)).to.equal(false);
        expect(p3.contains(w1)).to.equal(false);
        expect(w1.contains(p1)).to.equal(false);
        expect(w1.contains(p2)).to.equal(false);
        expect(w1.contains(p3)).to.equal(false);
        expect(w1.contains(w2)).to.equal(false);
        expect(w2.contains(p1)).to.equal(false);
        expect(w2.contains(p2)).to.equal(false);
        expect(w2.contains(p3)).to.equal(false);
        expect(w2.contains(w1)).to.equal(false);
      });

    });

    describe('#hasClass()', () => {

      it('should return `true` if a node has a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.node.classList.add('baz');
        expect(widget.hasClass('foo')).to.equal(true);
        expect(widget.hasClass('bar')).to.equal(true);
        expect(widget.hasClass('baz')).to.equal(true);
      });

      it('should return `false` if a node does not have a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.node.classList.add('baz');
        expect(widget.hasClass('one')).to.equal(false);
        expect(widget.hasClass('two')).to.equal(false);
        expect(widget.hasClass('three')).to.equal(false);
      });

    });

    describe('#addClass()', () => {

      it('should add a class to the DOM node', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        expect(widget.node.classList.contains('bar')).to.equal(false);
        widget.addClass('bar');
        expect(widget.node.classList.contains('bar')).to.equal(true);
      });

      it('should be a no-op if the class is already present', () => {
        let widget = new Widget();
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
      });

    });

    describe('#removeClass()', () => {

      it('should remove the class from the DOM node', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.removeClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(false);
        expect(widget.node.classList.contains('bar')).to.equal(true);
        widget.removeClass('bar');
        expect(widget.node.classList.contains('bar')).to.equal(false);
      });

      it('should be a no-op if the class is not present', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.removeClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(false);
      });

    });

    describe('#toggleClass()', () => {

      it('should toggle the presence of a class', () => {
        let widget = new Widget();
        widget.toggleClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.toggleClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(false);
      });

      it('should force-add a class', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.toggleClass('foo', true);
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.toggleClass('foo', true);
        expect(widget.node.classList.contains('foo')).to.equal(true);
      });

      it('should force-remove a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.toggleClass('foo', false);
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.toggleClass('foo', false);
        expect(widget.node.classList.contains('foo')).to.equal(false);
      });

      it('should return `true` if the class is present', () => {
        let widget = new Widget();
        expect(widget.toggleClass('foo')).to.equal(true);
        expect(widget.toggleClass('foo', true)).to.equal(true);
      });

      it('should return `false` if the class is not present', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        expect(widget.toggleClass('foo')).to.equal(false);
        expect(widget.toggleClass('foo', false)).to.equal(false);
      });

    });

    describe('#update()', () => {

      it('should post an `update-request` message', (done) => {
        let widget = new LogWidget();
        widget.update();
        expect(widget.messages).to.deep.equal([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(['update-request']);
          done();
        });
      });

    });

    describe('#fit()', () => {

      it('should post a `fit-request` message to the widget', (done) => {
        let widget = new LogWidget();
        widget.fit();
        expect(widget.messages).to.deep.equal([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(['fit-request']);
          done();
        });
      });

    });

    describe('#activate()', () => {

      it('should post an `activate-request` message', (done) => {
        let widget = new LogWidget();
        widget.activate();
        expect(widget.messages).to.deep.equal([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(['activate-request']);
          done();
        });

      });

    });

    describe('#close()', () => {

      it('should send a `close-request` message', () => {
        let widget = new LogWidget();
        expect(widget.messages).to.deep.equal([]);
        widget.close();
        expect(widget.messages).to.deep.equal(['close-request']);
      });

    });

    describe('#show()', () => {

      it('should set `isHidden` to `false`', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.isHidden).to.equal(true);
        widget.show();
        expect(widget.isHidden).to.equal(false);
      });

      it('should remove the "p-mod-hidden" class', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.hasClass('p-mod-hidden')).to.equal(true);
        widget.show();
        expect(widget.hasClass('p-mod-hidden')).to.equal(false);
      });

      it('should send an `after-show` message if applicable', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.show();
        expect(widget.messages).to.contains('after-show');
        widget.dispose();
      });

      it('should send a `child-shown` message to the parent', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.hide();
        child.show();
        expect(parent.messages).to.contains('child-shown');
      });

      it('should be a no-op if not hidden', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.show();
        expect(widget.messages).to.not.contains('after-show');
        widget.dispose();
      });

    });

    describe('#hide()', () => {

      it('should hide the widget', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.isHidden).to.equal(true);
      });

      it('should add the `p-mod-hidden` class', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.hasClass('p-mod-hidden')).to.equal(true);
      });

      it('should send a `before-hide` message if applicable', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages).to.contain('before-hide');
        widget.dispose();
      });

      it('should send a `child-hidden` message to the parent', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.hide();
        expect(parent.messages).to.contain('child-hidden');
      });

      it('should be a no-op if already hidden', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages).to.not.contain('before-hide');
        widget.dispose();
      });

    });

    describe('#setHidden()', () => {

      it('should call hide if `hidden = true`', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.setHidden(true);
        expect(widget.isHidden).to.equal(true);
        expect(widget.messages).to.contain('before-hide');
        widget.dispose();
      });

      it('should call show if `hidden = false`', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.setHidden(false);
        expect(widget.isHidden).to.equal(false);
        expect(widget.messages).to.contain('after-show');
        widget.dispose();
      });

    });

    describe('#testFlag()', () => {

      it('should test whether the given widget flag is set', () => {
        let widget = new Widget();
        expect(widget.testFlag(Widget.Flag.IsHidden)).to.equal(false);
      });

    });

    describe('#setFlag()', () => {

      it('should set the given widget flag', () => {
        let widget = new Widget();
        widget.setFlag(Widget.Flag.IsHidden);
        expect(widget.testFlag(Widget.Flag.IsHidden)).to.equal(true);
      });

    });

    describe('#clearFlag()', () => {

      it('should clear the given widget flag', () => {
        let widget = new Widget();
        widget.setFlag(Widget.Flag.IsHidden);
        widget.clearFlag(Widget.Flag.IsHidden);
        expect(widget.testFlag(Widget.Flag.IsHidden)).to.equal(false);
      });

    });

    describe('#notifyLayout()', () => {

      it("should send a message to the widget's layout", () => {
        let child = new LogWidget();
        let parent = new LogWidget();
        let layout = new TestLayout();
        parent.layout = layout;
        child.parent = parent;
        expect(parent.methods).to.contain('notifyLayout');
      });

    });

    describe('#onActivateRequest()', () => {

      it('should be invoked on an `activate-request', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.ActivateRequest);
        expect(widget.methods).to.contain('onActivateRequest');
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.ActivateRequest);
        expect(widget.methods).to.contain('notifyLayout');
      });

    });

    describe('#onCloseRequest()', () => {

      it('should be invoked on a `close-request`', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest);
        expect(widget.messages).to.contain('close-request');
        expect(widget.methods).to.contain('onCloseRequest');
      });

      it('should unparent a child widget by default', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        MessageLoop.sendMessage(child, Widget.Msg.CloseRequest);
        expect(child.parent).to.equal(null);
      });

      it('should detach a root widget by default', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest);
        expect(widget.isAttached).to.equal(false);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest);
        expect(widget.methods).to.contain('notifyLayout');
      });

    });

    describe('#onResize()', () => {

      it('should be invoked when the widget is resized', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
        expect(widget.messages).to.contain('resize');
        expect(widget.methods).to.contain('onResize');
        widget.dispose();
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be invoked when an update is requested', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);
        expect(widget.messages).to.contain('update-request');
        expect(widget.methods).to.contain('onUpdateRequest');
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);
        expect(widget.methods).to.contain('notifyLayout');
      });

    });

    describe('#onAfterShow()', () => {

      it('should be invoked just after the widget is made visible', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        widget.show();
        expect(widget.messages).to.contain('after-show');
        expect(widget.methods).to.contain('onAfterShow');
        widget.dispose();
      });

      it('should set the `isVisible` flag', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        widget.show();
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        widget.dispose();
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        widget.show();
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });

    });

    describe('#onBeforeHide()', () => {

      it('should be invoked just before the widget is made not-visible', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages).to.contain('before-hide');
        expect(widget.methods).to.contain('onBeforeHide');
        widget.dispose();
      });

      it('should clear the `isVisible` flag', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        widget.hide();
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        widget.dispose();
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });

    });

    describe('#onAfterAttach()', () => {

      it('should be invoked just after the widget is attached', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.messages).to.contain('after-attach');
        expect(widget.methods).to.contain('onAfterAttach');
        widget.dispose();
      });

      it('should set the visible flag if warranted', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        Widget.detach(widget);

        widget.hide();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        Widget.detach(widget);

        let child = new LogWidget();
        child.parent = widget;
        widget.show();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        Widget.detach(widget);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should be invoked just before the widget is detached', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        Widget.detach(widget);
        expect(widget.messages).to.contain('before-detach');
        expect(widget.methods).to.contain('onBeforeDetach');
      });

      it('should clear the `isVisible` and `isAttached` flags', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        expect(widget.testFlag(Widget.Flag.IsAttached)).to.equal(true);
        Widget.detach(widget);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        expect(widget.testFlag(Widget.Flag.IsAttached)).to.equal(false);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        Widget.detach(widget);
        expect(widget.methods).to.contain('notifyLayout');
      });

    });

    describe('#onChildAdded()', () => {

      it('should be invoked when a child is added', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(parent.methods).to.contain('onChildAdded');
      });

      it('should notify the layout', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(parent.methods).to.contain('notifyLayout');
      });

      context('`msg` parameter', () => {

        it('should be a `ChildMessage`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect(parent.raw[0]).to.be.an.instanceof(Widget.ChildMessage);
        });

        it('should have a `type` of `child-added`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect(parent.raw[0].type).to.equal('child-added');
        });

        it('should have the correct `child`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect((parent.raw[0] as Widget.ChildMessage).child).to.equal(child);
        });

      });

    });

    describe('#onChildRemoved()', () => {

      it('should be invoked when a child is removed', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        child.parent = null;
        expect(parent.methods).to.contain('onChildRemoved');
      });

      it('should notify the layout', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        parent.methods = [];
        child.parent = null;
        expect(parent.methods).to.contain('notifyLayout');
      });

      context('`msg` parameter', () => {

        it('should be a `ChildMessage`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect(parent.raw[0]).to.be.an.instanceof(Widget.ChildMessage);
        });

        it('should have a `type` of `child-removed`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect((parent.raw[0] as Widget.ChildMessage).type).to.equal('child-removed');
        });

        it('should have the correct `child`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect((parent.raw[0] as Widget.ChildMessage).child).to.equal(child);
        });

      });

    });

    describe('.ChildMessage', () => {

      describe('#constructor()', () => {

        it('should accept the message type and child widget', () => {
          let msg = new Widget.ChildMessage('test', new Widget());
          expect(msg).to.be.an.instanceof(Widget.ChildMessage);
        });

      });

      describe('#child', () => {

        it('should be the child passed to the constructor', () => {
          let widget = new Widget();
          let msg = new Widget.ChildMessage('test', widget);
          expect(msg.child).to.equal(widget);
        });

      });

    });

    describe('.ResizeMessage', () => {

      describe('#constructor()', () => {

        it('should accept a width and height', () => {
          let msg = new Widget.ResizeMessage(100, 100);
          expect(msg).to.be.an.instanceof(Widget.ResizeMessage);
        });

      });

      describe('#width', () => {

        it('should be the width passed to the constructor', () => {
          let msg = new Widget.ResizeMessage(100, 200);
          expect(msg.width).to.equal(100);
        });

      });

      describe('#height', () => {

        it('should be the height passed to the constructor', () => {
          let msg = new Widget.ResizeMessage(100, 200);
          expect(msg.height).to.equal(200);
        });

      });

      describe('.UnknownSize', () => {

        it('should be a `ResizeMessage`', () => {
          let msg = Widget.ResizeMessage.UnknownSize;
          expect(msg).to.be.an.instanceof(Widget.ResizeMessage);
        });

        it('should have a `width` of `-1`', () => {
          let msg = Widget.ResizeMessage.UnknownSize;
          expect(msg.width).to.equal(-1);
        });

        it('should have a `height` of `-1`', () => {
          let msg = Widget.ResizeMessage.UnknownSize;
          expect(msg.height).to.equal(-1);
        });

      });

    });

    describe('.attach()', () => {

      it('should attach a root widget to a host', () => {
        let widget = new Widget();
        expect(widget.isAttached).to.equal(false);
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        widget.dispose();
      });

      it('should throw if the widget is not a root', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        expect(() => { Widget.attach(child, document.body); }).to.throw(Error);
      });

      it('should throw if the widget is already attached', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(() => { Widget.attach(widget, document.body); }).to.throw(Error);
        widget.dispose();
      });

      it('should throw if the host is not attached to the DOM', () => {
        let widget = new Widget();
        let host = document.createElement('div');
        expect(() => { Widget.attach(widget, host); }).to.throw(Error);
      });

      it('should dispatch an `after-attach` message', () => {
        let widget = new LogWidget();
        expect(widget.isAttached).to.equal(false);
        expect(widget.messages).to.not.contain('after-attach');
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        expect(widget.messages).to.contain('after-attach');
        widget.dispose();
      });

    });

    describe('.detach()', () => {

      it('should detach a root widget from its host', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        Widget.detach(widget);
        expect(widget.isAttached).to.equal(false);
        widget.dispose();
      });

      it('should throw if the widget is not a root', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        Widget.attach(parent, document.body);
        expect(() => { Widget.detach(child); }).to.throw(Error);
        parent.dispose();
      });

      it('should throw if the widget is not attached', () => {
        let widget = new Widget();
        expect(() => { Widget.detach(widget); }).to.throw(Error);
      });

      it('should dispatch a `before-detach` message', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.messages = [];
        Widget.detach(widget);
        expect(widget.messages).to.contain('before-detach');
        widget.dispose();
      });

    });

    describe('.prepareGeometry()', () => {

      it('should set the inline style position of the widget to `absolute`', () => {
        let widget = new Widget();
        widget.node.style.position = 'relative';
        Widget.prepareGeometry(widget);
        expect(widget.node.style.position).to.equal('absolute');
      });

    });

    describe('.resetGeometry()', () => {

      it('should clear the inline style position and geometry of the widget', () => {
        let widget = new Widget();
        Widget.setGeometry(widget, 10, 10, 10, 10);
        Widget.resetGeometry(widget);
        let style = widget.node.style;
        expect(style.position).to.equal('');
        expect(style.top).to.equal('');
        expect(style.left).to.equal('');
        expect(style.width).to.equal('');
        expect(style.height).to.equal('');
      });

    });

    describe('.setGeometry()', () => {

      it('should set the absolute layout geometry of the widget', () => {
        let widget = new Widget();
        Widget.setGeometry(widget, 10, 10, 10, 10);
        let style = widget.node.style;
        expect(style.top).to.equal('10px');
        expect(style.left).to.equal('10px');
        expect(style.width).to.equal('10px');
        expect(style.height).to.equal('10px');
      });

      it('should send a `resize` message if the size has changed', () => {
        let widget = new LogWidget();
        Widget.setGeometry(widget, 10, 10, 10, 10);
        expect(widget.messages.indexOf('resize')).to.not.equal(-1);
      });

    });

  });

});
