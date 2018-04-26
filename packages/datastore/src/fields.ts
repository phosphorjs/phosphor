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
  IList
} from './list';

import {
  IMap
} from './map';

import {
  IText
} from './text';


/**
 * A field which represents a mutable sequence of values.
 */
export
class ListField<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * Construct a new list field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ListField.IOptions<T> = {}) {
    this.defaultValue = options.defaultValue || [];
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'list' {
    return 'list';
  }

  /**
   * The default value for the field.
   */
  readonly defaultValue: ReadonlyArray<T>;

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': IList<T>;

  /**
   * The partial type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@PartialType': ReadonlyArray<T>;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': ReadonlyArray<ListField.IChange<T>>;
}


/**
 * The namespace for the `ListField` class statics.
 */
export
namespace ListField {
  /**
   * An options object for initializing a list field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> {
    /**
     * The default value for the field.
     *
     * The default is an empty array.
     */
    defaultValue?: ReadonlyArray<T>;
  }

  /**
   * The change type for a list field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * Whether a value was inserted or removed.
     */
    readonly type: 'insert' | 'remove';

    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The value inserted at or removed from the given index.
     */
    readonly value: T;
  }
}


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
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': IMap<T>;

  /**
   * The partial type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@PartialType': { readonly [key: string]: T };

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
    readonly removed: { readonly [key: string]: T };

    /**
     * The items added to the map.
     */
    readonly added: { readonly [key: string]: T };
  }
}


/**
 * A field which represents a mutable text value.
 */
export
class TextField {
  /**
   * Construct a new text field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: TextField.IOptions = {}) {
    this.defaultValue = options.defaultValue || '';
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'text' {
    return 'text';
  }

  /**
   * The default value for the field.
   */
  readonly defaultValue: string;

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': IText;

  /**
   * The partial type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@PartialType': string;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': ReadonlyArray<TextField.IChange>;
}


/**
 * The namespace for the `TextField` class statics.
 */
export
namespace TextField {
  /**
   * An options object for initializing a text field.
   */
  export
  interface IOptions {
    /**
     * The default value for the field.
     *
     * The default is an empty string.
     */
    defaultValue?: string;
  }

  /**
   * The change type for a text field.
   */
  export
  interface IChange {
    /**
     * Whether text was inserted or removed.
     */
    readonly type: 'insert' | 'remove';

    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text inserted at or removed from the given index.
     */
    readonly text: string;
  }
}


/**
 * A field which represents a readonly JSON value.
 */
export
class ValueField<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * Construct a new value field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ValueField.IOptions<T>) {
    this.defaultValue = options.defaultValue;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'value' {
    return 'value';
  }

  /**
   * The default value for the field.
   */
  readonly defaultValue: T;

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': T;

  /**
   * The partial type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@PartialType': T;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': ValueField.IChange<T>;
}


/**
 * The namespace for the `ValueField` class statics.
 */
export
namespace ValueField {
  /**
   * An options object for initializing a value field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> {
    /**
     * The default value for the field.
     */
    defaultValue: T;
  }

  /**
   * The change type for a value field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The previous value of the field.
     */
    previous: T;

    /**
     * The current value of the field.
     */
    current: T;
  }
}


/**
 * A type alias of all supported fields.
 */
export
type Field = ListField | MapField | TextField | ValueField;
