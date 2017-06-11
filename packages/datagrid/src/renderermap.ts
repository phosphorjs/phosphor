/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  CellRenderer
} from './cellrenderer';

import {
  DataModel
} from './datamodel';


/**
 * An object which manages a mapping of cell renderers.
 *
 * #### Notes
 * This class is used to configure cell renderers for a data grid.
 */
export
class RendererMap {
  /**
   * Construct a new renderer map.
   *
   * @param options - The options for initializing the map.
   */
  constructor(options: RendererMap.IOptions = {}) {
    this._ranks = Private.createRankMap(options.priority || []);
  }

  /**
   * A signal emitted when the map contents are changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * Get the cell renderer to use for the given region and metadata.
   *
   * @param region - The cell region of interest.
   *
   * @param metadata - The data model metadata for the region.
   *
   * @returns The best matching cell renderer, or `undefined`.
   *
   * #### Notes
   * Non-string metadata values are ignored.
   */
  get(region: DataModel.CellRegion, metadata: DataModel.Metadata): CellRenderer | undefined {
    // Iterate through the map entries to find the best cell renderer.
    for (let i = 0, n = this._entries.length; i < n; ++i) {
      // Create the key for the current entry.
      let key = this._entries[i].createKey(metadata);

      // Skip the entry if no key could be generated.
      if (key === undefined) {
        continue;
      }

      // Prepend the region to the key.
      key = `${region}|${key}`;

      // Look up the renderer for the generated key.
      let renderer = this._renderers[key];

      // If the renderer exists, it is the best match.
      if (renderer !== undefined) {
        return renderer;
      }
    }

    // Return `undefined` to indicate no match.
    return undefined;
  }

  /**
   * Set the cell renderer for a particular region and metadata.
   *
   * @param region - The cell region of interest.
   *
   * @param metadata - The metadata to match against the model.
   *
   * @param renderer - The cell renderer to set in the map.
   *
   * #### Notes
   * The keys and values in the supplied metadata are matched against
   * the metadata supplied by the data model. The given metadata must
   * be an exact matching subset of the model metadata in order for
   * there to be a match.
   *
   * Matches are ranked according the number of matched values, with
   * ties broken based on the priorty order given to the constructor.
   *
   * Non-string metadata values are ignored.
   */
  set(region: DataModel.CellRegion, metadata: DataModel.Metadata, renderer: CellRenderer): void {
    // Create a new map entry for the metadata.
    let entry = Private.MapEntry.create(metadata, this._ranks);

    // Find the insert location for the entry.
    let i = ArrayExt.lowerBound(this._entries, entry, (a, b) => {
      return Private.MapEntry.cmp(a, b, this._ranks);
    });

    // Add the entry to the array if needed.
    if (i === this._entries.length) {
      this._entries.push(entry);
    } else if (!Private.MapEntry.equal(entry, this._entries[i])) {
      ArrayExt.insert(this._entries, i, entry);
    }

    // Create the key for the entry.
    let key = entry.createKey(metadata);

    // Prepend the region to the key.
    key = `${region}|${key}`;

    // Add the new renderer to the map.
    this._renderers[key] = renderer;

    // Emit the changed signal.
    this._changed.emit(undefined);
  }

  /**
   * Remove all custom cell renderers from the map.
   */
  clear(): void {
    this._entries = [];
    this._renderers = Object.create(null);
    this._changed.emit(undefined);
  }

  private _ranks: Private.RankMap;
  private _entries: Private.MapEntry[] = [];
  private _changed = new Signal<this, void>(this);
  private _renderers: { [key: string]: CellRenderer } = Object.create(null);
}


/**
 * The namespace for the `RendererMap` class statics.
 */
export
namespace RendererMap {
  /**
   * An options object for initializing a renderer map.
   */
  export
  interface IOptions {
    /**
     * The priority of the metadata keys used for matching.
     *
     * Keys at the front of the array have a higher priority. Metadata
     * keys which are not included in the array are ordered by locale.
     *
     * The default is `[]`.
     */
    priority?: string[];
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for a mapping of key -> rank.
   */
  export
  type RankMap = { [key: string]: number };

