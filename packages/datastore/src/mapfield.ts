/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  Field
} from './field';


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
    throw '';
  }

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  applyPatch(args: Field.PatchArgs<MapField.Value<T>, MapField.Patch<T>, MapField.Metadata<T>>): Field.PatchResult<MapField.Value<T>, MapField.Change<T>> {
    throw '';
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
    throw '';
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
    throw '';
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
    readonly previous: { readonly [key: string]: T };

    /**
     * The current values of the changed items.
     */
    readonly current: { readonly [key: string]: T };
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
