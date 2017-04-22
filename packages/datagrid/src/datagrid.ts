/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ConflatableMessage, Message, MessageLoop
} from '@phosphor/messaging';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  GridLayout, ScrollBar, Widget
} from '@phosphor/widgets';

import {
  DataModel
} from './datamodel';

import {
  GridViewport
} from './gridviewport';

import {
  ISectionStriping
} from './sectionstriping';


/**
 * A widget which implements a high-performance tabular data grid.
 *
 * #### Notes
 * This class is not designed to be subclassed.
 *
 * A data grid is implemented as a composition of child widgets. These
 * child widgets are considered an implementation detail. Manipulating
 * the child widgets of a data grid directly is undefined behavior.
 */
export
class DataGrid extends Widget {
  /**
   * Construct a new data grid.
   */
  constructor() {
    super();
    this.addClass('p-DataGrid');

    // Create the internal widgets for the data grid.
    // TODO - support custom scroll bars and corner widget?
    this._viewport = new GridViewport();
    this._vScrollBar = new ScrollBar({ orientation: 'vertical' });
    this._hScrollBar = new ScrollBar({ orientation: 'horizontal' });
    this._cornerWidget = new Widget();

    // Hide the scroll bars and corner widget from the outset.
    this._vScrollBar.hide();
    this._hScrollBar.hide();
    this._cornerWidget.hide();

    // Connect to the scroll bar signals.
    this._vScrollBar.thumbMoved.connect(this._onThumbMoved, this);
    this._hScrollBar.thumbMoved.connect(this._onThumbMoved, this);
    this._vScrollBar.pageRequested.connect(this._onPageRequested, this);
    this._hScrollBar.pageRequested.connect(this._onPageRequested, this);
    this._vScrollBar.stepRequested.connect(this._onStepRequested, this);
    this._hScrollBar.stepRequested.connect(this._onStepRequested, this);

    // Add the extra class names to the child widgets.
    this._viewport.addClass('p-DataGrid-viewport');
    this._vScrollBar.addClass('p-DataGrid-scrollBar');
    this._hScrollBar.addClass('p-DataGrid-scrollBar');
    this._cornerWidget.addClass('p-DataGrid-cornerWidget');

    // Set the layout cell configs for the child widgets.
    GridLayout.setCellConfig(this._viewport, { row: 0, col: 0 });
    GridLayout.setCellConfig(this._vScrollBar, { row: 0, col: 1 });
    GridLayout.setCellConfig(this._hScrollBar, { row: 1, col: 0 });
    GridLayout.setCellConfig(this._cornerWidget, { row: 1, col: 1 });

    // Create the layout for the data grid.
    let layout = new GridLayout({
      rowCount: 2,
      colCount: 2,
      rowSpacing: 0,
      colSpacing: 0,
      fitPolicy: 'set-no-constraint'
    });

    // Set the stretch factors for the grid.
    layout.setRowStretch(0, 1);
    layout.setColStretch(0, 1);
    layout.setRowStretch(1, 0);
    layout.setColStretch(1, 0);

    // Add the child widgets to the layout.this._
    layout.addWidget(this._viewport);
    layout.addWidget(this._vScrollBar);
    layout.addWidget(this._hScrollBar);
    layout.addWidget(this._cornerWidget);

    // Install the layout on the data grid.
    this.layout = layout
  }

  /**
   * Dispose of the resources held by the widgets.
   */
  dispose(): void {
    // TODO - audit this method.
    super.dispose();
  }

  /**
   * Get the data model for the data grid.
   */
  get model(): DataModel | null {
    return this._viewport.model;
  }

  /**
   * Set the data model for the data grid.
   */
  set model(value: DataModel | null) {
    this._viewport.model = value;
  }

  /**
   * Get the row striping for the data grid.
   */
  get rowStriping(): ISectionStriping | null {
    return this._viewport.rowStriping;
  }

  /**
   * Set the row striping for the data grid.
   */
  set rowStriping(value: ISectionStriping | null) {
    this._viewport.rowStriping = value;
  }

  /**
   * Get the column striping for the data grid.
   */
  get colStriping(): ISectionStriping | null {
    return this._viewport.colStriping;
  }

  /**
   * Set the column striping for the data grid.
   */
  set colStriping(value: ISectionStriping | null) {
    this._viewport.colStriping = value;
  }

  /**
   * Scroll the grid up by one visible page.
   */
  pageUp(): void {
    this._viewport.scrollY -= this._viewport.pageHeight;
    this._syncScrollBarsWithViewport();
  }