  /**
   * Create a rank map from a priority key array.
   */
  export
  function createRankMap(priority: string[]): RankMap {
    let ranks: RankMap = Object.create(null);
    for (let i = 0, n = priority.length; i < n; ++i) {
      ranks[priority[i]] = i;
    }
    return ranks;
  }

  /**
   * An entry in a cell renderer map.
   */
  export
  class MapEntry {
    /**
     * Create a new map entry.
     *
     * @param metadata - The metadata which will be used as the key
     *  for matching against the model metadata.
     *
     * @param ranks - The priority ranks for the metadata keys.
     *
     * @returns A new map entry for the given metadata key.
     */
    static create(metadata: DataModel.Metadata, ranks: RankMap): MapEntry {
      // Extra the string-valued keys from the metadata.
      let keys: string[] = [];
      for (let key in metadata) {
        if (typeof metadata[key] === 'string') {
          keys.push(key);
        }
      }

      // Sort the keys based on rank and locale.
      keys.sort((k1, k2) => {
        let r1 = ranks[k1];
        let r2 = ranks[k2];
        if (r1 !== undefined && r2 !== undefined) {
          return r1 - r2;
        }
        if (r2 === undefined) {
          return -1;
        }
        if (r1 === undefined) {
          return 1;
        }
        return k1.localeCompare(k2);
      });

      // Create an return a new map entry.
      return new MapEntry(keys);
    }

    /**
     * Compare two map entries for relative ordering.
     *
     * @param a - The LHS map entry.
     *
     * @param b - The RHS map entry.
     *
     * @param ranks - The priority ranks for the metadata keys.
     *
     * @returns `< 0` if `a < b`, `> 0` if `a > b`, or `0` if `a = b`.
     */
    static cmp(a: MapEntry, b: MapEntry, ranks: RankMap): number {
      // Compare first based on key length.
      let n1 = a._keys.length;
      let n2 = b._keys.length;
      if (n1 !== n2) {
        return n2 - n1;
      }

      // Compare next based on key content.
      for (let i = 0; i < n1; ++i) {
        // Look up the current keys.
        let k1 = a._keys[i];
        let k2 = b._keys[i];

        // Skip if the keys are equal.
        if (k1 === k2) {
          continue;
        }

        // Look up the current ranks.
        let r1 = ranks[k1];
        let r2 = ranks[k2];

        // Use rank order if possible.
        if (r1 !== undefined && r2 !== undefined) {
          return r1 - r2;
        }

        // Handle the case of one key having rank.
        if (r2 === undefined) {
          return -1;
        }
        if (r1 === undefined) {
          return 1;
        }

        // Fall back to locale order.
        return k1.localeCompare(k2);
      }

      // Otherwise, the map entries are equivalent.
      return 0;
    }

    /**
     * Compare two map entries for equality.
     *
     * @param a - The LHS map entry.
     *
     * @param b - The RHS map entry.
     *
     * @returns Whether the two entries are functionally equivalent.
     */
    static equal(a: MapEntry, b: MapEntry): boolean {
      // Bail early if the keys have different length.
      if (a._keys.length !== b._keys.length) {
        return false;
      }

      // Test each key for equality.
      for (let i = 0, n = a._keys.length; i < n; ++i) {
        if (a._keys[i] !== b._keys[i]) {
          return false;
        }
      }

      // Otherwise, the entries are equivalent.
      return true;
    }

    /**
     * Create the renderer map key for a metadata object.
     *
     * @param metadata - The metadata supplied by the data model.
     *
     * @returns The key for the metadata object, or `undefined` if the
     *   metadata is not a valid candidate match for the entry.
     */
    createKey(metadata: DataModel.Metadata): string | undefined {
      // Set up the result variable.
      let result = '';

      // Loop over each key and create the value pairs.
      for (let i = 0, n = this._keys.length; i < n; ++i) {
        // Look up metadata value for the key.
        let key = this._keys[i];
        let value = metadata[key];

        // Bail if the metadata value is not a string.
        if (typeof value !== 'string') {
          return undefined;
        }

        // Add the key/value pair to the result.
        result += `{${key}: ${value}}`;
      }

      // Return the final key.
      return result;
    }

    /**
     * Construct a new map entry from ordered key names.
     */
    private constructor(keys: string[]) {
      this._keys = keys;
    }

    private _keys: string[];
  }
}
