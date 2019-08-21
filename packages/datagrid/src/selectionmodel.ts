/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  IIterator
} from '@phosphor/algorithm';

import {
  DataModel
} from './datamodel';


/**
 * An object which provides selection regions for a data grid.
 *
 * #### Notes
 * If the predefined selection models are insufficient for a particular
 * use case, a custom model can be defined which derives from this class.
 */
export
abstract class SelectionModel {
  /**
   * A signal emitted when the selection model has changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   *
   */
  abstract cursor(): SelectionModel.ICursor | null;

  /**
   * Get an iterator of the selected regions in the model.
   *
   * @returns A new iterator of selected regions in the model.
   *
   * #### Notes
   * The data grid will render the selections in order.
   */
  abstract regions(): IIterator<SelectionModel.IRegion>;

  /**
   *
   */
  abstract isRowSelected(row: number): void;

  /**
   *
   */
  abstract isColumnSelected(column: number): void;

  /**
   *
   */
  abstract isCellSelected(row: number, column: number): void;

  /**
   *
   */
  abstract handleMouseEvent(args: SelectionModel.MouseEventArgs): void;

  /**
   *
   */
  abstract handleKeyEvent(args: SelectionModel.KeyEventArgs): void;

  /**
   * Emit the `changed` signal for the selection model.
   *
   * #### Notes
   * Subclasses should call this method whenever the selection model
   * has changed so that attached data grids can update themselves.
   */
  protected emitChanged(): void {
    this._changed.emit(undefined);
  }

  private _changed = new Signal<this, void>(this);
}


/**
 * The namespace for the `SelectionModel` class statics.
 */
export
namespace SelectionModel {
  /**
   *
   */
  export
  interface ICursor {
    /**
     *
     */
    readonly row: number;

    /**
     *
     */
    readonly column: number;
  }

  /**
   *
   */
  export
  interface IRegion {
    /**
     *
     */
    readonly firstRow: number;

    /**
     *
     */
    readonly firstColumn: number;

    /**
     *
     */
    readonly lastRow: number;

    /**
     *
     */
    readonly lastColumn: number;
  }

  /**
   *
   */
  export
  type MouseEventArgs = {
    /**
     *
     */
    type: 'mousedown' | 'mousemove' | 'mouseup';

    /**
     *
     */
    region: DataModel.CellRegion;

    /**
     *
     */
    row: number;

    /**
     *
     */
    column: number;

    /**
     *
     */
    firstVisibleRow: number;

    /**
     *
     */
    firstVisibleColumn: number;

    /**
     *
     */
    lastVisibleRow: number;

    /**
     *
     */
    lastVisibleColumn: number;

    /**
     *
     */
    shiftKey: boolean;

    /**
     *
     */
    ctrlKey: boolean;
  };

  /**
   *
   */
  export
  type KeyEventArgs = {
    /**
     *
     */
    key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'PageUp' | 'PageDown';

    /**
     *
     */
    firstVisibleRow: number;

    /**
     *
     */
    firstVisibleColumn: number;

    /**
     *
     */
    lastVisibleRow: number;

    /**
     *
     */
    lastVisibleColumn: number;

    /**
     *
     */
    shiftKey: boolean;

    /**
     *
     */
    ctrlKey: boolean;
  };
}
