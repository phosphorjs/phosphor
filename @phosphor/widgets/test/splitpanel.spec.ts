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
  generate, simulate
} from 'simulate-event';

import {
  each, every
} from '@phosphor/algorithm';

import {
  MessageLoop
} from '@phosphor/messaging';

import {
  SplitPanel, SplitLayout, Widget
} from '@phosphor/widgets';


const renderer: SplitPanel.IRenderer = {
  createHandle: () => document.createElement('div')
};


class LogSplitPanel extends SplitPanel {

  events: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }
}


describe('@phosphor/widgets', () => {

  describe('SplitPanel', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let panel = new SplitPanel();
        expect(panel).to.be.an.instanceof(SplitPanel);
      });

      it('should accept options', () => {
        let panel = new SplitPanel({
          orientation: 'vertical', spacing: 5, renderer
        });
        expect(panel.orientation).to.equal('vertical');
        expect(panel.spacing).to.equal(5);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should accept a layout option', () => {
        let layout = new SplitLayout({ renderer });
        let panel = new SplitPanel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let ignored = Object.create(renderer);
        let layout = new SplitLayout({ renderer });
        let panel = new SplitPanel({
          layout, orientation: 'vertical', spacing: 5, renderer: ignored
        });
        expect(panel.layout).to.equal(layout);
        expect(panel.orientation).to.equal('horizontal');
        expect(panel.spacing).to.equal(4);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should add the `p-SplitPanel` class', () => {
        let panel = new SplitPanel();
        expect(panel.hasClass('p-SplitPanel')).to.equal(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the panel', () => {
        let panel = new LogSplitPanel();
        let layout = panel.layout as SplitLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        Widget.attach(panel, document.body);
        simulate(layout.handles[0], 'mousedown');
        expect(panel.events).to.contain('mousedown');
        simulate(panel.node, 'keydown');
        expect(panel.events).to.contain('keydown');
        let node = panel.node;
        panel.dispose();
        expect(every(widgets, w => w.isDisposed));
        simulate(node, 'contextmenu');
        expect(panel.events).to.not.contain('contextmenu');
      });

    });

    describe('#orientation', () => {

      it('should get the layout orientation for the split panel', () => {
        let panel = new SplitPanel();
        expect(panel.orientation).to.equal('horizontal');
      });

      it('should set the layout orientation for the split panel', () => {
        let panel = new SplitPanel();
        panel.orientation = 'vertical';
        expect(panel.orientation).to.equal('vertical');
      });

    });

    describe('#spacing', () => {

      it('should default to `4`', () => {
        let panel = new SplitPanel();
        expect(panel.spacing).to.equal(4);
      });

      it('should set the spacing for the panel', () => {
        let panel = new SplitPanel();
        panel.spacing = 10;
        expect(panel.spacing).to.equal(10);
      });

    });

    describe('#renderer', () => {

      it('should get the renderer for the panel', () => {
        let panel = new SplitPanel({ renderer });
        expect(panel.renderer).to.equal(renderer);
      });

    });

    describe('#handles', () => {

      it('should get the read-only sequence of the split handles in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        expect(panel.handles.length).to.equal(3);
      });

    });

    describe('#relativeSizes()', () => {

      it('should get the current sizes of the widgets in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        let sizes = panel.relativeSizes();
        expect(sizes).to.deep.equal([1/3, 1/3, 1/3]);
      });

    });

    describe('#setRelativeSizes()', () => {

      it('should set the desired sizes for the widgets in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.setRelativeSizes([10, 20, 30]);
        let sizes = panel.relativeSizes();
        expect(sizes).to.deep.equal([10/60, 20/60, 30/60]);
      });

      it('should ignore extra values', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.setRelativeSizes([10, 30, 40, 20]);
        let sizes = panel.relativeSizes();
        expect(sizes).to.deep.equal([10/80, 30/80, 40/80]);
      });

    });

    describe('#handleEvent()', () => {

      let panel: LogSplitPanel;
      let layout: SplitLayout;

      beforeEach(() => {
        panel = new LogSplitPanel();
        layout = panel.layout as SplitLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        each(widgets, w => { panel.addWidget(w); });
        panel.setRelativeSizes([10, 10, 10, 20]);
        Widget.attach(panel, document.body);
        MessageLoop.flush();
      });

      afterEach(() => {
        panel.dispose();
      });

      context('mousedown', () => {

        it('should attach other event listeners', () => {
          simulate(layout.handles[0], 'mousedown');
          expect(panel.events).to.contain('mousedown');
          simulate(document.body, 'mousemove');
          expect(panel.events).to.contain('mousemove');
          simulate(document.body, 'keydown');
          expect(panel.events).to.contain('keydown');
          simulate(document.body, 'contextmenu');
          expect(panel.events).to.contain('contextmenu');
          simulate(document.body, 'mouseup');
          expect(panel.events).to.contain('mouseup');
        });

        it('should be a no-op if it is not the left button', () => {
          simulate(layout.handles[0], 'mousedown', { button: 1 });
          expect(panel.events).to.contain('mousedown');
          simulate(document.body, 'mousemove');
          expect(panel.events).to.not.contain('mousemove');
        });

      });

      context('mousemove', () => {

        it('should move the handle right', (done) => {
          let handle = layout.handles[1];
          let rect = handle.getBoundingClientRect();
          simulate(handle, 'mousedown');
          simulate(document.body, 'mousemove', { clientX: rect.left + 10, clientY: rect.top });
          requestAnimationFrame(() => {
            let newRect = handle.getBoundingClientRect();
            expect(newRect.left).to.not.equal(rect.left);
            done();
          });
        });

        it('should move the handle down', (done) => {
          panel.orientation = 'vertical';
          each(panel.widgets, w => { w.node.style.minHeight = '20px'; });
          let handle = layout.handles[1];
          let rect = handle.getBoundingClientRect();
          simulate(handle, 'mousedown');
          simulate(document.body, 'mousemove', { clientX: rect.left, clientY: rect.top - 2 });
          requestAnimationFrame(() => {
            let newRect = handle.getBoundingClientRect();
            expect(newRect.top).to.not.equal(rect.top);
            done();
          });
        });

      });

      context('mouseup', () => {

        it('should remove the event listeners', () => {
          simulate(layout.handles[0], 'mousedown');
          expect(panel.events).to.contain('mousedown');
          simulate(document.body, 'mouseup');
          expect(panel.events).to.contain('mouseup');
          simulate(document.body, 'mousemove');
          expect(panel.events).to.not.contain('mousemove');
          simulate(document.body, 'keydown');
          expect(panel.events).to.not.contain('keydown');
          simulate(document.body, 'contextmenu');
          expect(panel.events).to.not.contain('contextmenu');
        });

        it('should be a no-op if not the left button', () => {
          simulate(layout.handles[0], 'mousedown');
          expect(panel.events).to.contain('mousedown');
          simulate(document.body, 'mouseup', { button: 1 });
          expect(panel.events).to.contain('mouseup');
          simulate(document.body, 'mousemove');
          expect(panel.events).to.contain('mousemove');
        });

      });

      context('keydown', () => {

        it('should release the mouse if `Escape` is pressed', () => {
          simulate(layout.handles[0], 'mousedown');
          simulate(panel.node, 'keydown', { keyCode: 27 });
          expect(panel.events).to.contain('keydown');
          simulate(panel.node, 'mousemove');
          expect(panel.events).to.not.contain('mousemove');
        });

      });

      context('contextmenu', () => {

        it('should prevent events during drag', () => {
          simulate(layout.handles[0], 'mousedown');
          let evt = generate('contextmenu');
          let cancelled = !document.body.dispatchEvent(evt);
          expect(cancelled).to.equal(true);
          expect(panel.events).to.contain('contextmenu');
        });

      });

    });

    describe('#onAfterAttach()', () => {

      it('should attach a mousedown listener to the node', () => {
        let panel = new LogSplitPanel();
        Widget.attach(panel, document.body);
        simulate(panel.node, 'mousedown');
        expect(panel.events).to.contain('mousedown');
        panel.dispose();
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should remove all listeners', () => {
        let panel = new LogSplitPanel();
        Widget.attach(panel, document.body);
        simulate(panel.node, 'mousedown');
        expect(panel.events).to.contain('mousedown');
        Widget.detach(panel);
        panel.events = [];
        simulate(panel.node, 'mousedown');
        expect(panel.events).to.not.contain('mousedown');
        simulate(document.body, 'keyup');
        expect(panel.events).to.not.contain('keyup');
      });

    });

    describe('#onChildAdded()', () => {

      it('should add a class to the child widget', () => {
        let panel = new SplitPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(widget.hasClass('p-SplitPanel-child')).to.equal(true);
      });

    });

    describe('#onChildRemoved()', () => {

      it('should remove a class to the child widget', () => {
        let panel = new SplitPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(widget.hasClass('p-SplitPanel-child')).to.equal(false);
      });

    });

    describe('.Renderer()', () => {

      describe('#createHandle()', () => {

        it('should create a new handle node', () => {
          let renderer = new SplitPanel.Renderer();
          let node1 = renderer.createHandle();
          let node2 = renderer.createHandle();
          expect(node1).to.be.an.instanceof(HTMLElement);
          expect(node2).to.be.an.instanceof(HTMLElement);
          expect(node1).to.not.equal(node2);
        });

        it('should add the "p-SplitPanel-handle" class', () => {
          let renderer = new SplitPanel.Renderer();
          let node = renderer.createHandle();
          expect(node.classList.contains('p-SplitPanel-handle')).to.equal(true);
        });

      });

    });

    describe('.defaultRenderer', () => {

      it('should be an instance of `Renderer`', () => {
        expect(SplitPanel.defaultRenderer).to.be.an.instanceof(SplitPanel.Renderer);
      });

    });

    describe('.getStretch()', () => {

      it('should get the split panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(SplitPanel.getStretch(widget)).to.equal(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the split panel stretch factor for the given widget', () => {
        let widget = new Widget();
        SplitPanel.setStretch(widget, 10);
        expect(SplitPanel.getStretch(widget)).to.equal(10);
      });

    });

  });

});
