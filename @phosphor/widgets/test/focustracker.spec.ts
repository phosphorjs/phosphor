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
  FocusTracker, Widget
} from '@phosphor/widgets';



describe('@phosphor/widgets', () => {

  let _trackers: FocusTracker<Widget>[] = [];
  let _widgets: Widget[] = [];

  function createTracker(): FocusTracker<Widget> {
    let tracker = new FocusTracker<Widget>();
    _trackers.push(tracker);
    return tracker;
  }

  function createWidget(): Widget {
    let widget = new Widget();
    widget.node.tabIndex = -1;
    Widget.attach(widget, document.body);
    _widgets.push(widget);
    return widget;
  }

  afterEach(() => {
    while (_trackers.length > 0) {
      _trackers.pop()!.dispose();
    }
    while (_widgets.length > 0) {
      _widgets.pop()!.dispose();
    }
  });

  describe('FocusTracker', () => {

    describe('#constructor()', () => {

      it('should create a FocusTracker', () => {
        let tracker = new FocusTracker<Widget>();
        expect(tracker).to.be.an.instanceof(FocusTracker);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the tracker', () => {
        let tracker = new FocusTracker<Widget>();
        tracker.add(createWidget());
        tracker.dispose();
        expect(tracker.widgets.length).to.equal(0);
      });

      it('should be a no-op if already disposed', () => {
        let tracker = new FocusTracker<Widget>();
        tracker.dispose();
        tracker.dispose();
        expect(tracker.isDisposed).to.equal(true);
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current widget has changed', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        tracker.add(widget0);
        tracker.add(widget1);
        widget0.node.focus();
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.currentChanged.connect((sender, args) => {
          emitArgs = args;
        });
        widget1.node.focus();
        expect(emitArgs).to.not.equal(null);
        expect(emitArgs!.oldValue).to.equal(widget0);
        expect(emitArgs!.newValue).to.equal(widget1);
      });

      it('should not be emitted when the current widget does not change', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.currentChanged.connect((sender, args) => {
          emitArgs = args;
        });
        widget.node.blur();
        widget.node.focus();
        expect(emitArgs).to.equal(null);
      });

    });

    describe('#activeChanged', () => {

      it('should be emitted when the active widget has changed', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        tracker.add(widget0);
        tracker.add(widget1);
        widget0.node.focus();
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.activeChanged.connect((sender, args) => {
          emitArgs = args;
        });
        widget1.node.focus();
        expect(emitArgs).to.not.equal(null);
        expect(emitArgs!.oldValue).to.equal(widget0);
        expect(emitArgs!.newValue).to.equal(widget1);
      });

      it('should be emitted when the active widget is set to null', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.activeChanged.connect((sender, args) => {
          emitArgs = args;
        });
        widget.node.blur();
        expect(emitArgs).to.not.equal(null);
        expect(emitArgs!.oldValue).to.equal(widget);
        expect(emitArgs!.newValue).to.equal(null);
      });

    });

    describe('#isDisposed', () => {

      it('should indicate whether the tracker is disposed', () => {
        let tracker = new FocusTracker<Widget>();
        expect(tracker.isDisposed).to.equal(false);
        tracker.dispose();
        expect(tracker.isDisposed).to.equal(true);
      });

    });

    describe('#currentWidget', () => {

      it('should get the current widget in the tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
      });

      it('should not be updated when the current widget loses focus', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
        widget.node.blur();
        expect(tracker.currentWidget).to.equal(widget);
      });

      it('should be set to the widget that gained focus', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        expect(tracker.currentWidget).to.equal(widget0);
        widget1.node.focus();
        expect(tracker.currentWidget).to.equal(widget1);
      });

      it('should revert to the previous widget if the current widget is removed', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        widget1.node.focus();
        expect(tracker.currentWidget).to.equal(widget1);
        widget1.dispose();
        expect(tracker.currentWidget).to.equal(widget0);
      });

      it('should be `null` if there is no current widget', () => {
        let tracker = createTracker();
        expect(tracker.currentWidget).to.equal(null);
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
        widget.dispose();
        expect(tracker.currentWidget).to.equal(null);
      });

    });

    describe('#activeWidget', () => {

      it('should get the active widget in the tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.activeWidget).to.equal(widget);
      });

      it('should be set to `null` when the active widget loses focus', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.activeWidget).to.equal(widget);
        widget.node.blur();
        expect(tracker.activeWidget).to.equal(null);
      });

      it('should be set to the widget that gained focus', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        expect(tracker.activeWidget).to.equal(widget0);
        widget1.node.focus();
        expect(tracker.activeWidget).to.equal(widget1);
      });

      it('should be `null` if there is no active widget', () => {
        let tracker = createTracker();
        expect(tracker.currentWidget).to.equal(null);
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.activeWidget).to.equal(widget);
        widget.dispose();
        expect(tracker.activeWidget).to.equal(null);
      });

    });

    describe('#widgets', () => {

      it('should be a read-only sequence of the widgets being tracked', () => {
        let tracker = createTracker();
        expect(tracker.widgets.length).to.equal(0);
        let widget = createWidget();
        tracker.add(widget);
        expect(tracker.widgets.length).to.equal(1);
        expect(tracker.widgets[0]).to.equal(widget);
      });

    });

    describe('#focusNumber()', () => {

      it('should get the focus number for a particular widget in the tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.focusNumber(widget)).to.equal(0);
      });

      it('should give the highest number for the currentWidget', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        widget1.node.focus();
        expect(tracker.focusNumber(widget1)).to.equal(1);
        expect(tracker.focusNumber(widget0)).to.equal(0);
        widget0.node.focus();
        expect(tracker.focusNumber(widget0)).to.equal(2);
      });

      it('should start a widget with a focus number of `-1`', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        expect(tracker.focusNumber(widget)).to.equal(-1);
      });

      it('should update when a widget gains focus', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        widget1.node.focus();
        expect(tracker.focusNumber(widget0)).to.equal(0);
        widget0.node.focus();
        expect(tracker.focusNumber(widget0)).to.equal(2);
      });

    });

    describe('#has()', () => {

      it('should test whether the focus tracker contains a given widget', () => {
        let tracker = createTracker();
        let widget = createWidget();
        expect(tracker.has(widget)).to.equal(false);
        tracker.add(widget);
        expect(tracker.has(widget)).to.equal(true);
      });

    });

    describe('#add()', () => {

      it('should add a widget to the focus tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        expect(tracker.has(widget)).to.equal(true);
      });

      it('should make the widget the currentWidget if focused', () => {
        let tracker = createTracker();
        let widget = createWidget();
        widget.node.focus();
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
      });

      it('should remove the widget from the tracker after it has been disposed', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        widget.dispose();
        expect(tracker.has(widget)).to.equal(false);
      });

      it('should be a no-op if the widget is already tracked', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        tracker.add(widget);
        expect(tracker.has(widget)).to.equal(true);
      });

    });

    describe('#remove()', () => {

      it('should remove a widget from the focus tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        tracker.remove(widget);
        expect(tracker.has(widget)).to.equal(false);
      });

      it('should set the currentWidget to the previous one if the widget is the currentWidget', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        let widget2 = createWidget();
        widget0.node.focus();
        tracker.add(widget0);
        tracker.add(widget1);
        tracker.add(widget2);
        widget1.node.focus();
        widget2.node.focus();
        tracker.remove(widget2);
        expect(tracker.currentWidget).to.equal(widget1);
      });

      it('should be a no-op if the widget is not tracked', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.remove(widget);
        expect(tracker.has(widget)).to.equal(false);
      });

    });

  });

});
