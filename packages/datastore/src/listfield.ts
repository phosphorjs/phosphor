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
 * A field which represents a collaborative list of values.
 */
export
class ListField<T extends ReadonlyJSONValue> extends Field<ListField.Value<T>, ListField.Update<T>, ListField.Metadata<T>, ListField.Change<T>, ListField.Patch<T>> {
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

  /**
   * Create the initial value for the field.
   *
   * @returns The initial value for the field.
   */
  createValue(): ListField.Value<T> {
    return [];
  }

  /**
   * Create the metadata for the field.
   *
   * @returns The metadata for the field.
   */
  createMetadata(): ListField.Metadata<T> {
    return { ids: [], cemetery: {} };
  }

  /**
   * Apply a user update to the field.
   *
   * @param args - The arguments for the update.
   *
   * @returns The result of applying the update.
   */
  applyUpdate(args: Field.UpdateArgs<ListField.Value<T>, ListField.Update<T>, ListField.Metadata<T>>): Field.UpdateResult<ListField.Value<T>, ListField.Change<T>, ListField.Patch<T>> {
    throw '';
  }

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  applyPatch(args: Field.PatchArgs<ListField.Value<T>, ListField.Patch<T>, ListField.Metadata<T>>): Field.PatchResult<ListField.Value<T>, ListField.Change<T>> {
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
  mergeChange(first: ListField.Change<T>, second: ListField.Change<T>): ListField.Change<T> {
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
  mergePatch(first: ListField.Patch<T>, second: ListField.Patch<T>): ListField.Patch<T> {
    throw '';
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
  interface IOptions<T extends ReadonlyJSONValue> extends Field.IOptions { }

  /**
   * A type alias for the list field value type.
   */
  export
  type Value<T extends ReadonlyJSONValue> = ReadonlyArray<T>;

  /**
   * A type alias for a list field splice.
   */
  export
  type Splice<T extends ReadonlyJSONValue> = {
    /**
     * The index of the splice.
     */
    readonly index: number;

    /**
     * The number of values to remove.
     */
    readonly remove: number;

    /**
     * The values to insert.
     */
    readonly values: ReadonlyArray<T>;
  };

  /**
   * A type alias for the list field update type.
   */
  export
  type Update<T extends ReadonlyJSONValue> = Splice<T> | ReadonlyArray<Splice<T>>;

  /**
   * A type alias for the list field metadata type.
   */
  export
  type Metadata<T extends ReadonlyJSONValue> = {
    /**
     * An array of ids corresponding to the list elements.
     */
    readonly ids: Array<string>;

    /**
     * The cemetery for concurrently deleted elements.
     */
    readonly cemetery: { [id: string]: number };
  };

  /**
   * A type alias for a list field change part.
   */
  export
  type ChangePart<T extends ReadonlyJSONValue> = {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The values that were removed.
     */
    readonly removed: ReadonlyArray<T>;

    /**
     * The values that were inserted.
     */
    readonly inserted: ReadonlyArray<T>;
  };

  /**
   * A type alias for the list field change type.
   */
  export
  type Change<T extends ReadonlyJSONValue> = ReadonlyArray<ChangePart<T>>;

  /**
   * A type alias for the list field patch type.
   */
  export
  type Patch<T extends ReadonlyJSONValue> = {
    /**
     * The id:value pairs that were removed.
     */
    readonly removed: { readonly [id: string]: T };

    /**
     * The id:value pairs that were inserted.
     */
    readonly inserted: { readonly [id: string]: T };
  };
}