  /**
   * Scroll the grid down by one visible page.
   */
  pageDown(): void {
    let y = this._viewport.scrollY + this._viewport.pageHeight;
    let maxY = this._viewport.scrollHeight - this._viewport.pageHeight;
    this._viewport.scrollY = Math.min(y, maxY);
    this._syncScrollBarsWithViewport();
  }

  /**
   * Scroll the grid left by one visible page.
   */
  pageLeft(): void {
    this._viewport.scrollX -= this._viewport.pageWidth;
    this._syncScrollBarsWithViewport();
  }

  /**
   * Scroll the grid right by one visible page.
   */
  pageRight(): void {
    let x = this._viewport.scrollX + this._viewport.pageWidth;
    let maxX = this._viewport.scrollWidth - this._viewport.pageWidth;
    this._viewport.scrollX = Math.min(x, maxX);
    this._syncScrollBarsWithViewport();
  }

  /**
   * Scroll the grid up by one visible step.
   */
  stepUp(): void {
    let row = this._viewport.rowIndex(this._viewport.scrollY - 1);
    if (row === -1) {
      this._viewport.scrollY = 0;
    } else {
      this._viewport.scrollY = Math.max(0, this._viewport.rowOffset(row));
    }
    this._syncScrollBarsWithViewport();
  }

  /**
   * Scroll the grid down by one visible step.
   */
  stepDown(): void {
    let maxY = this._viewport.scrollHeight - this._viewport.pageHeight;
    let row = this._viewport.rowIndex(this._viewport.scrollY);
    if (row === -1) {
      this._viewport.scrollY = maxY;
    } else {
      let y = this._viewport.rowOffset(row);
      let s = this._viewport.rowSize(row);
      this._viewport.scrollY = Math.min(y + s, maxY);
    }
    this._syncScrollBarsWithViewport();
  }

  /**
   * Scroll the grid left by one visible step.
   */
  stepLeft(): void {
    let col = this._viewport.colIndex(this._viewport.scrollX - 1);
    if (col === -1) {
      this._viewport.scrollX = 0;
    } else {
      this._viewport.scrollX = this._viewport.colOffset(col);
    }
    this._syncScrollBarsWithViewport();
  }

