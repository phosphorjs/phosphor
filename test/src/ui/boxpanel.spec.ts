/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  BoxLayout, BoxPanel
} from '../../../lib/ui/boxpanel';

import {
  ChildMessage
} from '../../../lib/ui/widget';



class LogPanel extends BoxPanel {

  methods: string[] = [];

  protected onChildAdded(msg: ChildMessage): void {
    super.onChildAdded(msg);
    this.methods.push('onChildAdded');
  }

  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
  }
}


describe('ui/boxpanel', () => {

  describe('BoxPanel', () => {

    describe('.createLayout()', () => {

      it('should create a box layout for a box panel', () => {
        let layout = BoxPanel.createLayout();
        expect(layout instanceof BoxLayout).to.be(true);
      });

    });

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let panel = new BoxPanel();
        expect(panel instanceof BoxPanel).to.be(true);
      });

      it('should accept options', () => {
        let panel = new BoxPanel({ direction: 'bottom-to-top', spacing: 10 });
        expect(panel.direction).to.be('bottom-to-top');
        expect(panel.spacing).to.be(10);
      });

    });

    describe('#direction', () => {

      it('should default to `"top-to-bottom"`', () => {
        let panel = new BoxPanel();
        expect(panel.direction).to.be('top-to-bottom');
      });

      it('should set the layout direction for the box panel', () => {
        let panel = new BoxPanel();
        panel.direction = 'left-to-right';
        expect(panel.direction).to.be('left-to-right');
      });

    });

    describe('#spacing', () => {

      it('should default to `8`', () => {
        let panel = new BoxPanel();
        expect(panel.spacing).to.be(8);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let panel = new BoxPanel();
        panel.spacing = 4;
        expect(panel.spacing).to.be(4);
      });

    });

    describe('#onChildAdded()', () => {

      it('should add the child class to a child added to the panel', () => {
        let panel = new BoxPanel();
        panel.addChild()
      });

    });

  });

});
