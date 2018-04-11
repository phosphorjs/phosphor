/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IText
} from './text';


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
   * The update type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@UpdateType': string;

  /**
   * The runtime type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@RuntimeType': IText;

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
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text removed at the given index.
     */
    readonly removedText: string;

    /**
     * The text inserted at the given index.
     */
    readonly insertedText: string;
  }
}
