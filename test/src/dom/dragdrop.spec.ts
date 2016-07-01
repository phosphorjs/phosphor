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
  Message
} from '../../../lib/core/messaging';

import {
  MimeData
} from '../../../lib/core/mimedata';

import {
  Drag, DropAction, IDragEvent
} from '../../../lib/dom/dragdrop';

import {
  BoxPanel
} from '../../../lib/ui/boxpanel';

import {
  Widget
} from '../../../lib/ui/widget';


class DropTarget extends Widget {

  events: string[] = [];

  constructor() {
    super();
    this.node.style.minWidth = '100px';
    this.node.style.minHeight = '100px';
  }

  handleEvent(event: Event): void {
    this.events.push(event.type);
    switch (event.type) {
    case 'p-dragenter':
      this._evtDragEnter(event as IDragEvent);
      break;
    case 'p-dragleave':
      this._evtDragLeave(event as IDragEvent);
      break;
    case 'p-dragover':
      this._evtDragOver(event as IDragEvent);
      break;
    case 'p-drop':
      this._evtDrop(event as IDragEvent);
      break;
    }
  }

  onAfterAttach(msg: Message): void {
    this.node.addEventListener('p-dragenter', this);
    this.node.addEventListener('p-dragover', this);
    this.node.addEventListener('p-dragleave', this);
    this.node.addEventListener('p-drop', this);
  }

  onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('p-dragenter', this);
    this.node.removeEventListener('p-dragover', this);
    this.node.removeEventListener('p-dragleave', this);
    this.node.removeEventListener('p-drop', this);
  }

  private _evtDragEnter(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private _evtDragLeave(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private _evtDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = event.proposedAction;
  }

  private _evtDrop(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.proposedAction === 'none') {
      event.dropAction = 'none';
      return;
    }
    event.dropAction = event.proposedAction;
  }
}



