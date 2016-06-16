/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  generate, simulate
} from 'simulate-event';

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
  SplitLayout, SplitPanel
} from '../../../lib/ui/splitpanel';

import {
  ChildMessage, ResizeMessage, Widget, WidgetMessage
} from '../../../lib/ui/widget';


const customRenderer: SplitPanel.IHandleRenderer = {
  createHandleNode: () => {
    let node = document.createElement('div');
    node.className = 'p-SplitPanel-handle customRenderer';
    return node;
  }
};


class LogSplitLayout extends SplitLayout {

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


class LogSplitPanel extends SplitPanel {

  events: string[] = [];

  methods: string[] = [];

  constructor() {
    super({ layout: new LogSplitLayout({ renderer: customRenderer }) });
  }

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
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


describe('ui/splitpanel', () => {

  describe('SplitPanel', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let panel = new SplitPanel();
        expect(panel).to.be.a(SplitPanel);
      });

      it('should accept options', () => {
        let panel = new SplitPanel({
          orientation: 'vertical', spacing: 5, renderer: customRenderer
        });
        expect(panel.orientation).to.be('vertical');
        expect(panel.spacing).to.be(5);
        expect(panel.renderer).to.be(customRenderer);
      });

      it('should accept a layout option', () => {
        let layout = new SplitLayout({ renderer: SplitPanel.defaultRenderer });
        let panel = new SplitPanel({ layout });
        expect(panel.layout).to.be(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let layout = new SplitLayout({ renderer: SplitPanel.defaultRenderer });
        let panel = new SplitPanel({
          layout, orientation: 'vertical', spacing: 5, renderer: customRenderer
        });
        expect(panel.layout).to.be(layout);
        expect(panel.orientation).to.be('horizontal');
        expect(panel.spacing).to.be(4);
        expect(panel.renderer).to.be(SplitPanel.defaultRenderer);
      });

      it('should add the `p-SplitPanel` class', () => {
        let panel = new SplitPanel();
        expect(panel.hasClass('p-SplitPanel')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the panel', () => {
        let panel = new LogSplitPanel();
        let layout = panel.layout as SplitLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        Widget.attach(panel, document.body);
        simulate(layout.handles.at(0), 'mousedown');
        expect(panel.events.indexOf('mousedown')).to.not.be(-1);
        simulate(panel.node, 'keydown');
        expect(panel.events.indexOf('keydown')).to.not.be(-1);
        let node = panel.node;
        panel.dispose();
        expect(every(widgets, w => w.isDisposed));
        simulate(node, 'contextmenu');
        expect(panel.events.indexOf('contextmenu')).to.be(-1);
      });

    });

    describe('#orientation', () => {

      it('should get the layout orientation for the split panel', () => {
        let panel = new SplitPanel();
        expect(panel.orientation).to.be('horizontal');
      });

      it('should set the layout orientation for the split panel', () => {
        let panel = new SplitPanel();
        panel.orientation = 'vertical';
        expect(panel.orientation).to.be('vertical');
      });

    });

    describe('#spacing', () => {

      it('should default to `4`', () => {
        let panel = new SplitPanel();
        expect(panel.spacing).to.be(4);
      });

      it('should set the spacing for the panel', () => {
        let panel = new SplitPanel();
        panel.spacing = 10;
        expect(panel.spacing).to.be(10);
      });

    });

    describe('#renderer', () => {

      it('should get the handle renderer for the panel', () => {
        let panel = new SplitPanel({ renderer: customRenderer });
        expect(panel.renderer).to.be(customRenderer);
      });

      it('should be read-only', () => {
        let panel = new SplitPanel();
        expect(() => { panel.renderer = null; }).to.throwError();
      });

    });

    describe('#handles', () => {

      it('should get the read-only sequence of the split handles in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        let handles = panel.handles;
        expect(handles.length).to.be(3);
      });

      it('should be read-only', () => {
        let panel = new SplitPanel();
        expect(() => { panel.handles = null; }).to.throwError();
      });

    });

    describe('#sizes()', () => {

      it('should get the current sizes of the widgets in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        let sizes = panel.sizes();
        expect(sizes).to.eql([0, 0, 0]);
      });

    });

