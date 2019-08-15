/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, iter
} from '@phosphor/algorithm';

import {
  DataModel
} from './datamodel';

import {
  SelectionModel
} from './selectionmodel';


/**
 * A selection model implementation for generic data models.
 *
 * #### Notes
 * This selection model is sufficient for most use cases where advanced
 * tracking of data during sorting or filtering is *not* required.
 */
export
class SimpleSelections extends SelectionModel {
  /**
   * Construction a new simple selection model.
   *
   * @param options - The options for constructing the model.
   */
  constructor(options: SimpleSelections.IOptions) {
    super();
    this.model = options.model;
    this.model.changed.connect(this._onModelChanged, this);
  }

  /**
   * The data model associated with the selection model.
   */
  readonly model: DataModel;

  /**
   * Whether the selection model is empty.
   *
   * #### Notes
   * An empty selection model will have an empty regions iterator.
   */
  get isEmpty(): boolean {
    return this._regions.length === 0;
  }

  /**
   * Get an iterator of the selected regions in the model.
   *
   * @returns A new iterator of selected regions in the model.
   */
  regions(): IIterator<SelectionModel.Region> {
    return iter(this._regions);
  }

  /**
   * Select a region in the model.
   *
   * @param region - The region to select in the model.
   */
  select(region: SelectionModel.Region): void {
    // Add the region to the array of selections.
    this._regions.push(region);

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * Deselect a region in the model.
   *
   * @param region - The region to deselect in the model.
   */
  deselect(region: SelectionModel.Region): void {
    // Bail early if the regions array is already empty.
    if (this._regions.length === 0) {
      return;
    }

    // Set up the new regions array.
    let updated: SelectionModel.Region[] = [];

    // Fetch a common variable.
    let Region = SelectionModel.Region;

    // Iterate over the existing regions.
    for (let existing of this._regions) {
      // Skip the existing region if it should be completely removed.
      if (region.includes(existing)) {
        continue;
      }

      // Retain the existing region if the target does not overlap it.
      if (!region.overlaps(existing)) {
        updated.push(existing);
        continue;
      }

      // Save the top of the existing region if needed.
      if (region.row > existing.row) {
        let r1 = existing.row;
        let c1 = existing.column;
        let r2 = region.row - 1;
        let c2 = existing.lastColumn;
        updated.push(new Region(r1, c1, r2 - r1 + 1, c2 - c1 + 1));
      }

      // Save the left side of the existing region if needed.
      if (region.column > existing.column) {
        let r1 = Math.max(existing.row, region.row);
        let c1 = existing.column;
        let r2 = Math.min(existing.lastRow, region.lastRow);
        let c2 = region.column - 1;
        updated.push(new Region(r1, c1, r2 - r1 + 1, c2 - c1 + 1));
      }

      // Save the right side of the existing region if needed.
      if (region.lastColumn < existing.lastColumn) {
        let r1 = Math.max(existing.row, region.row);
        let c1 = region.lastColumn + 1;
        let r2 = Math.min(existing.lastRow, region.lastRow);
        let c2 = existing.lastColumn;
        updated.push(new Region(r1, c1, r2 - r1 + 1, c2 - c1 + 1));
      }

      // Save the bottom of the existing region if needed.
      if (region.lastRow < existing.lastRow) {
        let r1 = region.lastRow + 1;
        let c1 = existing.column;
        let r2 = existing.lastRow;
        let c2 = existing.lastColumn;
        updated.push(new Region(r1, c1, r2 - r1 + 1, c2 - c1 + 1));
      }
    }

    // Store the updated regions.
    this._regions = updated;

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * Clear all regions in the model.
   */
  clear(): void {
    // Bail early if the regions array is already empty.
    if (this._regions.length === 0) {
      return;
    }

    // Clear the regions array.
    this._regions.length = 0;

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * A signal handler for the data model `changed` signal.
   */
  private _onModelChanged(sender: DataModel, args: DataModel.ChangedArgs): void {
    switch (args.type) {
    case 'rows-inserted':
    case 'rows-removed':
      this._onRowsChanged(args);
      break;
    case 'rows-moved':
      this._onRowsMoved(args);
      break;
    case 'columns-inserted':
    case 'columns-removed':
      this._onColumnsChanged(args);
      break;
    case 'columns-moved':
      this._onColumnsMoved(args);
      break;
    case 'model-reset':
      this._onModelReset(args);
      break;
    default:
      break;
    }
  }

  /**
   * A signal handler invoked when rows are inserted or removed.
   */
  private _onRowsChanged(args: DataModel.RowsChangedArgs): void {
    // Bail early if the regions array is already empty.
    if (this._regions.length === 0) {
      return;
    }
  }

  /**
   * A signal handler invoked when rows are moved.
   */
  private _onRowsMoved(args: DataModel.RowsMovedArgs): void {
    // Bail early if the regions array is already empty.
    if (this._regions.length === 0) {
      return;
    }
  }

  /**
   * A signal handler invoked when columns are inserted or removed.
   */
  private _onColumnsChanged(args: DataModel.ColumnsChangedArgs): void {
    // Bail early if the regions array is already empty.
    if (this._regions.length === 0) {
      return;
    }
  }

  /**
   * A signal handler invoked when columns are moved.
   */
  private _onColumnsMoved(args: DataModel.ColumnsMovedArgs): void {
    // Bail early if the regions array is already empty.
    if (this._regions.length === 0) {
      return;
    }
  }

  /**
   * A signal handler invoked when the data model is reset.
   */
  private _onModelReset(args: DataModel.ModelResetArgs): void {
    // Bail early if the regions array is already empty.
    if (this._regions.length === 0) {
      return;
    }

    // Clear the regions array.
    this._regions.length = 0;

    // Emit the changed signal.
    this.emitChanged();
  }

  private _regions: SelectionModel.Region[] = [];
}


/**
 * The namespace for the `SimpleSelections` class statics.
 */
export
namespace SimpleSelections {
  /**
   * An options object for initializing a simple selection model.
   */
  export
  interface IOptions {
    /**
     * The data model to associate with the selection model.
     */
    model: DataModel;
  }
}
