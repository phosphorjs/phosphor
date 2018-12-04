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
    // Unpack the arguments.
    let { previous, update, metadata, version, storeId } = args;

    // Create a clone of the previous value.
    let clone = [...previous];

    // Set up the change and patch arrays.
    let change: ListField.ChangePart<T>[] = [];
    let patch: ListField.PatchPart<T>[] = [];

    // Coerce the update into an array of splices.
    if (Private.isSplice(update)) {
      update = [update];
    }

    // Iterate over the update.
    for (let splice of update) {
      // Apply the splice to the clone.
      let obj = Private.applySplice(clone, splice, metadata, version, storeId);

      // Update the change array.
      change.push(obj.change);

      // Update the patch array.
      patch.push(obj.patch);
    }

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
  applyPatch(args: Field.PatchArgs<ListField.Value<T>, ListField.Patch<T>, ListField.Metadata<T>>): Field.PatchResult<ListField.Value<T>, ListField.Change<T>> {
    // Unpack the arguments.
    let { previous, patch, metadata } = args;

    // Create a clone of the previous value.
    let clone = [...previous];

    // Set up the change array.
    let change: ListField.ChangePart<T>[] = [];

    // Iterate over the patch.
    for (let part of patch) {
      // Apply the patch part to the value.
      let result = Private.applyPatch(clone, part, metadata);

      // Update the change array.
      change.push(...result);
    }

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
  mergeChange(first: ListField.Change<T>, second: ListField.Change<T>): ListField.Change<T> {
    return [...first, ...second];
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
    return [...first, ...second];
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
   * A type alias for the list field patch part.
   */
  export
  type PatchPart<T extends ReadonlyJSONValue> = {
    /**
     * The ids that were removed.
     */
    readonly removedIds: ReadonlyArray<string>;

    /**
     * The values that were removed.
     */
    readonly removedValues: ReadonlyArray<T>;

    /**
     * The ids that were inserted.
     */
    readonly insertedIds: ReadonlyArray<string>;

    /**
     * The values that were inserted.
     */
    readonly insertedValues: ReadonlyArray<T>;
  };

  /**
   * A type alias for the list field patch type.
   */
  export
  type Patch<T extends ReadonlyJSONValue> = ReadonlyArray<PatchPart<T>>;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type-guard function for a list field update type.
   */
  export
  function isSplice<T extends ReadonlyJSONValue>(value: ListField.Update<T>): value is ListField.Splice<T> {
    return !Array.isArray(value);
  }

  /**
   * A type alias for the result of a splice operation.
   */
  export
  type SpliceResult<T extends ReadonlyJSONValue> = {
    /**
     * The user-facing change part for the splice.
     */
    readonly change: ListField.ChangePart<T>;

    /**
     * The system-facing patch part for the splice.
     */
    readonly patch: ListField.PatchPart<T>;
  };

  /**
   * Apply a splice to a list field.
   *
   * @param array - The mutable current value of the field.
   *
   * @param splice - The splice to apply to the field.
   *
   * @param metadata - The metadata for the field.
   *
   * @param version - The current datastore version.
   *
   * @param storeId - The unique id of the datastore.
   *
   * @returns The result of the splice operation.
   */
  export
  function applySplice<T extends ReadonlyJSONValue>(array: T[], splice: ListField.Splice<T>, metadata: ListField.Metadata<T>, version: number, storeId: number): SpliceResult<T> {
    // Unpack the splice.
    let { index, remove, values } = splice;

    // Clamp the index to the array bounds.
    if (index < 0) {
      index = Math.max(0, index + array.length);
    } else {
      index = Math.min(index, array.length);
    }

    // Clamp the remove count to the array bounds.
    let count = Math.min(remove, array.length - index);

    // Fetch the lower and upper identifiers.
    let lower = index === 0 ? '' : metadata.ids[index - 1];
    let upper = index === array.length ? '' : metadata.ids[index];

    let ids: string[] = [];

    // Apply the splice to the ids and values.
    let removedIds = metadata.ids.splice(index, count, ...ids);
    let removedValues = array.splice(index, count, ...values);

    //
    let change = { index, removed: removedValues, inserted: values };

    //
    let patch = { removedIds, removedValues, insertedIds: ids, insertedValues: values };

    //
    return { change, patch };
  }

  /**
   * Apply a patch to a list field.
   *
   * @param value - The mutable current value of the field.
   *
   * @param patch - The patch part to apply to the field.
   *
   * @param metadata - The metadata for the field.
   *
   * @returns The user-facing change array for the patch.
   */
  export
  function applyPatch<T extends ReadonlyJSONValue>(value: T[], patch: ListField.PatchPart<T>, metadata: ListField.Metadata<T>): ListField.Change<T> {
    throw '';
  }
}
