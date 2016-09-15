/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  simulate
} from 'simulate-event';

import {
  FocusTracker
} from '../../../lib/ui/focustracker';

import {
  Widget
} from '../../../lib/ui/widget';


function createWidget(): Widget {
  let widget = new Widget();
  widget.node.tabIndex = -1;
  Widget.attach(widget, document.body);
  return widget;
}


describe('ui/focustracker', () => {

  describe('FocusTracker', () => {

    describe('#constructor()', () => {

      it('should create a FocusTracker', () => {
        let tracker = new FocusTracker();
        expect(tracker).to.be.a(FocusTracker);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the tracker', () => {
        let tracker = new FocusTracker();
        tracker.add(createWidget());
        tracker.dispose();
        expect(tracker.widgets.length).to.be(0);
      });

      it('should be a no-op if already disposed', () => {
        let tracker = new FocusTracker();
        tracker.dispose();
        tracker.dispose();
        expect(tracker.isDisposed).to.be(true);
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current widget has changed', () => {
        let tracker = new FocusTracker();
        let called = false;
        let widget0 = createWidget();
        let widget1 = createWidget();
        tracker.add(widget0);
        tracker.add(widget1);
        simulate(widget0.node, 'focus');
        tracker.currentChanged.connect((sender, args) => {
          expect(sender).to.be(tracker);
          expect(args.oldValue).to.be(widget0);
          expect(args.newValue).to.be(widget1);
          called = true;
        });
        expect(called).to.be(false);
        simulate(widget1.node, 'focus');
        expect(called).to.be(true);
      });

    });

    describe('#isDisposed', () => {

      it('should indicate whether the tracker is disposed', () => {
        let tracker = new FocusTracker();
        expect(tracker.isDisposed).to.be(false);
        tracker.dispose();
        expect(tracker.isDisposed).to.be(true);
      });

      it('should be read-only', () => {
        let tracker = new FocusTracker();
        expect(() => { tracker.isDisposed = true; }).to.throwError();
      });

    });

    describe('#currentWidget', () => {

      it('should get the current widget in the tracker', () => {
        let tracker = new FocusTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.be(widget);
      });

      it('should not be updated when the current widget loses focus', () => {
        let tracker = new FocusTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.be(widget);
        widget.node.blur();
        expect(tracker.currentWidget).to.be(widget);
      });

      it('should revert to the previous widget if the current widget is removed', () => {
        let tracker = new FocusTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        simulate(widget1.node, 'focus');
        expect(tracker.currentWidget).to.be(widget1);
        widget1.dispose();
        expect(tracker.currentWidget).to.be(widget0);
      });

      it('should be `null` if there is no current widget', () => {
        let tracker = new FocusTracker();
        expect(tracker.currentWidget).to.be(null);
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.be(widget);
        widget.dispose();
        expect(tracker.currentWidget).to.be(null);
      });

      it('should be read-only', () => {
        let tracker = new FocusTracker();
        expect(() => { tracker.currentWidget = null; }).to.throwError();
      });

    });

    describe('#widgets', () => {

      it('should be a read-only sequence of the widgets being tracked', () => {
        let tracker = new FocusTracker();
        expect(tracker.widgets.length).to.be(0);
        let widget = createWidget();
        tracker.add(widget);
        expect(tracker.widgets.length).to.be(1);
        expect(tracker.widgets.at(0)).to.be(widget);
      });

      it('should be read-only', () => {
        let tracker = new FocusTracker();
        expect(() => { tracker.widgets = null; }).to.throwError();
      });

    });

    describe('#focusNumber()', () => {

      it('should get the focus number for a particular widget in the tracker', () => {
        let tracker = new FocusTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.focusNumber(widget)).to.be(0);
      });

      it('should give the highest number for the currentWidget', () => {
        let tracker = new FocusTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        simulate(widget1.node, 'focus');
        expect(tracker.focusNumber(widget1)).to.be(1);
        expect(tracker.focusNumber(widget0)).to.be(0);
        simulate(widget0.node, 'focus');
        expect(tracker.focusNumber(widget0)).to.be(2);
      });

      it('should start a widget with a focus number of `-1`', () => {
        let tracker = new FocusTracker();
        let widget = new Widget();
        tracker.add(widget);
        expect(tracker.focusNumber(widget)).to.be(-1);
      });

    });

    describe('#has()', () => {

      it('should test whether the focus tracker contains a given widget', () => {
        let tracker = new FocusTracker();
        let widget = new Widget();
        expect(tracker.has(widget)).to.be(false);
        tracker.add(widget);
        expect(tracker.has(widget)).to.be(true);
      });

    });

    describe('#add()', () => {

      it('should add a widget to the focus tracker', () => {
        let tracker = new FocusTracker();
        let widget = new Widget();
        tracker.add(widget);
        expect(tracker.has(widget)).to.be(true);
      });

      it('should make the widget the currentWidget if focused', () => {
        let tracker = new FocusTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.be(widget);
      });

      it('should remove the widget from the tracker after it has been disposed', () => {
        let tracker = new FocusTracker();
        let widget = new Widget();
        tracker.add(widget);
        widget.dispose();
        expect(tracker.has(widget)).to.be(false);
      });

      it('should be a no-op if the widget is already tracked', () => {
        let tracker = new FocusTracker();
        let widget = new Widget();
        tracker.add(widget);
        tracker.add(widget);
        expect(tracker.has(widget)).to.be(true);
      });

    });

    describe('#remove()', () => {

      it('should remove a widget from the focus tracker', () => {
        let tracker = new FocusTracker();
        let widget = new Widget();
        tracker.add(widget);
        tracker.remove(widget);
        expect(tracker.has(widget)).to.be(false);
      });

      it('should set the currentWidget to the previous one if the widget is the currentWidget', () => {
        let tracker = new FocusTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        simulate(widget1.node, 'focus');
        tracker.remove(widget1);
        expect(tracker.currentWidget).to.be(widget0);
      });

      it('should be a no-op if the widget is not tracked', () => {
        let tracker = new FocusTracker();
        let widget = new Widget();
        tracker.remove(widget);
        expect(tracker.has(widget)).to.be(false);
      });

    });

    describe('#handleEvent()', () => {

      context('focus', () => {

        it('should set the current widget to the widget that gained focus', () => {
          let tracker = new FocusTracker();
          let widget0 = createWidget();
          let widget1 = createWidget();
          widget0.node.focus();
          tracker.add(widget0);
          tracker.add(widget1);
          simulate(widget1.node, 'focus');
          expect(tracker.currentWidget).to.be(widget1);
        });

        it('should set the focus number of the widget', () => {
          let tracker = new FocusTracker();
          let widget0 = createWidget();
          let widget1 = createWidget();
          widget0.node.focus();
          tracker.add(widget0);
          tracker.add(widget1);
          simulate(widget1.node, 'focus');
          expect(tracker.focusNumber(widget0)).to.be(0);
          simulate(widget0.node, 'focus');
          expect(tracker.focusNumber(widget0)).to.be(2);
        });

      });

    });

  });

});
