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
  IMap
} from './map';


/**
 * A field which represents a mutable map of values.
 */
export
class MapField<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * Construct a new map field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: MapField.IOptions<T> = {}) {
    this.defaultValue = options.defaultValue || {};
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'map' {
    return 'map';
  }

  /**
   * The default value for the field.
   */
  readonly defaultValue: { readonly [key: string]: T };

  /**
   * The update type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@UpdateType': { readonly [key: string]: T };

  /**
   * The runtime type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@RuntimeType': IMap<T>;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': MapField.IChange<T>;
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
  interface IOptions<T extends ReadonlyJSONValue> {
    /**
     * The default value for the field.
     *
     * The default is an empty object.
     */
    defaultValue?: { readonly [key: string]: T };
  }

  /**
   * The change type for a map field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The items removed from the map.
     */
    readonly removedItems: { readonly [key: string]: T };

    /**
     * The items added to the map.
     */
    readonly addedItems: { readonly [key: string]: T };
  }
}
