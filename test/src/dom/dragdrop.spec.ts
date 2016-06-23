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
  MimeData
} from '../../../lib/core/mimedata';

import {
  Drag
} from '../../../lib/dom/dragdrop';


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

      it('should cancel the drag operation if it is active', () => {

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

      });

      it('should return return a previous call to start if a drag has already been started', () => {
        let drag = new Drag({ mimeData: new MimeData() });
        let promise = drag.start(0, 0);
        expect(drag.start(10, 10)).to.be(promise);
        drag.dispose();
      });

      it("should resolve to `'none'` if the drag operation has ended", () => {

      });

      it("should resolve to `'none'` if the drag object has been disposed", (done) => {
        let drag = new Drag({ mimeData: new MimeData() });
        drag.dispose();
        drag.start(0, 0).then(action => {
          expect(action).to.be('none');
          done();
        });
      });

      it('should be disposed when the drag operation completes', () => {

      });

    });

    describe('#handleEvent()', () => {

      let drag: Drag;

      beforeEach(() => {
        drag = new Drag({ mimeData: new MimeData() });
        drag.start(0, 0);
      });

      afterEach(() => {
        drag.dispose();
      });

      context('mousemove', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mousemove');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

        it('should update the current target node', () => {

        });

        it('should dispatch enter and leave events', () => {

        });

        it('should move the drag image to the client location', () => {

        });

      });

      context('mouseup', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseup');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

        it('should do nothing if the left button is not released', () => {

        });

        it('should update the current target node', () => {

        });

        it('should dispatch enter and leave events', () => {

        });

        it("should finalize with `'none'` if there is no current target", () => {

        });

        it("should dispatch a leave event if the last drop action was `'none'", () => {

        });

        it("should finalize the drag with `'none' if the last drop action was `'none`", () => {

        });

        it('should dispatch the drop event at the current target', () => {

        });

        it('should resolve with the drop action', () => {

        });

        it('should dispose of the drop', () => {

        });

        it('should detach the drag image', () => {

        });

        it('should remove event listeners', () => {

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
          let evt = generate('mouseenter');
          let canceled = !document.body.dispatchEvent(evt);
          expect(canceled).to.be(true);
        });

      });

      context('mouseleave', () => {

        it('should be prevented during a drag event', () => {
          let evt = generate('mouseleave');
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
