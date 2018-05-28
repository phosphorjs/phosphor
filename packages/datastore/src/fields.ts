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
 * A field which represents a primary key.
 */
export
class PrimaryKeyField {
  /**
   * Construct a new primary key field.
   */
  constructor() { }

  /**
   * The discriminated type of the field.
   */
  get type(): 'primarykey' {
    return 'primarykey';
  }

  /**
   * The value key for the field.
   *
   * #### Notes
   * This property is an internal implementation detail.
   */
  readonly '@@ValueKey' = Symbol();

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': string;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': never;
}


/**
 * A field which represents a mutable sequence of values.
 */
export
class ListField<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * Construct a new list field.
   *
   * @param initialValue - The initial value for the field.
   */
  constructor(initialValue: ReadonlyArray<T>) {
    this.initialValue = initialValue;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'list' {
    return 'list';
  }

  /**
   * The initial value for the field.
   */
  readonly initialValue: ReadonlyArray<T>;

  /**
   * The value key for the field.
   *
   * #### Notes
   * This property is an internal implementation detail.
   */
  readonly '@@ValueKey' = Symbol();

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': IList<T>;

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
   * An object which represents a single change to a list field.
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
   * @param initialValue - The initial value for the field.
   */
  constructor(initialValue: { readonly [key: string]: T }) {
    this.initialValue = initialValue;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'map' {
    return 'map';
  }

  /**
   * The initial value for the field.
   */
  readonly initialValue: { readonly [key: string]: T };

  /**
   * The value key for the field.
   *
   * #### Notes
   * This property is an internal implementation detail.
   */
  readonly '@@ValueKey' = Symbol();

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': IMap<T>;

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
   * An object which represents a change to a map field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The previous values for the changed items.
     * 
     * A value of `undefined` means the item did not exist.
     */
    readonly previous: { readonly [key: string]: T | undefined };

    /**
     * The current values for the changed items.
     * 
     * A value of `undefined` means the item no longer exists.
     */
    readonly current: { readonly [key: string]: T | undefined };
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
   * @param initialValue - The initial value for the field.
   */
  constructor(initialValue: string) {
    this.initialValue = initialValue;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'text' {
    return 'text';
  }

  /**
   * The initial value for the field.
   */
  readonly initialValue: string;

  /**
   * The value key for the field.
   *
   * #### Notes
   * This property is an internal implementation detail.
   */
  readonly '@@ValueKey' = Symbol();

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': IText;

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
   * An object which represents a single change to a text field.
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
   * @param initialValue - The initial value for the field.
   */
  constructor(initialValue: T) {
    this.initialValue = initialValue;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'value' {
    return 'value';
  }

  /**
   * The initial value for the field.
   */
  readonly initialValue: T;

  /**
   * The value key for the field.
   *
   * #### Notes
   * This property is an internal implementation detail.
   */
  readonly '@@ValueKey' = Symbol();

  /**
   * The value type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ValueType': T;

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
   * An object which represents a change to a value field.
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
type Field = PrimaryKeyField | ListField | MapField | TextField | ValueField;


/**
 * The namespace for the `Field` type statics.
 */
export
namespace Field {
  /**
   * A convenience function which creates a primary key field.
   *
   * @returns A new primary key field.
   */
  export
  function PrimaryKey(): PrimaryKeyField {
    return new PrimaryKeyField();
  }

  /**
   * A convenience function which creates a boolean value field.
   *
   * @param initialValue - The initial value for the field.
   *   The default is `false`.
   *
   * @returns A new boolean value field.
   */
  export
  function Boolean(initialValue = false): ValueField<boolean> {
    return new ValueField<boolean>(initialValue);
  }

  /**
   * A convenience function which creates a number value field.
   *
   * @param initialValue - The initial value for the field.
   *   The default is `0`.
   *
   * @returns A new number value field.
   */
  export
  function Number(initialValue = 0): ValueField<number> {
    return new ValueField<number>(initialValue);
  }

  /**
   * A convenience function which creates a string value field.
   *
   * @param initialValue - The initial value for the field.
   *   The default is `''`.
   *
   * @returns A new string value field.
   */
  export
  function String(initialValue = ''): ValueField<string> {
    return new ValueField<string>(initialValue);
  }

  /**
   * A convenience function which creates a list field.
   *
   * @param initialValue - The initial value for the field.
   *   The default is `[]`.
   *
   * @returns A new list field.
   */
  export
  function List<T extends ReadonlyJSONValue>(initialValue: ReadonlyArray<T> = []): ListField<T> {
    return new ListField<T>(initialValue);
  }

  /**
   * A convenience function which creates a map field.
   *
   * @param initialValue - The initial value for the field.
   *   The default is `{}`.
   *
   * @returns A new map field.
   */
  export
  function Map<T extends ReadonlyJSONValue>(initialValue: { readonly [key: string]: T } = {}): MapField<T> {
    return new MapField<T>(initialValue);
  }

  /**
   * A convenience function which creates a text field.
   *
   * @param initialValue - The initial value for the field.
   *   The default is `''`.
   *
   * @returns A new text field.
   */
  export
  function Text(initialValue = ''): TextField {
    return new TextField(initialValue);
  }

  /**
   * A convenience function which creates a text field.
   *
   * @param initialValue - The initial value for the field.
   *
   * @returns A new value field.
   */
  export
  function Value<T extends ReadonlyJSONValue>(initialValue: T): ValueField<T> {
    return new ValueField<T>(initialValue);
  }
}