    describe('#setSizes()', () => {

      it('should set the desired sizes for the widgets in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.setSizes([10, 10, 10]);
        let sizes = panel.sizes();
        expect(sizes).to.eql([10, 10, 10]);
      });

      it('should ignore extra values', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.setSizes([10, 10, 10, 20]);
        let sizes = panel.sizes();
        expect(sizes).to.eql([10, 10, 10]);
      });

    });

    describe('#handleEvent()', () => {

      let panel: LogSplitPanel;
      let layout: LogSplitLayout;

      beforeEach(() => {
        panel = new LogSplitPanel();
        layout = panel.layout as LogSplitLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.setSizes([10, 10, 10, 20]);
        Widget.attach(panel, document.body);
        sendMessage(panel, WidgetMessage.UpdateRequest);
      });

      afterEach(() => {
        panel.dispose();
      });

      context('mousedown', () => {

        it('should attach other event listeners', () => {
          simulate(layout.handles.at(0), 'mousedown');
          expect(panel.events.indexOf('mousedown')).to.not.be(-1);
          simulate(document.body, 'mousemove');
          expect(panel.events.indexOf('mousemove')).to.not.be(-1);
          simulate(document.body, 'keydown');
          expect(panel.events.indexOf('keydown')).to.not.be(-1);
          simulate(document.body, 'keyup');
          expect(panel.events.indexOf('keyup')).to.not.be(-1);
          simulate(document.body, 'keypress');
          expect(panel.events.indexOf('keypress')).to.not.be(-1);
          simulate(document.body, 'contextmenu');
          expect(panel.events.indexOf('contextmenu')).to.not.be(-1);
          // Mouseup releases the mouse, so must be last.
          simulate(document.body, 'mouseup');
          expect(panel.events.indexOf('mouseup')).to.not.be(-1);
        });

        it('should be a no-op if it is not the left button', () => {
          simulate(layout.handles.at(0), 'mousedown', { button: 1 });
          expect(panel.events.indexOf('mousedown')).to.not.be(-1);
          simulate(document.body, 'mousemove');
          expect(panel.events.indexOf('mousemove')).to.be(-1);
        });

      });

      context('mousemove', () => {

        it('should move the handle right', (done) => {
          let handle = layout.handles.at(1);
          let rect = handle.getBoundingClientRect();
          simulate(handle, 'mousedown');
          simulate(document.body, 'mousemove', { clientX: rect.left + 10, clientY: rect.top });
          requestAnimationFrame(() => {
            let newRect = handle.getBoundingClientRect();
            expect(newRect.left).to.not.be(rect.left);
            done();
          });
        });

        it('should move the handle down', (done) => {
          panel.orientation = 'vertical';
          each(panel.widgets, w => { w.node.style.minHeight = '20px'; });
          sendMessage(panel, WidgetMessage.UpdateRequest);
          let handle = layout.handles.at(1);
          let rect = handle.getBoundingClientRect();
          simulate(handle, 'mousedown');
          simulate(document.body, 'mousemove', { clientX: rect.left, clientY: rect.top - 2 });
          requestAnimationFrame(() => {
            let newRect = handle.getBoundingClientRect();
            expect(newRect.top).to.not.be(rect.top);
            done();
          });
        });

      });

      context('mouseup', () => {

        it('should remove the event listeners', () => {
          simulate(layout.handles.at(0), 'mousedown');
          expect(panel.events.indexOf('mousedown')).to.not.be(-1);
          simulate(document.body, 'mouseup');
          expect(panel.events.indexOf('mouseup')).to.not.be(-1);
          simulate(document.body, 'mousemove');
          expect(panel.events.indexOf('mousemove')).to.be(-1);
          simulate(document.body, 'keydown');
          expect(panel.events.indexOf('keydown')).to.be(-1);
          simulate(document.body, 'keyup');
          expect(panel.events.indexOf('keyup')).to.be(-1);
          simulate(document.body, 'keypress');
          expect(panel.events.indexOf('keypress')).to.be(-1);
          simulate(document.body, 'contextmenu');
          expect(panel.events.indexOf('contextmenu')).to.be(-1);
        });

        it('should be a no-op if not the left button', () => {
          simulate(layout.handles.at(0), 'mousedown');
          expect(panel.events.indexOf('mousedown')).to.not.be(-1);
          simulate(document.body, 'mouseup', { button: 1 });
          expect(panel.events.indexOf('mouseup')).to.not.be(-1);
          simulate(document.body, 'mousemove');
          expect(panel.events.indexOf('mousemove')).to.not.be(-1);
        });

      });

      context('keydown', () => {

        it('should release the mouse if `Escape` is pressed', () => {
          simulate(layout.handles.at(0), 'mousedown');
          simulate(panel.node, 'keydown', { keyCode: 27 });
          expect(panel.events.indexOf('keydown')).to.not.be(-1);
          simulate(panel.node, 'mousemove');
          expect(panel.events.indexOf('mousemove')).to.be(-1);
        });

      });

      context('keyup', () => {

        it('should prevent events during drag', () => {
          simulate(layout.handles.at(0), 'mousedown');
          let evt = generate('keyup');
          document.body.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(true);
          expect(panel.events.indexOf('keyup')).to.not.be(-1);
        });

      });

      context('keypress', () => {

        it('should prevent events during drag', () => {
          simulate(layout.handles.at(0), 'mousedown');
          let evt = generate('keypress');
          document.body.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(true);
          expect(panel.events.indexOf('keypress')).to.not.be(-1);
        });

      });

      context('contextmenu', () => {

        it('should prevent events during drag', () => {
          simulate(layout.handles.at(0), 'mousedown');
          let evt = generate('contextmenu');
          document.body.dispatchEvent(evt);
          expect(evt.defaultPrevented).to.be(true);
          expect(panel.events.indexOf('contextmenu')).to.not.be(-1);
        });

      });

    });

    describe('#onAfterAttach()', () => {

      it('should attach a mousedown listener to the node', () => {
        let panel = new LogSplitPanel();
        Widget.attach(panel, document.body);
        expect(panel.methods.indexOf('onAfterAttach')).to.not.be(-1);
        simulate(panel.node, 'mousedown');
        expect(panel.events.indexOf('mousedown')).to.not.be(-1);
        panel.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should remove all listeners', () => {
        let panel = new LogSplitPanel();
        Widget.attach(panel, document.body);
        simulate(panel.node, 'mousedown');
        expect(panel.events.indexOf('mousedown')).to.not.be(-1);
        Widget.detach(panel);
        expect(panel.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        panel.events = [];
        simulate(panel.node, 'mousedown');
        expect(panel.events.indexOf('mousedown')).to.be(-1);
        simulate(document.body, 'keyup');
        expect(panel.events.indexOf('keyup')).to.be(-1);
      });

    });

    describe('#onChildAdded()', () => {

      it('should add a class to the child widget', () => {
        let panel = new LogSplitPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.methods.indexOf('onChildAdded')).to.not.be(-1);
        expect(widget.hasClass('p-SplitPanel-child')).to.be(true);
      });

      it('should release the mouse', () => {
        let panel = new LogSplitPanel();
        panel.addWidget(new Widget());
        Widget.attach(panel, document.body);
        simulate(panel.node, 'mousedown');
        panel.addWidget(new Widget());
        expect(panel.methods.indexOf('onChildAdded')).to.not.be(-1);
        simulate(document.body, 'contextmenu');
        expect(panel.events.indexOf('contextmenu')).to.be(-1);
      });

    });

    describe('#onChildRemoved()', () => {

      it('should remove a class to the child widget', () => {
        let panel = new LogSplitPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(panel.methods.indexOf('onChildRemoved')).to.not.be(-1);
        expect(widget.hasClass('p-SplitPanel-child')).to.be(false);
      });

      it('should release the mouse', () => {
        let panel = new LogSplitPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        Widget.attach(panel, document.body);
        simulate(panel.node, 'mousedown');
        widget.parent = null;
        expect(panel.methods.indexOf('onChildRemoved')).to.not.be(-1);
        simulate(document.body, 'contextmenu');
        expect(panel.events.indexOf('contextmenu')).to.be(-1);
      });

    });

    describe('.defaultRenderer()', () => {

      describe('#createHandleNode()', () => {

        it('should create a new handle node', () => {
          let node1 = SplitPanel.defaultRenderer.createHandleNode();
          let node2 = SplitPanel.defaultRenderer.createHandleNode();
          expect(node1).to.be.a(HTMLElement);
          expect(node2).to.be.a(HTMLElement);
          expect(node1).to.not.be(node2);
        });

        it('should add the "p-SplitPanel-handle" class', () => {
          let node =SplitPanel.defaultRenderer.createHandleNode();
          expect(node.classList.contains('p-SplitPanel-handle')).to.be(true);
        });

      });

    });

    describe('.getStretch()', () => {

      it('should get the split panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(SplitPanel.getStretch(widget)).to.be(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the split panel stretch factor for the given widget', () => {
        let widget = new Widget();
        SplitPanel.setStretch(widget, 10);
        expect(SplitPanel.getStretch(widget)).to.be(10);
      });

    });

  });

  describe('SplitLayout', () => {

    describe('#constructor()', () => {

      it('should accept a handle renderer', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        expect(layout).to.be.a(SplitLayout);
      });

    });

    describe('#orientation', () => {

      it('should get the layout orientation for the split layout', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        expect(layout.orientation).to.be('horizontal');
      });

      it('should set the layout orientation for the split layout', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        layout.orientation = 'vertical';
        expect(layout.orientation).to.be('vertical');
      });

      it('should set the orientation class of the parent widget', () => {
        let parent = new Widget();
        let layout = new SplitLayout({ renderer: customRenderer });
        parent.layout = layout;
        layout.orientation = 'vertical';
        expect(parent.hasClass('p-mod-vertical')).to.be(true);
        layout.orientation = 'horizontal';
        expect(parent.hasClass('p-mod-horizontal')).to.be(true);
      });

      it('should post a fit request to the parent widget', (done) => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.orientation = 'vertical';
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.orientation = 'horizontal';
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.be(-1);
          done();
        });
      });

    });

    describe('#spacing', () => {

      it('should get the inter-element spacing for the split layout', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        expect(layout.spacing).to.be(4);
      });

      it('should set the inter-element spacing for the split layout', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        layout.spacing = 10;
        expect(layout.spacing).to.be(10);
      });

      it('should post a fit rquest to the parent widget', (done) => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.spacing = 10;
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

      it('should be a no-op if the value does not change', (done) => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.spacing = 4;
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.be(-1);
          done();
        });
      });

    });

    describe('#renderer', () => {

      it('should get the handle renderer for the layout', () => {
        let layout = new SplitPanel({ renderer: customRenderer });
        expect(layout.renderer).to.be(customRenderer);
      });

      it('should be read-only', () => {
        let layout = new SplitPanel({ renderer: customRenderer });
        expect(() => { layout.renderer = null; }).to.throwError();
      });

    });

    describe('#handles', () => {

      it('should be a read-only sequence of the split handles in the layout', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { layout.addWidget(w); });
        expect(every(layout.handles, h => h instanceof HTMLElement));
      });

      it('should be read-only', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        expect(() => { layout.handles = null; }).to.throwError();
      });

    });

    describe('#sizes()', () => {

      it('should get the current sizes of the widgets in the layout', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        let sizes = layout.sizes();
        expect(sizes).to.eql([0, 0, 0]);
        parent.dispose();
      });

    });

    describe('#setSizes()', () => {

      it('should set the desired sizes for the widgets in the panel', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        layout.setSizes([10, 10, 10]);
        let sizes = layout.sizes();
        expect(sizes).to.eql([10, 10, 10]);
        parent.dispose();
      });

      it('should ignore extra values', () => {
        let layout = new SplitLayout({ renderer: customRenderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        Widget.attach(parent, document.body);
        layout.setSizes([10, 10, 10, 20]);
        let sizes = layout.sizes();
        expect(sizes).to.eql([10, 10, 10]);
        parent.dispose();
      });

    });

    describe('#setHandlePosition()', () => {

      let layout: LogSplitLayout;
      let parent: LogWidget;

      beforeEach((done) => {
        layout = new LogSplitLayout({ renderer: customRenderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        parent = new LogWidget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        each(widgets, w => { w.node.style.minHeight = '100px'; });
        each(widgets, w => { w.node.style.minWidth = '100px'; });
        Widget.attach(parent, document.body);
        requestAnimationFrame(() => done());
      });

      afterEach(() => {
        parent.dispose();
      });

      it('should set the offset position of a split handle', (done) => {
        let handle = layout.handles.at(1);
        let left = handle.offsetLeft;
        layout.setHandlePosition(1, left + 20);
        requestAnimationFrame(() => {
          expect(handle.offsetLeft).to.not.equal(left);
          done();
        });
      });

      it('should post an update request to the parent', (done) => {
        layout.setHandlePosition(1, 200);
        parent.methods = [];
        requestAnimationFrame(() => {
          expect(parent.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          done();
        });
      });

      it('should bail if there is no movement', (done) => {
        let handle = layout.handles.at(1);
        layout.setHandlePosition(1, handle.offsetLeft);
        parent.methods = [];
        requestAnimationFrame(() => {
          expect(parent.methods.indexOf('onUpdateRequest')).to.be(-1);
          done();
        });
      });

      it('should bail if the index is non-integral', (done) => {
        layout.setHandlePosition(1.5, 10);
        parent.methods = [];
        requestAnimationFrame(() => {
          expect(parent.methods.indexOf('onUpdateRequest')).to.be(-1);
          done();
        });
      });

      it('should bail if the index is out of range', (done) => {
        layout.setHandlePosition(-1, 10);
        parent.methods = [];
        requestAnimationFrame(() => {
          expect(parent.methods.indexOf('onUpdateRequest')).to.be(-1);
          done();
        });
      });

    });

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(parent.node.contains(widget.node)).to.be(true);
        expect(layout.handles.length).to.be(1);
      });

      it("should send an `'after-attach'` message if the parent is attached", () => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let parent = new Widget();
        parent.layout = layout;
        let widget = new LogWidget();
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        expect(widget.methods.indexOf('onAfterAttach')).to.not.be(-1);
      });

      it('should post a layout request for the parent widget', (done) => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        each(widgets, w => { layout.addWidget(w); });
        let widget = widgets[0];
        let handle = layout.handles.at(0);
        layout.insertWidget(2, widget);
        expect(layout.methods.indexOf('moveWidget')).to.not.be(-1);
        expect(layout.handles.at(2)).to.be(handle);
        expect(layout.widgets.at(2)).to.be(widget);
      });

      it('should post a a layout request to the parent', (done) => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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

    });

    describe('#onLayoutChanged()', () => {

      it('should set the orientation class of the parent widget', () => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer: customRenderer });
        parent.layout = layout;
        expect(layout.methods.indexOf('onLayoutChanged')).to.not.be(-1);
        expect(parent.hasClass('p-mod-horizontal')).to.be(true);
      });

      it('should attach all widgets to the DOM', () => {
        let parent = new Widget();
        Widget.attach(parent, document.body);
        let layout = new LogSplitLayout({ renderer: customRenderer });
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        each(widgets, w => { layout.addWidget(w); });
        parent.layout = layout;
        expect(layout.methods.indexOf('onLayoutChanged')).to.not.be(-1);
        expect(every(widgets, w => w.parent === parent)).to.be(true);
        let predicate = (w: LogWidget) => {
          return w.methods.indexOf('onAfterAttach') !== -1;
        };
        expect(every(widgets, predicate)).to.be(true);
        parent.dispose();
      });

    });

    describe('#onAfterShow()', () => {

      it('should post an update to the parent', (done) => {
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
        let layout = new LogSplitLayout({ renderer: customRenderer });
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
      let layout: LogSplitLayout;

      beforeEach(() => {
        parent = new LogWidget();
        layout = new LogSplitLayout({ renderer: customRenderer });
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

      it('should handle `vertical`', () => {
        layout.orientation = 'vertical';
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
      let layout: LogSplitLayout;

      beforeEach(() => {
        parent = new LogWidget();
        layout = new LogSplitLayout({ renderer: customRenderer });
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

      it('should fit `vertical`', () => {
        layout.orientation = 'vertical';
        sendMessage(parent, WidgetMessage.FitRequest);
        expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
      });

      it('should send a fit request to an ancestor widget', () => {
        Widget.detach(parent);
        let ancestor = new LogWidget();
        let ancestorLayout = new LogSplitLayout({ renderer: customRenderer });
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

      it('should get the split layout stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(SplitLayout.getStretch(widget)).to.be(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the split layout stretch factor for the given widget', () => {
        let widget = new Widget();
        SplitLayout.setStretch(widget, 10);
        expect(SplitLayout.getStretch(widget)).to.be(10);
      });

      it('should post a fit request to the parent', (done) => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer: customRenderer });
        parent.layout = layout;
        let widget = new Widget();
        widget.parent = parent;
        SplitLayout.setStretch(widget, 10);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

    });

  });

});
