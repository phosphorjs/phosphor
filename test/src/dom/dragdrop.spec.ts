/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

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

    });

    describe('#proposedAction', () => {

    });

    describe('#supportedActions', () => {

    });

    describe('#source', () => {

    });

    describe('#start()', () => {

    });

    describe('#handleEvent()', () => {

      context('mousemove', () => {

      });

      context('mouseup', () => {

      });

      context('keydown', () => {

      });

      context('mouseenter', () => {

      });

      context('mouseleave', () => {

      });

      context('mouseover', () => {

      });

      context('mouseout', () => {

      });

      context('keyup', () => {

      });

      context('keypress', () => {

      });

      context('contextmenu', () => {

      });

    });

  });

});
