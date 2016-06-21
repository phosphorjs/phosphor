/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  IIterator, each, every, toArray
} from '../../../lib/algorithm/iteration';

import {
  Vector
} from '../../../lib/collections/vector';

import {
  Message, sendMessage
} from '../../../lib/core/messaging';

import {
  Title
} from '../../../lib/ui/title';

import {
  ChildMessage, Layout, ResizeMessage, Widget, WidgetFlag, WidgetMessage
} from '../../../lib/ui/widget';


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

  protected onFocusRequest(msg: Message): void {
    super.onFocusRequest(msg);
    this.methods.push('onFocusRequest');
  }

  protected onBlurRequest(msg: Message): void {
    super.onBlurRequest(msg);
    this.methods.push('onBlurRequest');
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.methods.push('onCloseRequest');
  }

  protected onResize(msg: ResizeMessage): void {
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

  protected onChildAdded(msg: ChildMessage): void {
    super.onChildAdded(msg);
    this.methods.push('onChildAdded');
    this.raw.push(msg);
  }

  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
    this.raw.push(msg);
  }
}


class LogLayout extends Layout {

  methods: string[] = [];

  constructor() {
    super();
    this._widgets.pushBack(new LogWidget());
    this._widgets.pushBack(new LogWidget());
  }

  iter(): IIterator<LogWidget> {
    return this._widgets.iter();
  }

  dispose(): void {
    each(this._widgets, w => w.dispose());
    this._widgets = null;
    super.dispose();
  }

  protected onLayoutChanged(msg: Message): void {
    this.methods.push('onLayoutChanged');
  }

  protected onChildRemoved(msg: ChildMessage): void {
    this.methods.push('onChildRemoved');
  }

  protected onResize(msg: ResizeMessage): void {
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

  protected onFitRequest(msg: ChildMessage): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }

  protected onChildShown(msg: ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }

  private _widgets = new Vector<LogWidget>();
}


