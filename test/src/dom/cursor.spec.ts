/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  overrideCursor
} from '../../../lib/dom/cursor';


describe('dom/cursor', () => {

  describe('overrideCursor()', () => {

    it('should override the body cursor style', () => {
      let body = document.body;
      let item = overrideCursor('crosshair');
      expect(body.style.cursor).to.be('crosshair');
      item.dispose();
      expect(body.style.cursor).to.be('');
    });

    it('should support multiple adds without contention', () => {
      let body = document.body;
      let item1 = overrideCursor('crosshair');
      let item2 = overrideCursor('wait');
      expect(body.style.cursor).to.be('wait');
      item1.dispose();
      expect(body.style.cursor).to.be('wait');
      item2.dispose();
    });

  });

});