  /**
   * Scroll the grid right by one visible step.
   */
  stepRight(): void {
    let maxX = this._viewport.scrollWidth - this._viewport.pageWidth;
    let col = this._viewport.colIndex(this._viewport.scrollX);
    if (col === -1) {
      this._viewport.scrollX = maxX;
    } else {
      let x = this._viewport.colOffset(col);
      let s = this._viewport.colSize(col);
      this._viewport.scrollX = Math.min(x + s, maxX);
    }
    this._syncScrollBarsWithViewport();
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   */
  processMessage(msg: Message): void {
    // Ignore child show/hide messages, as the datagrid strictly
    // handles the visibility of its children and any layout fit
    // which may be needed as a result of the visibility change.
    if (msg.type === 'child-shown' || msg.type === 'child-hidden') {
      return;
    }

    // Handle the debounced viewport sync request.
    if (msg.type === 'sync-viewport-request') {
      this._syncViewportWithScrollBars();
      return;
    }

    // Process all other messages as normal.
    super.processMessage(msg);
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    // Update the visibility of the scroll bars. If the visibility
    // of either scroll bar changes, a synchronous fit will occur.
    this._updateScrollBarVisibility();

    // Clamp the viewport scroll position for the new size.
    this._clampViewportScrollPosition();

    // Synchronize the scroll bars with the viewport scroll.
    this._syncScrollBarsWithViewport();
  }

  /**
   * Update the scroll bar visibility based on the viewport size.
   *
   * #### Notes
   * If the visibility of either scroll bar changes, a synchronous
   * fit will be dispatched to immediately resize the viewport.
   */
  private _updateScrollBarVisibility(): void {
    // Fetch the viewport dimensions.
    let sw = this._viewport.scrollWidth;
    let sh = this._viewport.scrollHeight;
    let pw = this._viewport.pageWidth;
    let ph = this._viewport.pageHeight;

    // Get the current scroll bar visibility.
    let hasVScroll = !this._vScrollBar.isHidden;
    let hasHScroll = !this._hScrollBar.isHidden;

    // TODO cache these...
    let vsw = ElementExt.sizeLimits(this._vScrollBar.node).minWidth;
    let hsw = ElementExt.sizeLimits(this._hScrollBar.node).minHeight;

    // Get the page size as if no scroll bars are visible.
    let apw = pw + (hasVScroll ? vsw : 0);
    let aph = ph + (hasHScroll ? hsw : 0);

    // Test whether scroll bars are needed for the adjusted size.
    let needVScroll = aph < sh;
    let needHScroll = apw < sw;

    // Re-test the horizontal scroll if a vertical scroll is needed.
    if (needVScroll && !needHScroll) {
      needHScroll = (apw - vsw) < sw;
    }

    // Re-test the vertical scroll if a horizontal scroll is needed.
    if (needHScroll && !needVScroll) {
      needVScroll = (aph - hsw) < sh;
    }

    // Bail if neither scroll bar visibility will change.
    if (needVScroll === hasVScroll && needHScroll === hasHScroll) {
      return;
    }

    // Update the visibility of the scroll bars and corner widget.
    this._vScrollBar.setHidden(!needVScroll);
    this._hScrollBar.setHidden(!needHScroll);
    this._cornerWidget.setHidden(!needVScroll || !needHScroll);

    // Immediately re-fit the data grid to update the layout.
    MessageLoop.sendMessage(this, Widget.Msg.FitRequest);
  }

  /**
   * Clamp the viewport scroll position to the allowable bounds.
   *
   * #### Notes
   * This may cause the viewport to scroll in order to show as much
   * content as possible given the current viewport dimensions.
   */
  private _clampViewportScrollPosition(): void {
    let sw = this._viewport.scrollWidth;
    let sh = this._viewport.scrollHeight;
    let pw = this._viewport.pageWidth;
    let ph = this._viewport.pageHeight;
    let sx = Math.max(0, Math.min(this._viewport.scrollX, sw - pw));
    let sy = Math.max(0, Math.min(this._viewport.scrollY, sh - ph));
    this._viewport.scrollTo(sx, sy);
  }

  /**
   * Synchronize the scroll bars with the viewport scroll parameters.
   */
  private _syncScrollBarsWithViewport(): void {
    let sx = this._viewport.scrollX;
    let sy = this._viewport.scrollY;
    let sw = this._viewport.scrollWidth;
    let sh = this._viewport.scrollHeight;
    let pw = this._viewport.pageWidth;
    let ph = this._viewport.pageHeight;
    this._hScrollBar.maximum = sw - pw;
    this._vScrollBar.maximum = sh - ph;
    this._hScrollBar.page = pw;
    this._vScrollBar.page = ph;
    this._hScrollBar.value = sx;
    this._vScrollBar.value = sy;
  }

  /**
   * Synchronize the viewport scroll position with the scroll bars.
   */
  private _syncViewportWithScrollBars(): void {
    let scrollX = this._viewport.scrollX;
    let scrollY = this._viewport.scrollY;
    if (!this._hScrollBar.isHidden) {
      scrollX = this._hScrollBar.value;
    }
    if (!this._vScrollBar.isHidden) {
      scrollY = this._vScrollBar.value;
    }
    this._viewport.scrollTo(scrollX, scrollY);
  }

  /**
   * Handle the `thumbMoved` signal from a scroll bar.
   */
  private _onThumbMoved(sender: ScrollBar): void {
    MessageLoop.postMessage(this, Private.SyncViewportRequest);
  }

  /**
   * Handle the `pageRequested` signal from a scroll bar.
   */
  private _onPageRequested(sender: ScrollBar, dir: 'decrement' | 'increment'): void {
    if (sender === this._vScrollBar) {
      if (dir === 'decrement') {
        this.pageUp();
      } else {
        this.pageDown();
      }
    } else {
      if (dir === 'decrement') {
        this.pageLeft();
      } else {
        this.pageRight();
      }
    }
  }

  /**
   * Handle the `stepRequested` signal from a scroll bar.
   */
  private _onStepRequested(sender: ScrollBar, dir: 'decrement' | 'increment'): void {
    if (sender === this._vScrollBar) {
      if (dir === 'decrement') {
        this.stepUp();
      } else {
        this.stepDown();
      }
    } else {
      if (dir === 'decrement') {
        this.stepLeft();
      } else {
        this.stepRight();
      }
    }
  }

  private _viewport: GridViewport;
  private _vScrollBar: ScrollBar;
  private _hScrollBar: ScrollBar;
  private _cornerWidget: Widget;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A singleton `sync-viewport-request` conflatable message.
   */
  export
  const SyncViewportRequest = new ConflatableMessage('sync-viewport-request');
}
