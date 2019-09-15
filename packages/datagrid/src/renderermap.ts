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
  CellRenderer
} from './cellrenderer';

import {
  DataModel
} from './datamodel';

import {
  TextRenderer
} from './textrenderer';


/**
 * A class which manages the mapping of cell renderers.
 */
export
class RendererMap {
  /**
   * Construct a new renderer map.
   *
   * @param values - The initial values for the map.
   *
   * @param fallback - The renderer of last resort.
   */
  constructor(values: RendererMap.Map = {}, fallback?: CellRenderer) {
    this._values = { ...values };
    this._fallback = fallback || new TextRenderer();
  }

  /**
   * A signal emitted when the renderer map has changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * Get the cell renderer to use for the given cell config.
   *
   * @param config - The cell config of interest.
   *
   * @returns The renderer to use for the cell.
   */
  get(config: CellRenderer.CellConfig): CellRenderer {
    // Fetch the renderer from the values map.
    let renderer = this._values[config.region];

    // Execute a resolver function if necessary.
    if (typeof renderer === 'function') {
      try {
        renderer = renderer(config);
      } catch (err) {
        renderer = undefined;
        console.error(err);
      }
    }

    // Return the renderer or the fallback.
    return renderer || this._fallback;
  }

  /**
   * Update the renderer map with new values
   *
   * @param values - The updated values for the map.
   *
   * @param fallback - The renderer of last resort.
   *
   * #### Notes
   * This method always emits the `changed` signal.
   */
  update(values: RendererMap.Map = {}, fallback?: CellRenderer): void {
    this._values = { ...this._values, ...values };
    this._fallback = fallback || this._fallback;
    this._changed.emit(undefined);
  }

  private _fallback: CellRenderer
  private _values: RendererMap.Map;
  private _changed = new Signal<this, void>(this);
}


/**
 * The namespace for the `RendererMap` class statics.
 */
export
namespace RendererMap {
  /**
   * A type alias for a cell renderer resolver function.
   */
  export
  type Resolver = (config: CellRenderer.CellConfig) => CellRenderer | undefined;

  /**
   * A type alias for a `RendererMap` value type.
   */
  export
  type Value = Resolver | CellRenderer | undefined;

  /**
   * A type alias for a `RendererMap` map type.
   */
  export
  type Map = { [R in DataModel.CellRegion]?: Value };
}
