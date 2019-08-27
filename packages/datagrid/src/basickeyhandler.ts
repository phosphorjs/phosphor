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

    // Set up the row and column variables.
    let row = model ? model.cursorRow : 0;
    let column = model ? model.cursorColumn : 0;

    // Dispatch based on the modifier keys.
    if (!model && ctrl) {
      grid.scrollTo(0, grid.scrollY);
    } else if (!model) {
      grid.scrollByStep('left');
    } else if (ctrl && shift) {
      let sel = model.resizeBy(0, -Infinity);
      if (sel) grid.scrollToColumn(sel.c2);
    } else if (shift) {
      let sel = model.resizeBy(0, -1);
      if (sel) grid.scrollToColumn(sel.c2);
    } else if (ctrl) {
      model.clear();
      model.select(row, 0);
      grid.scrollToCursor();
    } else {
      model.clear();
      model.select(row, column - 1);
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

    // Set up the row and column variables.
    let row = model ? model.cursorRow : 0;
    let column = model ? model.cursorColumn : 0;

    // Dispatch based on the modifier keys.
    if (!model && ctrl) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY);
    } else if (!model) {
      grid.scrollByStep('right');
    } else if (ctrl && shift) {
      let sel = model.resizeBy(0, Infinity);
      if (sel) grid.scrollToColumn(sel.c2);
    } else if (shift) {
      let sel = model.resizeBy(0, 1);
      if (sel) grid.scrollToColumn(sel.c2);
    } else if (ctrl) {
      model.clear();
      model.select(row, Infinity);
      grid.scrollToCursor();
    } else {
      model.clear();
      model.select(row, column + 1);
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

    // Set up the row and column variables.
    let row = model ? model.cursorRow : 0;
    let column = model ? model.cursorColumn : 0;

    // Dispatch based on the modifier keys.
    if (!model && ctrl) {
      grid.scrollTo(grid.scrollX, 0);
    } else if (!model) {
      grid.scrollByStep('up');
    } else if (ctrl && shift) {
      let sel = model.resizeBy(-Infinity, 0);
      if (sel) grid.scrollToRow(sel.r2);
    } else if (shift) {
      let sel = model.resizeBy(-1, 0);
      if (sel) grid.scrollToRow(sel.r2);
    } else if (ctrl) {
      model.clear();
      model.select(0, column);
      grid.scrollToCursor();
    } else {
      model.clear();
      model.select(row - 1, column);
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

    // Set up the row and column variables.
    let row = model ? model.cursorRow : 0;
    let column = model ? model.cursorColumn : 0;

    // Dispatch based on the modifier keys.
    if (!model && ctrl) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY);
    } else if (!model) {
      grid.scrollByStep('down');
    } else if (ctrl && shift) {
      let sel = model.resizeBy(Infinity, 0);
      if (sel) grid.scrollToRow(sel.r2);
    } else if (shift) {
      let sel = model.resizeBy(1, 0);
      if (sel) grid.scrollToRow(sel.r2);
    } else if (ctrl) {
      model.clear();
      model.select(Infinity, column);
      grid.scrollToCursor();
    } else {
      model.clear();
      model.select(row + 1, column);
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
    if (!model) {
      grid.scrollByPage('up');
      return;
    }

    // Set up the row and column variables.
    let row = model.cursorRow;
    let column = model.cursorColumn;

    // Get the normal number of cells in the page height.
    let n =  Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Select or resize as needed.
    if (event.shiftKey) {
      let sel = model.resizeBy(-n, 0);
      if (sel) grid.scrollToRow(sel.r2);
    } else {
      model.clear();
      model.select(row - n, column);
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
    if (!model) {
      grid.scrollByPage('down');
      return;
    }

    // Set up the row and column variables.
    let row = model.cursorRow;
    let column = model.cursorColumn;

    // Get the normal number of cells in the page height.
    let n =  Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Select or resize as needed.
    if (event.shiftKey) {
      let sel = model.resizeBy(n, 0);
      if (sel) grid.scrollToRow(sel.r2);
    } else {
      model.clear();
      model.select(row + n, column);
      grid.scrollToCursor();
    }
  }

  private _disposed = false;
}
