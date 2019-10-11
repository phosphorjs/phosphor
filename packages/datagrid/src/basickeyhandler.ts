/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Platform
} from '@phosphor/domutils';

import {
  getKeyboardLayout
} from '@phosphor/keyboard';

import {
  DataGrid
} from './datagrid';

import {
  SelectionModel
} from './selectionmodel';
import { ICellEditResponse } from './celleditor';

import { MutableDataModel } from './datamodel';


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
    if (!event.shiftKey && !Platform.accelKey(event)) {
      const inp = String.fromCharCode(event.keyCode);
      if (/[a-zA-Z0-9-_ ]/.test(inp)) {
        if (grid.selectionModel) {
          const row = grid.selectionModel.cursorRow;
          const column = grid.selectionModel.cursorColumn;
          if (row != -1 && column != -1) {
            grid.cellEditorController.edit({
              grid: grid,
              row: row,
              column: column,
              metadata: grid.dataModel!.metadata('body', row, column)
            }).then((response: ICellEditResponse) => {
              if (grid.dataModel instanceof MutableDataModel) {
                const dataModel = grid.dataModel as MutableDataModel;
                dataModel.setData('body', row, column, response.value);
              }
              grid.viewport.node.focus();
              if (response.returnPressed) {
                grid.selectionModel!.incrementCursor();
                grid.scrollToCursor();
              }
            });
          }
        }
      }
    }

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
    case 'Escape':
      this.onEscape(grid, event);
      break;
    case 'C':
      this.onKeyC(grid, event);
      break;
    case 'Enter':
      if (grid.selectionModel) {
        grid.selectionModel.incrementCursor();
        grid.scrollToCursor();
      }
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
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
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

    // Handle the row selection mode with accel key.
    if (mode === 'row' && accel) {
      grid.scrollTo(0, grid.scrollY);
      return;
    }

    // Handle the row selection mode with no modifier. (ignore shift)
    if (mode === 'row') {
      grid.scrollByStep('left');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 - 1 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = r;
      r2 = r;
      c1 = 0;
      c2 = 0;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r;
      r2 = r;
      c1 = c - 1;
      c2 = c - 1;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'column') {
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
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
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

    // Handle the row selection model with accel key.
    if (mode === 'row' && accel) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY);
      return;
    }

    // Handle the row selection mode with no modifier. (ignore shift)
    if (mode === 'row') {
      grid.scrollByStep('right');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = Infinity;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 + 1 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = r;
      r2 = r;
      c1 = Infinity;
      c2 = Infinity;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r;
      r2 = r;
      c1 = c + 1;
      c2 = c + 1;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'column') {
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
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
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

    // Handle the column selection mode with accel key.
    if (mode === 'column' && accel) {
      grid.scrollTo(grid.scrollX, 0);
      return;
    }

    // Handle the column selection mode with no modifier. (ignore shift)
    if (mode === 'column') {
      grid.scrollByStep('up');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 - 1 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = 0;
      r2 = 0;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r - 1;
      r2 = r - 1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'row') {
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
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
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

    // Handle the column selection mode with accel key.
    if (mode === 'column' && accel) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY);
      return;
    }

    // Handle the column selection mode with no modifier. (ignore shift)
    if (mode === 'column') {
      grid.scrollByStep('down');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = Infinity;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 + 1 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = Infinity;
      r2 = Infinity;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r + 1;
      r2 = r + 1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'row') {
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
    // Ignore the event if the accel key is pressed.
    if (Platform.accelKey(event)) {
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

    // Get the normal number of cells in the page height.
    let n =  Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Select or resize as needed.
    if (event.shiftKey) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 - n : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else {
      r1 = cs ? cs.r1 - n : 0;
      r2 = r1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    grid.scrollToRow(cs.r2);
  }

  /**
   * Handle the `'PageDown'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onPageDown(grid: DataGrid, event: KeyboardEvent): void {
    // Ignore the event if the accel key is pressed.
    if (Platform.accelKey(event)) {
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

    // Get the normal number of cells in the page height.
    let n =  Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Select or resize as needed.
    if (event.shiftKey) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 + n : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else {
      r1 = cs ? cs.r1 + n : 0;
      r2 = r1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    grid.scrollToRow(cs.r2);
  }

  /**
   * Handle the `'Escape'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onEscape(grid: DataGrid, event: KeyboardEvent): void {
    if (grid.selectionModel) {
      grid.selectionModel.clear();
    }
  }

  /**
   * Handle the `'C'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onKeyC(grid: DataGrid, event: KeyboardEvent): void {
    // Bail early if the modifiers aren't correct for copy.
    if (event.shiftKey || !Platform.accelKey(event)) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Copy the current selection to the clipboard.
    grid.copyToClipboard();
  }

  private _disposed = false;
}