describe('ui/widget', () => {

  describe('Widget', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let widget = new Widget();
        expect(widget).to.be.a(Widget);
      });

      it('should accept options', () => {
        let span = document.createElement('span');
        let widget = new Widget({ node: span });
        expect(widget.node).to.be(span);
      });

      it('should add the `p-Widget` class', () => {
        let widget = new Widget();
        expect(widget.hasClass('p-Widget')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the widget', () => {
        let widget = new Widget();
        widget.dispose();
        expect(widget.isDisposed).to.be(true);
      });

      it('should be a no-op if the widget already disposed', () => {
        let called = false;
        let widget = new Widget();
        widget.dispose();
        widget.disposed.connect(() => { called = true; });
        widget.dispose();
        expect(called).to.be(false);
        expect(widget.isDisposed).to.be(true);
      });

      it('should remove the widget from its parent', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        child.dispose();
        expect(parent.isDisposed).to.be(false);
        expect(child.isDisposed).to.be(true);
        expect(child.parent).to.be(null);
      });

      it('should automatically detach the widget', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.be(true);
        widget.dispose();
        expect(widget.isAttached).to.be(false);
      });

      it('should dispose of the widget layout', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.isDisposed).to.be(true);
      });

      it("should dispose of the widget's descendant widgets", () => {
        let widget = new LogWidget();
        let layout = new LogLayout();
        widget.layout = layout;
        let children = widget.children();
        widget.dispose();
        expect(every(children, w => w.isDisposed)).to.be(true);
      });

    });

    describe('#disposed', () => {

      it('should be emitted when the widget is disposed', () => {
        let called = false;
        let widget = new Widget();
        widget.disposed.connect(() => { called = true; });
        widget.dispose();
        expect(called).to.be(true);
      });

    });

    describe('#isDisposed', () => {

      it('should be `true` if the widget is disposed', () => {
        let widget = new Widget();
        widget.dispose();
        expect(widget.isDisposed).to.be(true);
      });

      it('should be `false` if the widget is not disposed', () => {
        let widget = new Widget();
        expect(widget.isDisposed).to.be(false);
      });

      it('should be read-only', () => {
        let widget = new Widget();
        expect(() => { widget.isDisposed = true; }).to.throwError();
      });

    });

    describe('#isAttached', () => {

      it('should be `true` if the widget is attached', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.be(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not attached', () => {
        let widget = new Widget();
        expect(widget.isAttached).to.be(false);
      });

      it('should be read-only', () => {
        let widget = new Widget();
        expect(() => { widget.isAttached = true; }).to.throwError();
      });

    });

    describe('#isHidden', () => {

      it('should be `true` if the widget is hidden', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.isHidden).to.be(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not hidden', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isHidden).to.be(false);
        widget.dispose();
      });

      it('should be read-only', () => {
        let widget = new Widget();
        expect(() => { widget.isHidden = true; }).to.throwError();
      });

    });

    describe('#isVisible', () => {

      it('should be `true` if the widget is visible', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isVisible).to.be(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not visible', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.isVisible).to.be(false);
        widget.dispose();
      });

      it('should be `false` if the widget is not attached', () => {
        let widget = new Widget();
        expect(widget.isVisible).to.be(false);
      });

      it('should be read-only', () => {
        let widget = new Widget();
        expect(() => { widget.node = null; }).to.throwError();
      });

    });

    describe('#node', () => {

      it('should get the DOM node owned by the widget', () => {
        let widget = new Widget();
        let node = widget.node;
        expect(node.tagName).to.be('DIV');
      });

      it('should be read-only', () => {
        let widget = new Widget();
        expect(() => { widget.node = null; }).to.throwError();
      });

    });

    describe('#id', () => {

      it("should get the id of the widget's DOM node", () => {
        let widget = new Widget();
        widget.node.id = 'foo';
        expect(widget.id).to.be('foo');
      });

      it("should set the id of the widget's DOM node", () => {
        let widget = new Widget();
        widget.id = 'bar';
        expect(widget.node.id).to.be('bar');
      });

    });

    describe('#title', () => {

      it('should get the title data object for the widget', () => {
        let widget = new Widget();
        expect(widget.title).to.be.a(Title);
      });

      it('should be read-only', () => {
        let widget = new Widget();
        let title = new Title();
        expect(() => { widget.title = title; }).to.throwError();
      });

    });

    describe('#parent', () => {

      it('should default to `null`', () => {
        let widget = new Widget();
        expect(widget.parent).to.be(null);
      });

      it('should set the parent and send a `child-added` messagee', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(child.parent).to.be(parent);
        expect(parent.messages.indexOf('child-added')).to.not.be(-1);
      });

      it('should remove itself from the current parent', () => {
        let parent0 = new LogWidget();
        let parent1 = new LogWidget();
        let child = new Widget();
        child.parent = parent0;
        child.parent = parent1;
        expect(parent0.messages.indexOf('child-removed')).to.not.be(-1);
        expect(parent1.messages.indexOf('child-added')).to.not.be(-1);
      });

      it('should throw an error if the widget contains the parent', () => {
        let widget0 = new Widget();
        let widget1 = new Widget();
        widget0.parent = widget1;
        expect(() => { widget1.parent = widget0; }).to.throwError();
      });

      it('should be a no-op if there is no parent change', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.parent = parent;
        expect(parent.messages.indexOf('child-removed')).to.be(-1);
      });

    });

    describe('#layout', () => {

      it('should default to `null`', () => {
        let widget = new Widget();
        expect(widget.layout).to.be(null);
      });

      it('should set the layout for the widget', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        expect(widget.layout).to.be(layout);
      });

      it('should be single-use only', () => {
        let widget = new Widget();
        widget.layout = new LogLayout();
        expect(() => { widget.layout = new LogLayout(); }).to.throwError();
      });

      it('should be disposed when the widget is disposed', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.isDisposed).to.be(true);
      });

      it('should be a no-op if the layout is the same', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        widget.layout = layout;
        expect(widget.layout).to.be(layout);
      });

      it('should throw an error if the layout already has a parent', () => {
        let widget0 = new Widget();
        let widget1 = new Widget();
        let layout = new LogLayout();
        widget0.layout = layout;
        expect(() => { widget1.layout = layout; }).to.throwError();
      });

      it('should throw an error if the `DisallowLayout` flag is set', () => {
        let widget = new Widget();
        widget.setFlag(WidgetFlag.DisallowLayout);
        let layout = new LogLayout();
        expect(() => { widget.layout = layout; }).to.throwError();
      });

    });

    describe('#children()', () => {

      it("should return an iterator over the widget's children", () => {
        let widget = new Widget();
        widget.layout = new LogLayout();
        let child = widget.children().next();
        expect(child).to.be.a(LogWidget);
      });

      it('should return an empty iterator if there is no layout', () => {
        let widget = new Widget();
        expect(toArray(widget.children())).to.eql([]);
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
        expect(p1.contains(p1)).to.be(true);
        expect(p1.contains(p2)).to.be(true);
        expect(p1.contains(p3)).to.be(true);
        expect(p1.contains(w1)).to.be(true);
        expect(p1.contains(w2)).to.be(true);
        expect(p2.contains(p2)).to.be(true);
        expect(p2.contains(p3)).to.be(true);
        expect(p2.contains(w1)).to.be(true);
        expect(p2.contains(w2)).to.be(true);
        expect(p3.contains(p3)).to.be(true);
        expect(p3.contains(w2)).to.be(true);
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
        expect(p2.contains(p1)).to.be(false);
        expect(p3.contains(p1)).to.be(false);
        expect(p3.contains(p2)).to.be(false);
        expect(p3.contains(w1)).to.be(false);
        expect(w1.contains(p1)).to.be(false);
        expect(w1.contains(p2)).to.be(false);
        expect(w1.contains(p3)).to.be(false);
        expect(w1.contains(w2)).to.be(false);
        expect(w2.contains(p1)).to.be(false);
        expect(w2.contains(p2)).to.be(false);
        expect(w2.contains(p3)).to.be(false);
        expect(w2.contains(w1)).to.be(false);
      });

    });

    describe('#hasClass()', () => {

      it('should return `true` if a node has a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.node.classList.add('baz');
        expect(widget.hasClass('foo')).to.be(true);
        expect(widget.hasClass('bar')).to.be(true);
        expect(widget.hasClass('baz')).to.be(true);
      });

      it('should return `false` if a node does not have a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.node.classList.add('baz');
        expect(widget.hasClass('one')).to.be(false);
        expect(widget.hasClass('two')).to.be(false);
        expect(widget.hasClass('three')).to.be(false);
      });

    });

    describe('#addClass()', () => {

      it('should add a class to the DOM node', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.be(false);
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.be(true);
        expect(widget.node.classList.contains('bar')).to.be(false);
        widget.addClass('bar');
        expect(widget.node.classList.contains('bar')).to.be(true);
      });

      it('should be a no-op if the class is already present', () => {
        let widget = new Widget();
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.be(true);
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.be(true);
      });

    });

    describe('#removeClass()', () => {

      it('should remove the class from the DOM node', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.removeClass('foo');
        expect(widget.node.classList.contains('foo')).to.be(false);
        expect(widget.node.classList.contains('bar')).to.be(true);
        widget.removeClass('bar');
        expect(widget.node.classList.contains('bar')).to.be(false);
      });

      it('should be a no-op if the class is not present', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.be(false);
        widget.removeClass('foo');
        expect(widget.node.classList.contains('foo')).to.be(false);
      });

    });

    describe('#toggleClass()', () => {

      it('should toggle the presence of a class', () => {
        let widget = new Widget();
        widget.toggleClass('foo');
        expect(widget.node.classList.contains('foo')).to.be(true);
        widget.toggleClass('foo');
        expect(widget.node.classList.contains('foo')).to.be(false);
      });

      it('should force-add a class', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.be(false);
        widget.toggleClass('foo', true);
        expect(widget.node.classList.contains('foo')).to.be(true);
        widget.toggleClass('foo', true);
        expect(widget.node.classList.contains('foo')).to.be(true);
      });

      it('should force-remove a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        expect(widget.node.classList.contains('foo')).to.be(true);
        widget.toggleClass('foo', false);
        expect(widget.node.classList.contains('foo')).to.be(false);
        widget.toggleClass('foo', false);
        expect(widget.node.classList.contains('foo')).to.be(false);
      });

      it('should return `true` if the class is present', () => {
        let widget = new Widget();
        expect(widget.toggleClass('foo')).to.be(true);
        expect(widget.toggleClass('foo', true)).to.be(true);
      });

      it('should return `false` if the class is not present', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        expect(widget.toggleClass('foo')).to.be(false);
        expect(widget.toggleClass('foo', false)).to.be(false);
      });

    });

    describe('#update()', () => {

      it('should post an `update-request` message', (done) => {
        let widget = new LogWidget();
        widget.update();
        expect(widget.messages).to.eql([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.eql(['update-request']);
          done();
        });
      });

    });

    describe('#fit()', () => {

      it('should post a `fit-request` message to the widget', (done) => {
        let widget = new LogWidget();
        widget.fit();
        expect(widget.messages).to.eql([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.eql(['fit-request']);
          done();
        });
      });

    });

    describe('#focus()', () => {

      it('should send a `focus-request` message', () => {
        let widget = new LogWidget();
        expect(widget.messages).to.eql([]);
        widget.focus();
        expect(widget.messages).to.eql(['focus-request']);
      });

    });

    describe('#blur()', () => {

      it('should send a `blur-request` message', () => {
        let widget = new LogWidget();
        expect(widget.messages).to.eql([]);
        widget.blur();
        expect(widget.messages).to.eql(['blur-request']);
      });

    });

    describe('#close()', () => {

      it('should send a `close-request` message', () => {
        let widget = new LogWidget();
        expect(widget.messages).to.eql([]);
        widget.close();
        expect(widget.messages).to.eql(['close-request']);
      });

    });

    describe('#show()', () => {

      it('should set `isHidden` to `false`', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.isHidden).to.be(true);
        widget.show();
        expect(widget.isHidden).to.be(false);
      });

      it('should remove the "p-mod-hidden" class', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.hasClass('p-mod-hidden')).to.be(true);
        widget.show();
        expect(widget.hasClass('p-mod-hidden')).to.be(false);
      });

      it('should send an `after-show` message if applicable', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.show();
        expect(widget.messages.indexOf('after-show')).to.not.be(-1);
        widget.dispose();
      });

      it('should send a `child-shown` message to the parent', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.hide();
        child.show();
        expect(parent.messages.indexOf('child-shown')).to.not.be(-1);
      });

      it('should be a no-op if not hidden', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.show();
        expect(widget.messages.indexOf('after-show')).to.be(-1);
        widget.dispose();
      });

    });

    describe('#hide()', () => {

      it('should hide the widget', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.isHidden).to.be(true);
      });

      it('should add the `p-mod-hidden` class', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.hasClass('p-mod-hidden')).to.be(true);
      });

      it('should send a `before-hide` message if applicable', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages.indexOf('before-hide')).to.not.be(-1);
        widget.dispose();
      });

      it('should send a `child-hidden` message to the parent', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.hide();
        expect(parent.messages.indexOf('child-hidden')).to.not.be(-1);
      });

      it('should be a no-op if already hidden', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages.indexOf('before-hide')).to.be(-1);
        widget.dispose();
      });

    });

    describe('#setHidden()', () => {

      it('should call hide if `hidden = true`', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.setHidden(true);
        expect(widget.isHidden).to.be(true);
        expect(widget.messages.indexOf('before-hide')).to.not.be(-1);
        widget.dispose();
      });

      it('should call show if `hidden = false`', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.setHidden(false);
        expect(widget.isHidden).to.be(false);
        expect(widget.messages.indexOf('after-show')).to.not.be(-1);
        widget.dispose();
      });

    });

    describe('#testFlag()', () => {

      it('should test whether the given widget flag is set', () => {
        let widget = new Widget();
        expect(widget.testFlag(WidgetFlag.IsHidden)).to.be(false);
      });

    });

    describe('#setFlag()', () => {

      it('should set the given widget flag', () => {
        let widget = new Widget();
        widget.setFlag(WidgetFlag.IsHidden);
        expect(widget.testFlag(WidgetFlag.IsHidden)).to.be(true);
      });

    });

    describe('#clearFlag()', () => {

      it('should clear the given widget flag', () => {
        let widget = new Widget();
        widget.setFlag(WidgetFlag.IsHidden);
        widget.clearFlag(WidgetFlag.IsHidden);
        expect(widget.testFlag(WidgetFlag.IsHidden)).to.be(false);
      });

    });

    describe('#notifyLayout()', () => {

      it("should send a message to the widget's layout", () => {
        let child = new LogWidget();
        let parent = new LogWidget();
        let layout = new LogLayout();
        parent.layout = layout;
        child.parent = parent;
        expect(parent.methods.indexOf('notifyLayout')).to.not.be(-1);
        expect(layout.methods.indexOf('onLayoutChanged')).to.not.be(-1);
      });

    });

    describe('#onFocusRequest()', () => {

      it('should be invoked on a `focus-request', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.FocusRequest);
        expect(widget.methods.indexOf('onFocusRequest')).to.not.be(-1);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.FocusRequest);
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
      });

      it('should focus the widget node', () => {
        let widget = new Widget();
        widget.node.tabIndex = -1;
        Widget.attach(widget, document.body);
        sendMessage(widget, WidgetMessage.FocusRequest);
        expect(document.activeElement).to.be(widget.node);
        widget.dispose();
      });

    });

    describe('#onBlurRequest()', () => {

      it('should be invoked on a `blur-request', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.BlurRequest);
        expect(widget.methods.indexOf('onBlurRequest')).to.not.be(-1);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.BlurRequest);
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
      });

      it('should blur the widget node', () => {
        let widget = new Widget();
        widget.node.tabIndex = -1;
        Widget.attach(widget, document.body);
        widget.node.focus();
        expect(document.activeElement).to.be(widget.node);
        sendMessage(widget, WidgetMessage.BlurRequest);
        expect(document.activeElement).to.not.be(widget.node);
        widget.dispose();
      });

    });

    describe('#onCloseRequest()', () => {

      it('should be invoked on a `close-request`', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.CloseRequest);
        expect(widget.methods.indexOf('onCloseRequest')).to.not.be(-1);
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `close-request`', () => {
          let widget = new LogWidget();
          sendMessage(widget, WidgetMessage.CloseRequest);
          expect(widget.messages.indexOf('close-request')).to.not.be(-1);
        });

      });

      it('should unparent a child widget by default', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        sendMessage(child, WidgetMessage.CloseRequest);
        expect(child.parent).to.be(null);
      });

      it('should detach a root widget by default', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        sendMessage(widget, WidgetMessage.CloseRequest);
        expect(widget.isAttached).to.be(false);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.CloseRequest);
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
      });

    });

    describe('#onResize()', () => {

      it('should be invoked when the widget is resized', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        sendMessage(widget, ResizeMessage.UnknownSize);
        expect(widget.methods.indexOf('onResize')).to.not.be(-1);
        widget.dispose();
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `resize`', () => {
          let widget = new LogWidget();
          Widget.attach(widget, document.body);
          sendMessage(widget, ResizeMessage.UnknownSize);
          expect(widget.messages.indexOf('resize')).to.not.be(-1);
          widget.dispose();
        });

      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        sendMessage(widget, ResizeMessage.UnknownSize);
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
        widget.dispose();
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be invoked when an update is requested', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.UpdateRequest);
        expect(widget.methods.indexOf('onUpdateRequest')).to.not.be(-1);
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `update-request`', () => {
          let widget = new LogWidget();
          sendMessage(widget, WidgetMessage.UpdateRequest);
          expect(widget.messages.indexOf('update-request')).to.not.be(-1);
        });

      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        sendMessage(widget, WidgetMessage.UpdateRequest);
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
      });

    });

    describe('#onAfterShow()', () => {

      it('should be invoked just after the widget is made visible', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        widget.show();
        expect(widget.methods.indexOf('onAfterShow')).to.not.be(-1);
        widget.dispose();
      });

      it('should set the `isVisible` flag', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(false);
        widget.show();
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(true);
        widget.dispose();
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `after-show`', () => {
          let widget = new LogWidget();
          Widget.attach(widget, document.body);
          widget.hide();
          widget.messages = [];
          widget.show();
          expect(widget.messages.indexOf('after-show')).to.not.be(-1);
          widget.dispose();
        });

      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        widget.show();
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
        widget.dispose();
      });

    });

    describe('#onBeforeHide()', () => {

      it('should be invoked just before the widget is made not-visible', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.methods.indexOf('onBeforeHide')).to.not.be(-1);
        widget.dispose();
      });

      it('should clear the `isVisible` flag', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(true);
        widget.hide();
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(false);
        widget.dispose();
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `before-hide`', () => {
          let widget = new LogWidget();
          Widget.attach(widget, document.body);
          widget.messages = [];
          widget.hide();
          expect(widget.messages.indexOf('before-hide')).to.not.be(-1);
          widget.dispose();
        });

      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
        widget.dispose();
      });

    });

    describe('#onAfterAttach()', () => {

      it('should be invoked just after the widget is attached', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.methods.indexOf('onAfterAttach')).to.not.be(-1);
        widget.dispose();
      });

      it('should set the visible flag if warranted', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(true);
        Widget.detach(widget);

        widget.hide();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(false);
        Widget.detach(widget);

        let child = new LogWidget();
        child.parent = widget;
        widget.show();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(true);
        Widget.detach(widget);
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `after-attach`', () => {
          let widget = new LogWidget();
          Widget.attach(widget, document.body);
          expect(widget.messages.indexOf('after-attach')).to.not.be(-1);
          widget.dispose();
        });

      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
        widget.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should be invoked just before the widget is detached', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        Widget.detach(widget);
        expect(widget.methods.indexOf('onBeforeDetach')).to.not.be(-1);
      });

      it('should clear the `isVisible` and `isAttached` flags', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(true);
        expect(widget.testFlag(WidgetFlag.IsAttached)).to.be(true);
        Widget.detach(widget);
        expect(widget.testFlag(WidgetFlag.IsVisible)).to.be(false);
        expect(widget.testFlag(WidgetFlag.IsAttached)).to.be(false);
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `before-detach`', () => {
          let widget = new LogWidget();
          Widget.attach(widget, document.body);
          widget.messages = [];
          Widget.detach(widget);
          expect(widget.messages.indexOf('before-detach')).to.not.be(-1);
        });

      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        Widget.detach(widget);
        expect(widget.methods.indexOf('notifyLayout')).to.not.be(-1);
      });

    });

    describe('#onChildAdded()', () => {

      it('should be invoked when a child is added', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(parent.methods.indexOf('onChildAdded')).to.not.be(-1);
      });

      it('should notify the layout', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(parent.methods.indexOf('notifyLayout')).to.not.be(-1);
      });

      context('`msg` parameter', () => {

        it('should be a `ChildMessage`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect(parent.raw[0]).to.be.a(ChildMessage);
        });

        it('should have a `type` of `child-added`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect(parent.raw[0].type).to.be('child-added');
        });

        it('should have the correct `child`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect((parent.raw[0] as ChildMessage).child).to.be(child);
        });

      });

    });

    describe('#onChildRemoved()', () => {

      it('should be invoked when a child is removed', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        child.parent = null;
        expect(parent.methods.indexOf('onChildRemoved')).to.not.be(-1);
      });

      it('should notify the layout', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        parent.methods = [];
        child.parent = null;
        expect(parent.methods.indexOf('notifyLayout')).to.not.be(-1);
      });

      context('`msg` parameter', () => {

        it('should be a `ChildMessage`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect(parent.raw[0]).to.be.a(ChildMessage);
        });

        it('should have a `type` of `child-removed`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect((parent.raw[0] as ChildMessage).type).to.be('child-removed');
        });

        it('should have the correct `child`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect((parent.raw[0] as ChildMessage).child).to.be(child);
        });

      });

    });

    describe('.attach()', () => {

      it('should attach a root widget to a host', () => {
        let widget = new Widget();
        expect(widget.isAttached).to.be(false);
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.be(true);
        widget.dispose();
      });

      it('should throw if the widget is not a root', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        expect(() => { Widget.attach(child, document.body); }).to.throwError();
      });

      it('should throw if the widget is already attached', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(() => { Widget.attach(widget, document.body); }).to.throwError();
        widget.dispose();
      });

      it('should throw if the host is not attached to the DOM', () => {
        let widget = new Widget();
        let host = document.createElement('div');
        expect(() => { Widget.attach(widget, host); }).to.throwError();
      });

      it('should dispatch an `after-attach` message', () => {
        let widget = new LogWidget();
        expect(widget.isAttached).to.be(false);
        expect(widget.messages.indexOf('after-attach')).to.be(-1);
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.be(true);
        expect(widget.messages.indexOf('after-attach')).to.not.be(-1);
        widget.dispose();
      });

    });

    describe('.detach()', () => {

      it('should detach a root widget from its host', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.be(true);
        Widget.detach(widget);
        expect(widget.isAttached).to.be(false);
        widget.dispose();
      });

      it('should throw if the widget is not a root', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        Widget.attach(parent, document.body);
        expect(() => { Widget.detach(child); }).to.throwError();
        parent.dispose();
      });

      it('should throw if the widget is not attached', () => {
        let widget = new Widget();
        expect(() => { Widget.detach(widget); }).to.throwError();
      });

      it('should dispatch a `before-detach` message', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.messages = [];
        Widget.detach(widget);
        expect(widget.messages[0]).to.be('before-detach');
        widget.dispose();
      });

    });

    describe('.prepareGeometry()', () => {

      it('should set the inline style position of the widget to `absolute`', () => {
        let widget = new Widget();
        widget.node.style.position = 'relative';
        Widget.prepareGeometry(widget);
        expect(widget.node.style.position).to.be('absolute');
      });

    });

    describe('.resetGeometry()', () => {

      it('should clear the inline style position and geometry of the widget', () => {
        let widget = new Widget();
        Widget.setGeometry(widget, 10, 10, 10, 10);
        Widget.resetGeometry(widget);
        let style = widget.node.style;
        expect(style.position).to.be('');
        expect(style.top).to.be('');
        expect(style.left).to.be('');
        expect(style.width).to.be('');
        expect(style.height).to.be('');
      });

    });

    describe('.setGeometry()', () => {

      it('should set the absolute layout geometry of the widget', () => {
        let widget = new Widget();
        Widget.setGeometry(widget, 10, 10, 10, 10);
        let style = widget.node.style;
        expect(style.top).to.be('10px');
        expect(style.left).to.be('10px');
        expect(style.width).to.be('10px');
        expect(style.height).to.be('10px');
      });

      it('should send a `ResizeMessage` if the size has changed', () => {
        let widget = new LogWidget();
        Widget.setGeometry(widget, 10, 10, 10, 10);
        expect(widget.messages.indexOf('resize')).to.not.be(-1);
      });

    });

  });

  describe('ChildMessage', () => {

    describe('#constructor()', () => {

      it('should accept the message type and child widget', () => {
        let msg = new ChildMessage('test', new Widget());
        expect(msg).to.be.a(ChildMessage);
      });

    });

    describe('#child', () => {

      it('should be the child passed to the constructor', () => {
        let widget = new Widget();
        let msg = new ChildMessage('test', widget);
        expect(msg.child).to.be(widget);
      });

      it('should be a read-only property', () => {
        let widget0 = new Widget();
        let widget1 = new Widget();
        let msg = new ChildMessage('test', widget0);
        expect(() => { msg.child = widget1; }).to.throwError();
      });

    });

  });

  describe('ResizeMessage', () => {

    describe('.UnknownSize', () => {

      it('should be a `ResizeMessage`', () => {
        let msg = ResizeMessage.UnknownSize;
        expect(msg).to.be.a(ResizeMessage);
      });

      it('should have a `width` of `-1`', () => {
        let msg = ResizeMessage.UnknownSize;
        expect(msg.width).to.be(-1);
      });

      it('should have a `height` of `-1`', () => {
        let msg = ResizeMessage.UnknownSize;
        expect(msg.height).to.be(-1);
      });

    });

    describe('#constructor()', () => {

      it('should accept a width and height', () => {
        let msg = new ResizeMessage(100, 100);
        expect(msg).to.be.a(ResizeMessage);
      });

    });

    describe('#width', () => {

      it('should be the width passed to the constructor', () => {
        let msg = new ResizeMessage(100, 200);
        expect(msg.width).to.be(100);
      });

      it('should be a read-only property', () => {
        let msg = new ResizeMessage(100, 200);
        expect(() => { msg.width = 200; }).to.throwError();
      });

    });

    describe('#height', () => {

      it('should be the height passed to the constructor', () => {
        let msg = new ResizeMessage(100, 200);
        expect(msg.height).to.be(200);
      });

      it('should be a read-only property', () => {
        let msg = new ResizeMessage(100, 200);
        expect(() => { msg.height = 200; }).to.throwError();
      });

    });

  });

  describe('Layout', () => {

    describe('#iter()', () => {

      it('should create an iterator over the widgets in the layout', () => {
        let layout = new LogLayout();
        expect(every(layout, child => child instanceof LogWidget)).to.be(true);
      });

    });

    describe('#onLayoutChanged()', () => {

      it('should be invoked when the layout is installed on its parent widget', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        expect(layout.methods.indexOf('onLayoutChanged')).to.not.be(-1);
      });

    });

    describe('#onChildRemoved()', () => {

      it("should be invoked when a child widget's `parent` property is set to `null`", () => {
        let parent = new Widget();
        let widget = new Widget();
        let layout = new LogLayout();
        parent.layout = layout;
        widget.parent = parent;
        widget.parent = null;
        expect(layout.methods.indexOf('onChildRemoved')).to.not.be(-1);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resource held by the layout', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        let children = toArray(layout);
        layout.dispose();
        expect(layout.parent).to.be(null);
        expect(every(children, w => w.isDisposed)).to.be(true);
      });

      it('should be called automatically when the parent is disposed', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.parent).to.be(null);
        expect(layout.isDisposed).to.be(true);
      });

    });

    describe('#isDisposed', () => {

      it('should test whether the layout is disposed', () => {
        let layout = new LogLayout();
        expect(layout.isDisposed).to.be(false);
        layout.dispose();
        expect(layout.isDisposed).to.be(true);
      });

      it('should be read-only', () => {
        let layout = new LogLayout();
        expect(() => { layout.isDisposed = false; }).to.throwError();
      });

    });

    describe('#parent', () => {

      it('should get the parent widget of the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(layout.parent).to.be(parent);
      });

      it('should throw an error if set to `null`', () => {
        let layout = new LogLayout();
        expect(() => { layout.parent = null; }).to.throwError();
      });

      it ('should throw an error if set to a different value', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(() => { layout.parent = new Widget(); }).to.throwError();
      });

      it('should be a no-op if the parent is set to the same value', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        layout.parent = parent;
        expect(layout.parent).to.be(parent);
      });

    });

    describe('#onResize()', () => {

      it('should be invoked on a `resize` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, ResizeMessage.UnknownSize);
        expect(layout.methods.indexOf('onResize')).to.not.be(-1);
      });

      it('should send a `resize` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, ResizeMessage.UnknownSize);
        expect(layout.methods.indexOf('onResize')).to.not.be(-1);
        expect(every(layout, child => {
          return child.methods.indexOf('onResize') !== -1;
        })).to.be(true);
      });

    });

    describe('#onUpdateRequest()', () => {

      it('should be invoked on an `update-request` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.UpdateRequest);
        expect(layout.methods.indexOf('onUpdateRequest')).to.not.be(-1);
      });

      it('should send a `resize` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.UpdateRequest);
        expect(layout.methods.indexOf('onUpdateRequest')).to.not.be(-1);
        expect(every(layout, child => {
          return child.methods.indexOf('onResize') !== -1;
        })).to.be(true);
      });

    });

    describe('#onAfterAttach()', () => {

      it('should be invoked on an `after-attach` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.AfterAttach);
        expect(layout.methods.indexOf('onAfterAttach')).to.not.be(-1);
      });

      it('should send an `after-attach` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.AfterAttach);
        expect(layout.methods.indexOf('onAfterAttach')).to.not.be(-1);
        expect(every(layout, child => {
          return child.methods.indexOf('onAfterAttach') !== -1;
        })).to.be(true);
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should be invoked on an `before-detach` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.BeforeDetach);
        expect(layout.methods.indexOf('onBeforeDetach')).to.not.be(-1);
      });

      it('should send a `before-detach` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.BeforeDetach);
        expect(layout.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        expect(every(layout, child => {
          return child.methods.indexOf('onBeforeDetach') !== -1;
        })).to.be(true);
      });

    });

    describe('#onAfterShow()', () => {

      it('should be invoked on an `after-show` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.AfterShow);
        expect(layout.methods.indexOf('onAfterShow')).to.not.be(-1);
      });

      it('should send an `after-show` message to non hidden of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let iter = layout.iter();
        let child = iter.next();
        child.hide();
        sendMessage(parent, WidgetMessage.AfterShow);
        expect(layout.methods.indexOf('onAfterShow')).to.not.be(-1);
        expect(child.methods.indexOf('onAfterShow')).to.be(-1);
        child = iter.next();
        expect(child.methods.indexOf('onAfterShow')).to.not.be(-1);
      });

    });

    describe('#onBeforeHide()', () => {

      it('should be invoked on a `before-hide` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.BeforeHide);
        expect(layout.methods.indexOf('onBeforeHide')).to.not.be(-1);
      });

      it('should send a `before-hide` message to non hidden of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let iter = layout.iter();
        let child = iter.next();
        child.hide();
        sendMessage(parent, WidgetMessage.BeforeHide);
        expect(layout.methods.indexOf('onBeforeHide')).to.not.be(-1);
        expect(child.methods.indexOf('onBeforeHide')).to.be(-1);
        child = iter.next();
        expect(child.methods.indexOf('onBeforeHide')).to.not.be(-1);
      });

    });

    describe('#onFitRequest()', () => {

      it('should be invoked on an `fit-request` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
      });

    });

    describe('#onChildShown()', () => {

      it('should be invoked on an `child-shown` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let msg = new ChildMessage('child-shown', new Widget());
        sendMessage(parent, msg);
        expect(layout.methods.indexOf('onChildShown')).to.not.be(-1);
      });

    });

    describe('#onChildHidden()', () => {

      it('should be invoked on an `child-hidden` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let msg = new ChildMessage('child-hidden', new Widget());
        sendMessage(parent, msg);
        expect(layout.methods.indexOf('onChildHidden')).to.not.be(-1);
      });

    });

  });

});
