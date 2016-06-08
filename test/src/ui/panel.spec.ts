/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  each, every
} from '../../../lib/algorithm/iteration';

import {
  Panel, PanelLayout
} from '../../../lib/ui/panel';

import {
  Widget
} from '../../../lib/ui/widget';


describe('ui/panel', () => {

  describe('Panel', () => {

    describe('.createLayout', () => {

      it('should create a panel layout to use with a new panel', () => {
        let layout = Panel.createLayout();
        expect(layout instanceof PanelLayout).to.be(true);
      });

    });

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let panel = new Panel();
        expect(panel.layout instanceof PanelLayout).to.be(true);
      });

    });

    describe('#widgets', () => {

      it('should be a read-only sequence of widgets in the panel', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        let widgets = panel.widgets;
        expect(widgets.length).to.be(1);
        expect(widgets.at(0)).to.be(widget);
      });

      it('should be read-only', () => {
        let panel = new Panel();
        expect(() => { panel.widgets = null; }).to.throwError();
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the panel', () => {
        let panel = new Panel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.widgets.at(1)).to.be(widget);
      });

      it('should move an existing widget to the end', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        expect(panel.widgets.at(1)).to.be(widget);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget at the specified index', () => {
        let panel = new Panel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.insertWidget(0, widget);
        expect(panel.widgets.at(0)).to.be(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let panel = new Panel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.addWidget(widget);
        panel.insertWidget(0, widget);
        expect(panel.widgets.at(0)).to.be(widget);
      });

    });

  });

  describe('PanelLayout', () => {

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        each(widgets, w => layout.addWidget(w));
        layout.dispose();
        expect(every(widgets, w => { return w.isDisposed; })).to.be(true);
      });

    });

    describe('#widgets', () => {

      it('should be a read-only sequence of widgets in the layout', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        let widgets = layout.widgets;
        expect(widgets.length).to.be(1);
        expect(widgets.at(0)).to.be(widget);
      });

      it('should be read-only', () => {
        let layout = new PanelLayout();
        expect(() => { layout.widgets = null; }).to.throwError();
      });

    });

    describe('#iter()', () => {

      it('should create an iterator over the widgets in the layout', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        each(widgets, w => layout.addWidget(w));
        each(widgets, w => w.title.label = 'foo');
        let iter = layout.iter();
        expect(every(iter, w => { return w.title.label === 'foo'; })).to.be(true);
        expect(layout.iter()).to.not.be(iter);
      });

    });


    describe('#addWidget()', () => {

      it('should add a widget to the end of the layout', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.widgets.at(1)).to.be(widget);
      });

      it('should move an existing widget to the end', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.addWidget(widget);
        expect(layout.widgets.at(1)).to.be(widget);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget at the specified index', () => {
        let panel = new Panel();
        let layout = panel.layout as PanelLayout;
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(0, widget);
        expect(layout.widgets.at(0)).to.be(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.widgets.at(0)).to.be(widget);
      });

      it('should clamp the index to the bounds of the widgets', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(-2, widget);
        expect(layout.widgets.at(0)).to.be(widget);

        layout.insertWidget(10, widget);
        expect(layout.widgets.at(1)).to.be(widget);
      });

    });

    describe('#removeWidget()', () => {

      it('should remove a widget by value', () => {
        let panel = new Panel();
        let layout = panel.layout as PanelLayout;
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidget(widget);
        expect(layout.widgets.length).to.be(1);
        expect(layout.widgets.at(0)).to.not.be(widget);
      });

      it('should remove a widget by index', () => {
        let panel = new Panel();
        let layout = panel.layout as PanelLayout;
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidget(0);
        expect(layout.widgets.length).to.be(1);
        expect(layout.widgets.at(0)).to.not.be(widget);
      });

      it('should be a no-op if the widget is not in the panel', () => {
        let panel = new Panel();
        let layout = panel.layout as PanelLayout;
        let widget = new Widget();
        layout.addWidget(new Widget());
        layout.removeWidget(widget);
        expect(layout.widgets.length).to.be(1);
        layout.removeWidget(-1);
        expect(layout.widgets.length).to.be(1);
        layout.removeWidget(1);
        expect(layout.widgets.length).to.be(1);
      });

    });

  });

});
