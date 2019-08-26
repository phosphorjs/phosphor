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

import {
  EventHandler
} from "./eventhandler";


/**
 * A basic implementation of a data grid key handler.
 *
 * #### Notes
 * This class may be subclassed and customized as needed.
 */
export
class BasicKeyHandler implements EventHandler.IKeyHandler {
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

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Fetch the selection model.
    let smdl = grid.selectionModel;

    // Set the bit flags for the relevant state.
    let flags = (ctrl ? 0x1 : 0) & (shift ? 0x2 : 0) & (smdl ? 0x4 : 0);

    //
    let r = grid.cursorRow;
    let c = grid.cursorColumn;
    let nr = grid.rowCount('body');
    let nc = grid.columnCount('body');

    // Dispatch based on the flags.
    switch (flags) {
    case 0x0: // !ctrl, !shift, !sm
      grid.moveCursor(r, c - 1);
      grid.scrollToCursor();
      break;
    case 0x1: // ctrl, !shift, !sm
      grid.moveCursor(r, 0);
      grid.scrollToCursor();
      break;
    case 0x2: // !ctrl, shift, !sm
      grid.moveCursor(r, c - 1);
      grid.scrollToCursor();
      break;
    case 0x3: // ctrl, shift, !sm
      grid.moveCursor(r, 0);
      grid.scrollToCursor();
      break;
    case 0x4: // !ctrl, !shift, sm
      smdl!.select({ clear: 'all', r1: r, c1: c, r2: r, c2: c - 1 });
      grid.moveCursor(r, c - 1);
      grid.scrollToCursor();
      break;
    case 0x5: // ctrl, !shift, sm
      smdl!.select({ clear: 'all', r1: r, c1: 0, r2: r, c2: 0 });
      grid.moveCursor(r, c - 1);
      grid.scrollToCursor();
      break;
    case 0x6: // !ctrl, shift, sm
      break;
    case 0x7: // ctrl, shift, sm
      break;
    default:
      throw 'unreachable';
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

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Fetch the selection model.
    let smdl = grid.selectionModel;

    // Set the bit flags for the relevant state.
    let flags = (ctrl ? 0x1 : 0) & (shift ? 0x2 : 0) & (smdl ? 0x4 : 0);

    // Dispatch based on the flags.
    switch (flags) {
    case 0x0: // !ctrl, !shift, !sm
      grid.moveCursor(grid.cursorRow, grid.cursorColumn + 1);
      grid.scrollToCursor();
      break;
    case 0x1: // ctrl, !shift, !sm
      grid.moveCursor(grid.cursorRow, grid.columnCount('body') - 1);
      grid.scrollToCursor();
      break;
    case 0x2: // !ctrl, shift, !sm
      grid.moveCursor(grid.cursorRow, grid.cursorColumn + 1);
      grid.scrollToCursor();
      break;
    case 0x3: // ctrl, shift, !sm
      grid.moveCursor(grid.cursorRow, grid.columnCount('body') - 1);
      grid.scrollToCursor();
      break;
    case 0x4: // !ctrl, !shift, sm
      break;
    case 0x5: // ctrl, !shift, sm
      break;
    case 0x6: // !ctrl, shift, sm
      break;
    case 0x7: // ctrl, shift, sm
      break;
    default:
      throw 'unreachable';
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

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Fetch the selection model.
    let smdl = grid.selectionModel;

    // Set the bit flags for the relevant state.
    let flags = (ctrl ? 0x1 : 0) & (shift ? 0x2 : 0) & (smdl ? 0x4 : 0);

    //
    let r = grid.cursorRow;
    let c = grid.cursorColumn;
    let nr = grid.rowCount('body');
    let nc = grid.columnCount('body');

    // Dispatch based on the flags.
    switch (flags) {
    case 0x0: // !ctrl, !shift, !sm
      grid.moveCursor(grid.cursorRow - 1, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x1: // ctrl, !shift, !sm
      grid.moveCursor(0, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x2: // !ctrl, shift, !sm
      grid.moveCursor(grid.cursorRow - 1, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x3: // ctrl, shift, !sm
      grid.moveCursor(0, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x4: // !ctrl, !shift, sm

      break;
    case 0x5: // ctrl, !shift, sm
      break;
    case 0x6: // !ctrl, shift, sm
      break;
    case 0x7: // ctrl, shift, sm
      break;
    default:
      throw 'unreachable';
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

    // Fetch the modifier flags.
    let ctrl = event.ctrlKey;
    let shift = event.shiftKey;

    // Fetch the selection model.
    let smdl = grid.selectionModel;

    // Set the bit flags for the relevant state.
    let flags = (ctrl ? 0x1 : 0) & (shift ? 0x2 : 0) & (smdl ? 0x4 : 0);

    // Dispatch based on the flags.
    switch (flags) {
    case 0x0: // !ctrl, !shift, !sm
      grid.moveCursor(grid.cursorRow + 1, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x1: // ctrl, !shift, !sm
      grid.moveCursor(grid.rowCount('body') - 1, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x2: // !ctrl, shift, !sm
      grid.moveCursor(grid.cursorRow + 1, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x3: // ctrl, shift, !sm
      grid.moveCursor(grid.rowCount('body') - 1, grid.cursorColumn);
      grid.scrollToCursor();
      break;
    case 0x4: // !ctrl, !shift, sm
      break;
    case 0x5: // ctrl, !shift, sm
      break;
    case 0x6: // !ctrl, shift, sm
      break;
    case 0x7: // ctrl, shift, sm
      break;
    default:
      throw 'unreachable';
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
    event.preventDefault();
    event.stopPropagation();
    grid.scrollByPage('up');
  }

  /**
   * Handle the `'PageDown'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onPageDown(grid: DataGrid, event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    grid.scrollByPage('down');
  }

  private _disposed = false;
}
