/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  Message
} from '../../../lib/core/messaging';

import {
  BoxLayout, BoxPanel
} from '../../../lib/ui/boxpanel';

import {
  ChildMessage, ResizeMessage, Widget
} from '../../../lib/ui/widget';



class LogBoxPanel extends BoxPanel {

  methods: string[] = [];

  static createLayout(): LogBoxLayout {
    return new LogBoxLayout();
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


class LogBoxLayout extends BoxLayout {

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
}


describe('ui/boxpanel', () => {

  describe('BoxPanel', () => {

    describe('.createLayout()', () => {

      it('should create a box layout for a box panel', () => {
        let layout = BoxPanel.createLayout();
        expect(layout instanceof BoxLayout).to.be(true);
      });

    });

    describe('.getStretch()', () => {

      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getStretch(widget)).to.be(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setStretch(widget, 8);
        expect(BoxPanel.getStretch(widget)).to.be(8);
      });

    });

    describe('.getSizeBasis()', () => {

      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getSizeBasis(widget)).to.be(0);
      });

    });

    describe('.setSizeBasis()', () => {

      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setSizeBasis(widget, 8);
        expect(BoxPanel.getSizeBasis(widget)).to.be(8);
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
        let panel = new LogBoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.methods.indexOf('onChildAdded')).to.not.be(-1);
        expect(widget.hasClass('p-BoxPanel-child')).to.be(true);
      });

    });

    describe('#onChildRemoved()', () => {

      it('should remove the child class from a child removed from the panel', () => {
        let panel = new LogBoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(panel.methods.indexOf('onChildRemoved')).to.not.be(-1);
        expect(widget.hasClass('p-BoxPanel-child')).to.be(false);
      });

    });

  });

  describe('BoxLayout', () => {

    describe('.getStretch()', () => {

      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getStretch(widget)).to.be(0);
      });

    });

    describe('.setStretch()', () => {

      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setStretch(widget, 8);
        expect(BoxLayout.getStretch(widget)).to.be(8);
      });

    });

    describe('.getSizeBasis()', () => {

      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getSizeBasis(widget)).to.be(0);
      });

    });

    describe('.setSizeBasis()', () => {

      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setSizeBasis(widget, 8);
        expect(BoxLayout.getSizeBasis(widget)).to.be(8);
      });

    });

    describe('#direction', () => {

      it('should default to `"top-to-bottom"`', () => {
        let layout = new BoxLayout();
        expect(layout.direction).to.be('top-to-bottom');
      });

      it('should set the layout direction for the box layout', () => {
        let layout = new BoxLayout();
        layout.direction = 'left-to-right';
        expect(layout.direction).to.be('left-to-right');
      });

    });

    describe('#spacing', () => {

      it('should default to `8`', () => {
        let layout = new BoxLayout();
        expect(layout.spacing).to.be(8);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let layout = new BoxLayout();
        layout.spacing = 4;
        expect(layout.spacing).to.be(4);
      });

    });

    describe('#attachWidget()', () => {

      it("should attach a widget to the parent's DOM node", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new Widget();
        panel.addWidget(widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(panel.node.contains(widget.node)).to.be(true);
      });

      it("should send an `'after-attach'` message if the parent is attached", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        panel.addWidget(widget);
        expect(layout.methods.indexOf('attachWidget')).to.not.be(-1);
        expect(widget.methods.indexOf('onAfterAttach')).to.not.be(-1);
        panel.dispose();
      });

      it('should post a layout request for the parent widget', (done) => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        panel.addWidget(new Widget());
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          done();
        });
      });

    });

    describe('#moveWidget()', () => {

      it('should post an update request for the parent widget', (done) => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.methods.indexOf('moveWidget')).to.not.be(-1);
        requestAnimationFrame(() => {
          expect(panel.methods.indexOf('onUpdateRequest')).to.not.be(-1);
          done();
        });
      });

    });

    describe('#detachWidget()', () => {

      it("should detach a widget from the parent's DOM node", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new Widget();
        panel.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods.indexOf('detachWidget')).to.not.be(-1);
        expect(panel.node.contains(widget.node)).to.be(false);
      });

      it("should send a `'before-detach'` message if the parent is attached", () => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        panel.addWidget(widget);
        layout.removeWidget(widget);
        expect(widget.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        panel.dispose();
      });

      it('should post a layout request for the parent widget', (done) => {
        let panel = new LogBoxPanel();
        let layout = panel.layout as LogBoxLayout;
        let widget = new Widget();
        panel.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
          layout.removeWidget(widget);
          layout.methods = [];
          requestAnimationFrame(() => {
            expect(layout.methods.indexOf('onFitRequest')).to.not.be(-1);
            done();
          });
        });
      });

    });

  });

});
