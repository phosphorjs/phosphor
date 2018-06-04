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
 * A base class for the datastore field types.
 *
 * #### Notes
 * The datastore does not support user-defined fields.
 */
export
abstract class BaseField<ValueType, ChangeType> {
  /**
   * Construct a new base field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: BaseField.IOptions = {}) {
    let opts = { undoable: true, description: '', ...options };
    this.undoable = opts.undoable;
    this.description = opts.description;
  }

  /**
   * Whether changes to the field can be undone.
   */
  readonly undoable: boolean;

  /**
   * The human-readable description of the field.
   */
  readonly description: string;

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
  readonly '@@ValueType': ValueType;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': ChangeType;
}


/**
 * The namespace for the `BaseField` class statics.
 */
export
namespace BaseField {
  /**
   * An options object for initializing a base field.
   */
  export
  interface IOptions {
    /**
     * Whether changes to the field can be undone.
     *
     * The default is `true`.
     */
    undoable?: boolean;

    /**
     * The human-readable description of the field.
     *
     * The default is `''`.
     */
    description?: string;
  }
}


/**
 * A field which represents a mutable sequence of values.
 */
export
class ListField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<IList<T>, ListField.ChangeArray<T>> {
  /**
   * Construct a new list field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ListField.IOptions<T> = {}) {
    super(options);
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'list' {
    return 'list';
  }
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
  interface IOptions<T extends ReadonlyJSONValue> extends BaseField.IOptions { }

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

  /**
   * A type alias for an array of list changes.
   */
  export
  type ChangeArray<T extends ReadonlyJSONValue> = ReadonlyArray<IChange<T>>;
}


/**
 * A field which represents a mutable map of values.
 */
export
class MapField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<IMap<T>, MapField.IChange<T>> {
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
  interface IOptions<T extends ReadonlyJSONValue> extends BaseField.IOptions { }

  /**
   * An object which represents a change to a map field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The previous values for the changed items.
     */
    readonly previous: { readonly [key: string]: T | undefined };

    /**
     * The current values for the changed items.
     */
    readonly current: { readonly [key: string]: T | undefined };
  }
}


/**
 * A field which represents a mutable text value.
 */
export
class TextField extends BaseField<IText, TextField.ChangeArray> {
  /**
   * Construct a new text field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: TextField.IOptions = {}) {
    super(options);
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'text' {
    return 'text';
  }
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
  interface IOptions extends BaseField.IOptions { }

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

  /**
   * A type alias for an array of text changes.
   */
  export
  type ChangeArray = ReadonlyArray<IChange>;
}


/**
 * A field which represents a readonly JSON value.
 */
export
class ValueField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<T, ValueField.IChange<T>> {
  /**
   * Construct a new value field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ValueField.IOptions<T>) {
    super(options);
    this.value = options.value;
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
  readonly value: T;
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
  interface IOptions<T extends ReadonlyJSONValue> extends BaseField.IOptions {
    /**
     * The initial value for the field.
     */
    value: T;
  }

  /**
   * An object which represents a change to a value field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The previous value of the field.
     */
    readonly previous: T;

    /**
     * The current value of the field.
     */
    readonly current: T;
  }
}


/**
 * A type alias of all supported fields.
 */
export
type Field = ListField | MapField | TextField | ValueField;


/**
 * The namespace for the `Field` type statics.
 */
export
namespace Field {
  /**
   * A convenience function which creates a boolean value field.
   *
   * @param options - The options for the field. The default `value`
   *   option is `false`.
   *
   * @returns A new boolean value field.
   */
  export
  function Boolean(options: Partial<ValueField.IOptions<boolean>> = {}): ValueField<boolean> {
    let opts = { value: false, ...options };
    return new ValueField<boolean>(opts);
  }

  /**
   * A convenience function which creates a number value field.
   *
   * @param options - The options for the field. The default `value`
   *   option is `0`.
   *
   * @returns A new number value field.
   */
  export
  function Number(options: Partial<ValueField.IOptions<number>> = {}): ValueField<number> {
    let opts = { value: 0, ...options };
    return new ValueField<number>(opts);
  }

  /**
   * A convenience function which creates a string value field.
   *
   * @param options - The options for the field. The default `value`
   *   option is `''`.
   *
   * @returns A new string value field.
   */
  export
  function String(options: Partial<ValueField.IOptions<string>> = {}): ValueField<string> {
    let opts = { value: '', ...options };
    return new ValueField<string>(opts);
  }

  /**
   * A convenience function which creates a list field.
   *
   * @param options - The options for the field.
   *
   * @returns A new list field.
   */
  export
  function List<T extends ReadonlyJSONValue>(options: ListField.IOptions<T> = {}): ListField<T> {
    return new ListField<T>(options);
  }

  /**
   * A convenience function which creates a map field.
   *
   * @param options - The options for the field.
   *
   * @returns A new map field.
   */
  export
  function Map<T extends ReadonlyJSONValue>(options: MapField.IOptions<T> = {}): MapField<T> {
    return new MapField<T>(options);
  }

  /**
   * A convenience function which creates a text field.
   *
   * @param options - The options for the field.
   *
   * @returns A new text field.
   */
  export
  function Text(options: TextField.IOptions = {}): TextField {
    return new TextField(options);
  }

  /**
   * A convenience function which creates a text field.
   *
   * @param options - The options for the field.
   *
   * @returns A new value field.
   */
  export
  function Value<T extends ReadonlyJSONValue>(options: ValueField.IOptions<T>): ValueField<T> {
    return new ValueField<T>(options);
  }
}
