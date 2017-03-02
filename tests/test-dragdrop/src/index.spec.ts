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
  MimeData
} from '@phosphor/coreutils';

import {
  Drag, DropAction, IDragEvent
} from '@phosphor/dragdrop';

import '@phosphor/dragdrop/style/index.css';


class DropTarget {

  node = document.createElement('div');

  events: string[] = [];

  constructor() {
    this.node.style.minWidth = '100px';
    this.node.style.minHeight = '100px';
    this.node.addEventListener('p-dragenter', this);
    this.node.addEventListener('p-dragover', this);
    this.node.addEventListener('p-dragleave', this);
    this.node.addEventListener('p-drop', this);
    document.body.appendChild(this.node);
  }

  dispose(): void {
    document.body.removeChild(this.node);
    this.node.removeEventListener('p-dragenter', this);
    this.node.removeEventListener('p-dragover', this);
    this.node.removeEventListener('p-dragleave', this);
    this.node.removeEventListener('p-drop', this);
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


describe('@phosphor/dragdrop', () => {

  describe('Drag', () => {

    describe('#constructor()', () => {

      it('should accept an options object', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag).to.be.an.instanceof(Drag);
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
        expect(drag).to.be.an.instanceof(Drag);
        expect(drag.mimeData).to.equal(mimeData);
        expect(drag.dragImage).to.equal(dragImage);
        expect(drag.proposedAction).to.equal('copy');
        expect(drag.supportedActions).to.equal('copy-link');
        expect(drag.source).to.equal(source);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the drag object', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        expect(drag.isDisposed).to.equal(true);
      });

      it('should cancel the drag operation if it is active', (done) => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.start(0, 0).then(action => {
          expect(action).to.equal('none');
          done();
        });
        drag.dispose();
      });

      it('should be a no-op if already disposed', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        drag.dispose();
        expect(drag.isDisposed).to.equal(true);
      });

    });

    describe('#isDisposed()', () => {

      it('should test whether the drag object is disposed', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.isDisposed).to.equal(false);
        drag.dispose();
        expect(drag.isDisposed).to.equal(true);
      });

    });

    describe('#mimeData', () => {

      it('should get the mime data for the drag object', () => {
        let mimeData = new MimeData();
        let drag = new Drag({ mimeData });
        expect(drag.mimeData).to.equal(mimeData);
      });

    });

    describe('#dragImage', () => {

      it('should get the drag image element for the drag object', () => {
        let dragImage = document.createElement('i');
        let drag = new Drag({ mimeData: new MimeData(), dragImage });
        expect(drag.dragImage).to.equal(dragImage);
      });

      it('should default to `null`', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.dragImage).to.equal(null);
      });

    });

    describe('#proposedAction', () => {

      it('should get the proposed drop action for the drag object', () => {
        let drag = new Drag({
          mimeData: new MimeData(),
          proposedAction: 'link'
        });
        expect(drag.proposedAction).to.equal('link');
      });

      it("should default to `'copy'`", () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.proposedAction).to.equal('copy');
      });

    });

    describe('#supportedActions', () => {

      it('should get the supported drop actions for the drag object', () => {
        let drag = new Drag({
          mimeData: new MimeData(),
          supportedActions: 'copy-move'
        });
        expect(drag.supportedActions).to.equal('copy-move');
      });

      it("should default to `'all'`", () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.supportedActions).to.equal('all');
      });

    });

    describe('#source', () => {

      it('should get the drag source for the drag object', () => {
        let source = {};
        let drag = new Drag({ mimeData: new MimeData(), source });
        expect(drag.source).to.equal(source);
      });

      it('should default to `null`', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        expect(drag.source).to.equal(null);
      });

    });

    describe('#start()', () => {

      it('should start the drag operation at the specified client position', () => {
        let dragImage = document.createElement('span');
        dragImage.style.minHeight = '10px';
        dragImage.style.minWidth = '10px';
        let drag = new Drag({ mimeData: new MimeData(), dragImage });
        drag.start(10, 20);
        expect(dragImage.style.top).to.equal('20px');
        expect(dragImage.style.left).to.equal('10px');
        drag.dispose();
      });

      it('should return a previous promise if a drag has already been started', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        let promise = drag.start(0, 0);
        expect(drag.start(10, 10)).to.equal(promise);
        drag.dispose();
      });

      it("should resolve to `'none'` if the drag operation has been disposed", (done) => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.start(0, 0).then(action => {
          expect(action).to.equal('none');
          done();
        });
        drag.dispose();
      });

    });

    context('Event Handling', () => {

      let drag: Drag = null!;
      let dragPromise: Promise<DropAction> = null!;
      let child0: DropTarget = null!;
      let child1: DropTarget = null!;

      beforeEach(() => {
        child0 = new DropTarget();
        child1 = new DropTarget();

        let dragImage = document.createElement('div');
        dragImage.style.minHeight = '10px';
        dragImage.style.minWidth = '10px';

        drag = new Drag({ mimeData: new MimeData(), dragImage });
        dragPromise = drag.start(0, 0);
      });

      afterEach(() => {
        drag.dispose();
        child0.dispose();
        child1.dispose();
      });

      describe('mousemove', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mousemove');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

        it('should dispatch an enter and leave events', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragenter');
          child0.events = [];
          rect = child1.node.getBoundingClientRect();
          simulate(child1.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragleave');
          expect(child1.events).to.contain('p-dragenter');
        });

        it('should dispatch drag over event', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragover');
        });

        it('should move the drag image to the client location', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          let image = drag.dragImage!;
          expect(image.style.top).to.equal(`${rect.top + 1}px`);
          expect(image.style.left).to.equal(`${rect.left + 1}px`);
        });

      });

      describe('mouseup', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseup');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

        it('should do nothing if the left button is not released', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1, button: 1 } );
          expect(child0.events).to.not.contain('p-dragenter');
        });

        it('should dispatch enter and leave events', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mousemove', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragenter');
          child0.events = [];
          rect = child1.node.getBoundingClientRect();
          simulate(child1.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragleave');
          expect(child1.events).to.contain('p-dragenter');
        });

        it("should dispatch a leave event if the last drop action was `'none'", () => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), supportedActions: 'none' });
          drag.start(0, 0);
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-dragleave');
        });

        it("should finalize the drag with `'none' if the last drop action was `'none`", (done) => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), supportedActions: 'none' });
          drag.start(0, 0).then(action => {
            expect(action).to.equal('none');
            done();
          });
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
        });

        it('should dispatch the drop event at the current target', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(child0.events).to.contain('p-drop');
        });

        it('should resolve with the drop action', (done) => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), proposedAction: 'link', supportedActions: 'link' });
          drag.start(0, 0).then(action => {
            expect(action).to.equal('link');
            done();
          });
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
        });

        it('should handle a `move` action', (done) => {
          drag.dispose();
          drag = new Drag({ mimeData: new MimeData(), proposedAction: 'move', supportedActions: 'copy-move' });
          drag.start(0, 0).then(action => {
            expect(action).to.equal('move');
            done();
          });
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
        });

        it('should dispose of the drop', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(drag.isDisposed).to.equal(true);
        });

        it('should detach the drag image', () => {
          let image = drag.dragImage!;
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          expect(document.body.contains(image)).to.equal(false);
        });

        it('should remove event listeners', () => {
          let rect = child0.node.getBoundingClientRect();
          simulate(child0.node, 'mouseup', { clientX: rect.left + 1, clientY: rect.top + 1 } );
          ['mousemove', 'keydown', 'contextmenu'].forEach(name => {
            let evt = generate(name);
            let canceled = !document.body.dispatchEvent(evt);
            expect(canceled).to.equal(false);
          });
        });

      });

      describe('keydown', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('keydown');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

        it('should dispose of the drag if `Escape` is pressed', () => {
          simulate(document.body, 'keydown', { keyCode: 27 });
          expect(drag.isDisposed).to.equal(true);
        });

      });

      describe('mouseenter', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseenter', { cancelable: true });
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

      });

      describe('mouseleave', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseleave', { cancelable: true });
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

      });

      describe('mouseover', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseover');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

      });

      describe('mouseout', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseout');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

      });

      describe('keyup', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('keyup');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

      });

      describe('keypress', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('keypress');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

      });

      describe('contextmenu', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('contextmenu');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.equal(true);
        });

      });

    });

    describe('.overrideCursor()', () => {

      it('should update the body `cursor` style', () => {
        expect(document.body.style.cursor).to.equal('');
        let override = Drag.overrideCursor('wait');
        expect(document.body.style.cursor).to.equal('wait');
        override.dispose();
      });

      it('should add the `p-mod-override-cursor` class to the body', () => {
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(false);
        let override = Drag.overrideCursor('wait');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(true);
        override.dispose();
      });

      it('should clear the override when disposed', () => {
        expect(document.body.style.cursor).to.equal('');
        let override = Drag.overrideCursor('wait');
        expect(document.body.style.cursor).to.equal('wait');
        override.dispose();
        expect(document.body.style.cursor).to.equal('');
      });

      it('should remove the `p-mod-override-cursor` class when disposed', () => {
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(false);
        let override = Drag.overrideCursor('wait');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(true);
        override.dispose();
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(false);
      });

      it('should respect the most recent override', () => {
        expect(document.body.style.cursor).to.equal('');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(false);
        let one = Drag.overrideCursor('wait');
        expect(document.body.style.cursor).to.equal('wait');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(true);
        let two = Drag.overrideCursor('default');
        expect(document.body.style.cursor).to.equal('default');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(true);
        let three = Drag.overrideCursor('cell');
        expect(document.body.style.cursor).to.equal('cell');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(true);
        two.dispose();
        expect(document.body.style.cursor).to.equal('cell');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(true);
        one.dispose();
        expect(document.body.style.cursor).to.equal('cell');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(true);
        three.dispose();
        expect(document.body.style.cursor).to.equal('');
        expect(document.body.classList.contains('p-mod-override-cursor')).to.equal(false);
      });

      it('should override the computed cursor for a node', () => {
        let div = document.createElement('div');
        div.style.cursor = 'cell';
        document.body.appendChild(div);
        expect(window.getComputedStyle(div).cursor).to.equal('cell');
        let override = Drag.overrideCursor('wait');
        expect(window.getComputedStyle(div).cursor).to.equal('wait');
        override.dispose();
        expect(window.getComputedStyle(div).cursor).to.equal('cell');
        document.body.removeChild(div);
      });

    });

  });

});
