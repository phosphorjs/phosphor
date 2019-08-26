/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, StringExt
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  Field
} from './field';

import {
  createDuplexId
} from './utilities';


/**
 * A field which represents a collaborative key:value map.
 */
export
class MapField<T extends ReadonlyJSONValue> extends Field<MapField.Value<T>, MapField.Update<T>, MapField.Metadata<T>, MapField.Change<T>, MapField.Patch<T>> {
  /**
   * Construct a new map field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: MapField.IOptions<T> = {}) {
    super(options);
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'map' {
    return 'map';
  }

  /**
   * Create the initial value for the field.
   *
   * @returns The initial value for the field.
   */
  createValue(): MapField.Value<T> {
    return {};
  }

  /**
   * Create the metadata for the field.
   *
   * @returns The metadata for the field.
   */
  createMetadata(): MapField.Metadata<T> {
    return { ids: {}, values: {} };
  }

  /**
   * Apply a user update to the field.
   *
   * @param args - The arguments for the update.
   *
   * @returns The result of applying the update.
   */
  applyUpdate(args: Field.UpdateArgs<MapField.Value<T>, MapField.Update<T>, MapField.Metadata<T>>): Field.UpdateResult<MapField.Value<T>, MapField.Change<T>, MapField.Patch<T>> {
    // Unpack the arguments.
    let { previous, update, metadata, version, storeId } = args;

    // Create the id for the values.
    let id = createDuplexId(version, storeId);

    // Create a clone of the previous value.
    let clone = { ...previous };

    // Set up the previous and current change parts.
    let prev: { [key: string]: T | null } = {};
    let curr: { [key: string]: T | null } = {};

    // Iterate over the update.
    for (let key in update) {
      // Insert the update value into the metadata.
      let value = Private.insertIntoMetadata(metadata, key, id, update[key]);

      // Update the clone with the new value.
      if (value === null) {
        delete clone[key];
      } else {
        clone[key] = value;
      }

      // Update the previous change part.
      prev[key] = key in previous ? previous[key] : null;

      // Update the current change part.
      curr[key] = value;
    }

    // Create the change object.
    let change = { previous: prev, current: curr };

    // Create the patch object.
    let patch = { id, values: update };

    // Return the update result.
    return { value: clone, change, patch };
  }

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  applyPatch(args: Field.PatchArgs<MapField.Value<T>, MapField.Patch<T>, MapField.Metadata<T>>): Field.PatchResult<MapField.Value<T>, MapField.Change<T>> {
    // Unpack the arguments.
    let { previous, patch, metadata } = args;

    // Unpack the patch.
    let { id, values } = patch;

    // Create a clone of the previous value.
    let clone = { ...previous };

    // Set up the previous and current change parts.
    let prev: { [key: string]: T | null } = {};
    let curr: { [key: string]: T | null } = {};

    // Iterate over the values.
    for (let key in values) {
      // Insert the patch value into the metadata.
      let value = Private.insertIntoMetadata(metadata, key, id, values[key]);

      // Update the clone with the new value.
      if (value === null) {
        delete clone[key];
      } else {
        clone[key] = value;
      }

      // Update the previous change part.
      prev[key] = key in previous ? previous[key] : null;

      // Update the current change part.
      curr[key] = value;
    }

    // Create the change object.
    let change = { previous: prev, current: curr };

    // Return the patch result.
    return { value: clone, change };
  }

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  unapplyPatch(args: Field.PatchArgs<MapField.Value<T>, MapField.Patch<T>, MapField.Metadata<T>>): Field.PatchResult<MapField.Value<T>, MapField.Change<T>> {
    // Unpack the arguments.
    let { previous, patch, metadata } = args;

    // Unpack the patch.
    let { id, values } = patch;

    // Create a clone of the previous value.
    let clone = { ...previous };

    // Set up the previous and current change parts.
    let prev: { [key: string]: T | null } = {};
    let curr: { [key: string]: T | null } = {};

    // Iterate over the values.
    for (let key in values) {
      // Insert the patch value into the metadata.
      let value = Private.removeFromMetadata(metadata, key, id);

      // Update the clone with the new value.
      if (value === null) {
        delete clone[key];
      } else {
        clone[key] = value;
      }

      // Update the previous change part.
      prev[key] = key in previous ? previous[key] : null;

      // Update the current change part.
      curr[key] = value;
    }

    // Create the change object.
    let change = { previous: prev, current: curr };

    // Return the patch result.
    return { value: clone, change };
  }