describe('dom/dragdrop', () => {

  describe('Drag', () => {

    describe('#constructor()', () => {

      it('should accept an options object', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag).to.be.a(Drag);
      });

      it('should accept optional options', () => {
        let dragImage = document.createElement('i');
        let source = {};
        let mimeData = new MimeData();
        let drag = new Drag({
          mimeData,
          dragImage,
          proposedAction: 'copy',
          supportedActions: 'copy-link',
          source
        });
        expect(drag).to.be.a(Drag);
        expect(drag.mimeData).to.be(mimeData);
        expect(drag.dragImage).to.be(dragImage);
        expect(drag.proposedAction).to.be('copy');
        expect(drag.supportedActions).to.be('copy-link');
        expect(drag.source).to.be(source);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the drag object', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        expect(drag.mimeData).to.be(null);
        expect(drag.isDisposed).to.be(true);
      });

      it('should cancel the drag operation if it is active', (done) => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        drag.start(0, 0).then(action => {
          expect(action).to.be('none');
          done();
        });
      });

      it('should be a no-op if already disposed', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        drag.dispose();
        expect(drag.isDisposed).to.be(true);
      });

    });

    describe('#isDisposed()', () => {

      it('should test whether the drag object is disposed', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.isDisposed).to.be(false);
        drag.dispose();
        expect(drag.isDisposed).to.be(true);
      });

      it('should be read-only', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(() => { drag.isDisposed = false; }).to.throwError();
      });

    });

    describe('#mimeData', () => {

      it('should get the mime data for the drag object', () => {
        let mimeData = new MimeData();
        let drag = new Drag({ mimeData });
        expect(drag.mimeData).to.be(mimeData);
      });

      it('should be read-only', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(() => { drag.mimeData = null; }).to.throwError();
      });

    });

    describe('#dragImage', () => {

      it('should get the drag image element for the drag object', () => {
        let dragImage = document.createElement('i');
        let drag = new Drag({ mimeData: new MimeData(), dragImage });
        expect(drag.dragImage).to.be(dragImage);
      });

      it('should default to `null`', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.dragImage).to.be(null);
      });

      it('should be read-only', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(() => { drag.dragImage = null; }).to.throwError();
      });

    });

    describe('#proposedAction', () => {

      it('should get the proposed drop action for the drag object', () => {
        let drag = new Drag({
          mimeData: new MimeData(),
          proposedAction: 'link'
        });
        expect(drag.proposedAction).to.be('link');
      });

      it("should default to `'copy'`", () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.proposedAction).to.be('copy');
      });

      it('should be read-only', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(() => { drag.proposedAction = 'link'; }).to.throwError();
      });

    });

    describe('#supportedActions', () => {

      it('should get the supported drop actions for the drag object', () => {
        let drag = new Drag({
          mimeData: new MimeData(),
          supportedActions: 'copy-move'
        });
        expect(drag.supportedActions).to.be('copy-move');
      });

      it("should default to `'all'`", () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.supportedActions).to.be('all');
      });

      it('should be read-only', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(() => { drag.supportedActions = 'none'; }).to.throwError();
      });

    });

    describe('#source', () => {

      it('should get the drag source for the drag object', () => {
        let source = {};
        let drag = new Drag({ mimeData: new MimeData(), source });
        expect(drag.source).to.be(source);
      });

      it('should default to `null`', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.source).to.be(null);
      });

      it('should be read-only', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(() => { drag.source = null; }).to.throwError();
      });

    });

    describe('#start()', () => {

      it('should start the drag operation at the specified client position', () => {
        let dragImage = document.createElement('span');
        dragImage.style.minHeight = '10px';
        dragImage.style.minWidth = '10px';
        let drag = new Drag({ mimeData: new MimeData(), dragImage });
        expect(drag.start(10, 20)).to.be.a(Promise);
        expect(dragImage.style.top).to.be('20px');
        expect(dragImage.style.left).to.be('10px');
      });

      it('should return a previous promise if a drag has already been started', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        let promise = drag.start(0, 0);
        expect(drag.start(10, 10)).to.be(promise);
        drag.dispose();
      });

      it("should resolve to `'none'` if the drag operation has been disposed", (done) => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        drag.start(0, 0).then(action => {
          expect(action).to.be('none');
          done();
        });
      });

      it("should resolve to `'none'` if the drag object has been disposed", (done) => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        drag.start(0, 0).then(action => {
          expect(action).to.be('none');
          done();
        });
      });

    });

    describe('#handleEvent()', () => {

      let drag: Drag;
      let panel: BoxPanel;
      let dragPromise: Promise<DropAction>;

      beforeEach((done) => {
        panel = new BoxPanel();
        panel.addWidget(new DropTarget());
        panel.addWidget(new DropTarget());
        Widget.attach(panel, document.body);

        let dragImage = document.createElement('span');
        dragImage.style.minHeight = '10px';
        dragImage.style.minWidth = '10px';

        requestAnimationFrame(() => {
          drag = new Drag({ mimeData: new MimeData(), dragImage });
          dragPromise = drag.start(0, 0);
          done();
        });
      });

      afterEach(() => {
        panel.dispose();
        drag.dispose();
      });

      context('mousemove', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mousemove');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

        it('should dispatch an enter and leave events', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragenter');
          child0.events = [];
          let child1 = panel.widgets.at(1) as DropTarget;
          rect = child1.node.getBoundingClientRect();
          simulate(child1.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragleave');
          expect(child1.events).to.contain('p-dragenter');
        });

        it('should dispatch drag over event', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragover');
        });

        it('should move the drag image to the client location', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          let image = drag.dragImage;
          expect(image.style.top).to.be(`${rect.top + 1}px`);
          expect(image.style.left).to.be(`${rect.left + 1}px`);
        });

      });

      context('mouseup', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseup');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

        it('should do nothing if the left button is not released', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1, button: 1 } );
          expect(child0.events).to.not.contain('p-dragenter');
        });

        it('should dispatch enter and leave events', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragenter');
          child0.events = [];
          let child1 = panel.widgets.at(1) as DropTarget;
          rect = child1.node.getBoundingClientRect();
          simulate(child1.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragleave');
          expect(child1.events).to.contain('p-dragenter');
        });

        it("should dispatch a leave event if the last drop action was `'none'", () => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), supportedActions: 'none' });
          drag.start(0, 0);
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragleave');
        });

        it("should finalize the drag with `'none' if the last drop action was `'none`", (done) => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), supportedActions: 'none' });
          drag.start(0, 0).then(action => {
            expect(action).to.be('none');
            done();
          });
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
        });

        it('should dispatch the drop event at the current target', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-drop');
        });

        it('should resolve with the drop action', (done) => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), proposedAction: 'link', supportedActions: 'link' });
          drag.start(0, 0).then(action => {
            expect(action).to.be('link');
            done();
          });
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
        });

        it('should handle a `move` action', (done) => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), proposedAction: 'move', supportedActions: 'copy-move' });
          drag.start(0, 0).then(action => {
            expect(action).to.be('move');
            done();
          });
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
        });

        it('should dispose of the drop', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(drag.isDisposed).to.be(true);
        });

        it('should detach the drag image', () => {
          let image = drag.dragImage;
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(document.contains(image)).to.be(false);
        });

        it('should remove event listeners', () => {
          let child0 = panel.widgets.at(0) as DropTarget;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          ['mousemove', 'keydown', 'contextmenu'].forEach(name => {
            let evt = generate(name);
            let canceled = !document.body.dispatchEvent(evt);
            expect(canceled).to.be(false);
          });
        });

      });

      context('keydown', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('keydown');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

        it('should dispose of the drag if `Escape` is pressed', () => {
          simulate(document.body, 'keydown', { keyCode: 27 });
          expect(drag.isDisposed).to.be(true);
        });

      });

      context('mouseenter', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseenter', { cancelable: true });
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

      context('mouseleave', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseleave', { cancelable: true });
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

      context('mouseover', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseover');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

      context('mouseout', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseout');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

      context('keyup', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('keyup');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

      context('keypress', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('keypress');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

      context('contextmenu', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('contextmenu');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

    });

  });

});
