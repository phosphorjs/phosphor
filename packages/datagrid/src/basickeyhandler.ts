/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  getKeyboardLayout
} from '@phosphor/keyboard';

import {
  DataGrid
} from './datagrid';


/**
 * A basic implementation of a data grid key handler.
 *
 * #### Notes
 * This class may be subclassed and customized as needed.
 */
export
class BasicKeyHandler implements DataGrid.IKeyHandler {
  /**
   * Whether the key handler is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose of the resources held by the key handler.
   */
  dispose(): void {
    this._disposed = true;
  }

  /**
   * Handle the key down event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keydown event of interest.
   *
   * #### Notes
   * This will not be called if the mouse button is pressed.
   */
  onKeyDown(grid: DataGrid, event: KeyboardEvent): void {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
    case 'ArrowLeft':
      this.onArrowLeft(grid, event);
      break;
    case 'ArrowRight':
      this.onArrowRight(grid, event);
      break;
    case 'ArrowUp':
      this.onArrowUp(grid, event);
      break;
    case 'ArrowDown':
      this.onArrowDown(grid, event);
      break;
    case 'PageUp':
      this.onPageUp(grid, event);
      break;
    case 'PageDown':
      this.onPageDown(grid, event);
      break;
    }
  }

  /**
   * Handle the `'ArrowLeft'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowLeft(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Handle no model with the ctrl modifier.
    if (!model && ctrl) {
      grid.scrollTo(0, grid.scrollY);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('left');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the row selection mode with ctrl key.
    if (mode === 'row' && ctrl) {
      grid.scrollTo(0, grid.scrollY);
      return;
    }

    // Handle the row selection mode with no modifier. (ignore shift)
    if (mode === 'row') {
      grid.scrollByStep('left');
      return;
    }

    // Fetch the cursor row and column.
    let r = model.cursorRow;
    let c = model.cursorColumn;

    // Dispatch based on the modifier keys.
    if (ctrl && shift) {
      model.resizeBy(0, -Infinity);
    } else if (shift) {
      model.resizeBy(0, -1);
    } else if (ctrl) {
      model.select({ r1: r, r2: r, c1: 0, c2: 0, clear: 'all' });
    } else {
      model.select({ r1: r, r2: r, c1: c - 1, c2: c - 1, clear: 'all' });
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift) {
      grid.scrollToColumn(cs.c2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'ArrowRight'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowRight(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Handle no model with the ctrl modifier.
    if (!model && ctrl) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('right');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the row selection model with ctrl key.
    if (mode === 'row' && ctrl) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY);
      return;
    }

    // Handle the row selection mode with no modifier. (ignore shift)
    if (mode === 'row') {
      grid.scrollByStep('right');
      return;
    }

    // Fetch the cursor row and column.
    let r = model.cursorRow;
    let c = model.cursorColumn;

    // Dispatch based on the modifier keys.
    if (ctrl && shift) {
      model.resizeBy(0, Infinity);
    } else if (shift) {
      model.resizeBy(0, 1);
    } else if (ctrl) {
      model.select({ r1: r, r2: r, c1: Infinity, c2: Infinity, clear: 'all' });
    } else {
      model.select({ r1: r, r2: r, c1: c + 1, c2: c + 1, clear: 'all' });
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift) {
      grid.scrollToColumn(cs.c2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'ArrowUp'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowUp(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Handle no model with the ctrl modifier.
    if (!model && ctrl) {
      grid.scrollTo(grid.scrollX, 0);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('up');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the column selection mode with ctrl key.
    if (mode === 'column' && ctrl) {
      grid.scrollTo(grid.scrollX, 0);
      return;
    }

    // Handle the column selection mode with no modifier. (ignore shift)
    if (mode === 'column') {
      grid.scrollByStep('up');
      return;
    }

    // Fetch the cursor row and column.
    let r = model.cursorRow;
    let c = model.cursorColumn;

    // Dispatch based on the modifier keys.
    if (ctrl && shift) {
      model.resizeBy(-Infinity, 0);
    } else if (shift) {
      model.resizeBy(-1, 0);
    } else if (ctrl) {
      model.select({ r1: 0, r2: 0, c1: c, c2: c, clear: 'all' });
    } else {
      model.select({ r1: r - 1, r2: r - 1, c1: c, c2: c, clear: 'all' });
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift) {
      grid.scrollToRow(cs.r2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'ArrowDown'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowDown(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Handle no model with the ctrl modifier.
    if (!model && ctrl) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('down');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the column selection mode with ctrl key.
    if (mode === 'column' && ctrl) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY);
      return;
    }

    // Handle the column selection mode with no modifier. (ignore shift)
    if (mode === 'column') {
      grid.scrollByStep('down');
      return;
    }

    // Fetch the cursor row and column.
    let r = model.cursorRow;
    let c = model.cursorColumn;

    // Dispatch based on the modifier keys.
    if (ctrl && shift) {
      model.resizeBy(Infinity, 0);
    } else if (shift) {
      model.resizeBy(1, 0);
    } else if (ctrl) {
      model.select({ r1: Infinity, r2: Infinity, c1: c, c2: c, clear: 'all' });
    } else {
      model.select({ r1: r + 1, r2: r + 1, c1: c, c2: c, clear: 'all' });
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift) {
      grid.scrollToRow(cs.r2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'PageUp'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onPageUp(grid: DataGrid, event: KeyboardEvent): void {
    // Ignore the event if the ctrl key is pressed.
    if (event.ctrlKey) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Scroll by page if there is no selection model.
    if (!model || model.selectionMode === 'column') {
      grid.scrollByPage('up');
      return;
    }

    // Set up the row and column variables.
    let r = Math.max(0, model.cursorRow);
    let c = Math.max(0, model.cursorColumn);

    // Get the normal number of cells in the page height.
    let n =  Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Select or resize as needed.
    if (event.shiftKey) {
      model.resizeBy(-n, 0);
    } else {
      model.select({ r1: r - n, r2: r - n, c1: c, c2: c, clear: 'all' });
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (event.shiftKey) {
      grid.scrollToRow(cs.r2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'PageDown'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onPageDown(grid: DataGrid, event: KeyboardEvent): void {
    // Ignore the event if the ctrl key is pressed.
    if (event.ctrlKey) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Scroll by page if there is no selection model.
    if (!model || model.selectionMode === 'column') {
      grid.scrollByPage('down');
      return;
    }

    // Set up the row and column variables.
    let r = Math.max(0, model.cursorRow);
    let c = Math.max(0, model.cursorColumn);

    // Get the normal number of cells in the page height.
    let n =  Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Select or resize as needed.
    if (event.shiftKey) {
      model.resizeBy(n, 0);
    } else {
      model.select({ r1: r + n, r2: r + n, c1: c, c2: c, clear: 'all' });
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (event.shiftKey) {
      grid.scrollToRow(cs.r2);
    } else {
      grid.scrollToCursor();
    }
  }

  private _disposed = false;
}