  /**
   * Merge two change objects into a single change object.
   *
   * @param first - The first change object of interest.
   *
   * @param second - The second change object of interest.
   *
   * @returns A new change object which represents both changes.
   */
  mergeChange(first: MapField.Change<T>, second: MapField.Change<T>): MapField.Change<T> {
    let previous = { ...second.previous, ...first.previous };
    let current = { ...first.current, ...second.current };
    return { previous, current };
  }

  /**
   * Merge two patch objects into a single patch object.
   *
   * @param first - The first patch object of interest.
   *
   * @param second - The second patch object of interest.
   *
   * @returns A new patch object which represents both patches.
   */
  mergePatch(first: MapField.Patch<T>, second: MapField.Patch<T>): MapField.Patch<T> {
    return { id: second.id, values: { ...first.values, ...second.values } };
  }
}


/**
 * The namespace for the `MapField` class statics.
 */
export
namespace MapField {
  /**
   * An options object for initializing a map field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> extends Field.IOptions { }

  /**
   * A type alias for the map field value type.
   */
  export
  type Value<T extends ReadonlyJSONValue> = {
    readonly [key: string]: T;
  };

  /**
   * A type alias for the map field update type.
   */
  export
  type Update<T extends ReadonlyJSONValue> = {
    readonly [key: string]: T | null;
  };

  /**
   * A type alias for the map field metadata type.
   */
  export
  type Metadata<T extends ReadonlyJSONValue> = {
    /**
     * A mapping of key:id-history.
     */
    readonly ids: { [key: string]: Array<string> };

    /**
     * A mapping of key:value-history.
     */
    readonly values: { [key: string]: Array<T | null> };
  };

  /**
   * A type alias for the map field change type.
   */
  export
  type Change<T extends ReadonlyJSONValue> = {
    /**
     * The previous values of the changed items.
     */
    readonly previous: { readonly [key: string]: T | null };

    /**
     * The current values of the changed items.
     */
    readonly current: { readonly [key: string]: T | null };
  };

  /**
   * A type alias for the map field patch type.
   */
  export
  type Patch<T extends ReadonlyJSONValue> = {
    /**
     * The unique id associated with the values.
     */
    readonly id: string;

    /**
     * The current values of the changed items.
     */
    readonly values: { readonly [key: string]: T | null };
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Insert a value into the map field metadata.
   *
   * @param metadata - The metadata of interest.
   *
   * @param key - The key of interest.
   *
   * @param id - The unique id for the value.
   *
   * @param value - The value to insert.
   *
   * @returns The current value for the key.
   *
   * #### Notes
   * If the id already exists, the old value will be overwritten.
   */
  export
  function insertIntoMetadata<T extends ReadonlyJSONValue>(metadata: MapField.Metadata<T>, key: string, id: string, value: T | null): T | null {
    // Fetch the id and value arrays for the given key.
    let ids = metadata.ids[key] || (metadata.ids[key] = []);
    let values = metadata.values[key] || (metadata.values[key] = []);

    // Find the insert index for the id.
    let i = ArrayExt.lowerBound(ids, id, StringExt.cmp);

    // Overwrite or insert the value as appropriate.
    if (i < ids.length && ids[i] === id) {
      values[i] = value;
    } else {
      ArrayExt.insert(ids, i, id);
      ArrayExt.insert(values, i, value);
    }

    // Return the current value for the key.
    return values[values.length - 1];
  }

  /**
   * Remove a value from the map field metadata.
   *
   * @param metadata - The metadata of interest.
   *
   * @param key - The key of interest.
   *
   * @param id - The unique id for the value.
   *
   * @returns The current value for the key, or null if there is no value.
   *
   * #### Notes
   * If the id is not in the metadata, this is a no-op.
   */
  export
  function removeFromMetadata<T extends ReadonlyJSONValue>(metadata: MapField.Metadata<T>, key: string, id: string): T | null {
    // Fetch the id and value arrays for the given key.
    let ids = metadata.ids[key] || (metadata.ids[key] = []);
    let values = metadata.values[key] || (metadata.values[key] = []);

    // Find the insert index for the id.
    let i = ArrayExt.lowerBound(ids, id, StringExt.cmp);

    // Find and remove the index for the id.
    if (ids[i] === id) {
      ArrayExt.removeAt(ids, i);
      ArrayExt.removeAt(values, i);
    }

    // Return the current value for the key.
    return values.length ? values[values.length - 1] : null;
  }
}
