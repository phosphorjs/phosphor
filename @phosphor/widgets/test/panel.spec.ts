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
  Panel, PanelLayout, Widget
} from '@phosphor/widgets';


describe('@phosphor/widgets', () => {

  describe('Panel', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let panel = new Panel();
        expect(panel).to.be.an.instanceof(Panel);
      });

      it('should accept options', () => {
        let layout = new PanelLayout();
        let panel = new Panel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should add the `p-Panel` class', () => {
        let panel = new Panel();
        expect(panel.hasClass('p-Panel')).to.equal(true);
      });

    });

    describe('#widgets', () => {

      it('should be a read-only array of widgets in the panel', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.widgets).to.deep.equal([widget]);
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the panel', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        expect(panel.widgets[1]).to.equal(widget);
      });

      it('should move an existing widget to the end', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        expect(panel.widgets[1]).to.equal(widget);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget at the specified index', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(new Widget());
        panel.insertWidget(0, widget);
        expect(panel.widgets[0]).to.equal(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        panel.insertWidget(0, widget);
        expect(panel.widgets[0]).to.equal(widget);
      });

    });

  });

});
