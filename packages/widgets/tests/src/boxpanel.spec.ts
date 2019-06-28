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
  BoxLayout, BoxPanel, Widget
} from '@phosphor/widgets';


describe('@phosphor/widgets', () => {

  describe('BoxPanel', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let panel = new BoxPanel();
        expect(panel).to.be.an.instanceof(BoxPanel);
      });

      it('should accept options', () => {
        let panel = new BoxPanel({ direction: 'bottom-to-top', spacing: 10 });
        expect(panel.direction).to.equal('bottom-to-top');
        expect(panel.spacing).to.equal(10);
      });

      it('should accept a layout option', () => {
        let layout = new BoxLayout();
        let panel = new BoxPanel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let layout = new BoxLayout();
        let panel = new BoxPanel({
          layout, direction: 'bottom-to-top', spacing: 10
        });
        expect(panel.layout).to.equal(layout);
        expect(panel.direction).to.equal('top-to-bottom');
        expect(panel.spacing).to.equal(4);
      });

      it('should add the `p-BoxPanel` class', () => {
        let panel = new BoxPanel();
        expect(panel.hasClass('p-BoxPanel')).to.equal(true);
      });

    });

    describe('#direction', () => {

      it('should default to `"top-to-bottom"`', () => {
        let panel = new BoxPanel();
        expect(panel.direction).to.equal('top-to-bottom');
      });

      it('should set the layout direction for the box panel', () => {
        let panel = new BoxPanel();
        panel.direction = 'left-to-right';
        expect(panel.direction).to.equal('left-to-right');
      });

    });

    describe('#spacing', () => {

      it('should default to `4`', () => {
        let panel = new BoxPanel();
        expect(panel.spacing).to.equal(4);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let panel = new BoxPanel();
        panel.spacing = 8;
        expect(panel.spacing).to.equal(8);
      });

    });

    describe('#onChildAdded()', () => {

      it('should add the child class to a child added to the panel', () => {
        let panel = new BoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(widget.hasClass('p-BoxPanel-child')).to.equal(true);
      });

    });

    describe('#onChildRemoved()', () => {

      it('should remove the child class from a child removed from the panel', () => {
        let panel = new BoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(widget.hasClass('p-BoxPanel-child')).to.equal(false);
      });

    });

    describe('.getStretch()', () => {

      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getStretch(widget)).to.equal(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setStretch(widget, 8);
        expect(BoxPanel.getStretch(widget)).to.equal(8);
      });

    });

    describe('.getSizeBasis()', () => {

      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getSizeBasis(widget)).to.equal(0);
      });

    });

    describe('.setSizeBasis()', () => {

      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setSizeBasis(widget, 8);
        expect(BoxPanel.getSizeBasis(widget)).to.equal(8);
      });

    });

  });

});
