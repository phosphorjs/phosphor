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
  createTriplexIds
} from './utilities';


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

    // Create the ids for the splice.
    let ids = createTriplexIds(values.length, version, storeId, lower, upper);

    // Apply the splice to the ids and values.
    let removedIds = metadata.ids.splice(index, count, ...ids);
    let removedValues = array.splice(index, count, ...values);

    // Create the change object.
    let change = { index, removed: removedValues, inserted: values };

    // Create the patch object.
    let patch = { removedIds, removedValues, insertedIds: ids, insertedValues: values };

    // Return the splice result.
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
    // Unpack the patch.
    let { removedIds, insertedIds, insertedValues } = patch;

    // Set up the change array.
    let change: ListField.ChangePart<T>[] = [];

    // Process the removed identifiers, if necessary.
    if (removedIds.length > 0) {
      // Chunkify the removed identifiers,
      // or increment the removed ids in the cemetery.
      let chunks = findRemovedChunks(removedIds, metadata);

      // Process the chunks.
      while (chunks.length > 0) {
        // Pop the last-most chunk.
        let { index, count } = chunks.pop()!;

        // Remove the identifiers from the metadata.
        metadata.ids.splice(index, count);

        // Remove the values from the array.
        let removed = value.splice(index, count);

        // Add the change part to the change array.
        change.push({ index, removed, inserted: [] });
      }
    }

    // Process the inserted identifiers, if necessary.
    if (insertedIds.length > 0) {
      // Chunkify the inserted identifiers, or decrement the removed
      // ids in the cemetery.
      let chunks = findInsertedChunks(insertedIds, insertedValues, metadata);

      // Process the chunks.
      while (chunks.length > 0) {
        // Pop the last-most chunk.
        let { index, ids, values } = chunks.pop()!;

        // Insert the identifiers into the metadata.
        metadata.ids.splice(index, 0, ...ids);

        // Insert the values into the array.
        value.splice(index, 0, ...values);

        // Add the change part to the change array.
        change.push({ index, removed: [], inserted: values });
      }
    }

    // Return the change array.
    return change;
  }

  /**
   * A type alias for a remove chunk.
   */
  type RemoveChunk = {
    // The index of the removal.
    index: number;

    // The number of elements to remove.
    count: number;
  };

  /**
   * Convert an array of identifiers into removal chunks.
   *
   * @param ids - The ids to remove from the metadta.
   *
   * @param metadata - The metadata for the list field.
   *
   * @returns The ordered chunks to remove.
   *
   * #### Notes
   * The metadata may be mutated if concurrently removed chunks are encountered.
   */
  function findRemovedChunks(ids: ReadonlyArray<string>, metadata: ListField.Metadata<any>): RemoveChunk[] {
    // Set up the chunks array.
    let chunks: RemoveChunk[] = [];

    // Set up the iteration index.
    let i = 0;

    // Fetch the identifier array length.
    let n = ids.length;

    // Iterate over the identifiers to remove.
    while (i < n) {
      // Find the boundary identifier for the current id.
      let j = ArrayExt.lowerBound(metadata.ids, ids[i], StringExt.cmp);

      // If the boundary is the end of the array, then these are concurrently
      // removed ids. Increment those ids in the cemetery and bail.
      if (j === metadata.ids.length) {
        let count = metadata.cemetery[ids[i]] || 0;
        metadata.cemetery[ids[i]] = count + 1;
        i++;
        continue;
      }

      // Set up the chunk index.
      let index = j;

      // Set up the chunk count.
      let count = 0;

      // Find the extent of the chunk.
      while (i < n && StringExt.cmp(ids[i], metadata.ids[j]) === 0) {
        count++;
        i++;
        j++;
      }

      // Add the chunk to the chunks array, or bump the id index.
      if (count > 0) {
        chunks.push({ index, count });
      } else {
        i++;
      }
    }

    // Return the computed chunks.
    return chunks;
  }

  /**
   * A type alias for an insert chunk.
   */
  type InsertChunk<T extends ReadonlyJSONValue> = {
    // The index of the insert.
    index: number;

    // The identifiers to insert.
    ids: string[];

    // The values to insert.
    values: T[];
  };

  /**
   * Convert arrays of identifiers and values into insert chunks.
   *
   * @param ids - The ids to be inserted.
   *
   * @param values - The values to be inserted.
   *
   * @param metadata - The metadata for the list field.
   *
   * @returns The ordered chunks to insert.
   *
   * #### Notes
   * The metadata may be mutated if concurrently removed chunks are encountered.
   */
  function findInsertedChunks<T extends ReadonlyJSONValue>(ids: ReadonlyArray<string>, values: ReadonlyArray<T>, metadata: ListField.Metadata<any>): InsertChunk<T>[] {
    // Set up the chunks array.
    let chunks: InsertChunk<T>[] = [];

    // Set up the iteration index.
    let i = 0;

    // Fetch the identifier array length.
    let n = ids.length;

    // Iterate over the identifiers to insert.
    while (i < n) {
      // If the ids have been concurrently deleted, decrement the cemetery
      // instead of inserting them into the current value.
      let count = metadata.cemetery[ids[i]] || 0;
      if (count === 1) {
        delete metadata.cemetery[ids[i]];
        i++;
        continue;
      } else if (count > 1) {
        metadata.cemetery[ids[i]] = count - 1;
        i++;
        continue;
      }

      // Find the boundary identifier for the current id.
      let j = ArrayExt.lowerBound(metadata.ids, ids[i], StringExt.cmp);

      // Bail early if the boundary is the end of the array.
      if (j === metadata.ids.length) {
        chunks.push({ index: j, ids: ids.slice(i), values: values.slice(i) });
        break;
      }

      // Set up the chunk ids.
      let chunkIds: string[] = [];

      // Set up the chunk values.
      let chunkValues: T[] = [];

      // Find the extent of the chunk.
      while (i < n && StringExt.cmp(ids[i], metadata.ids[j]) < 0) {
        chunkIds.push(ids[i]);
        chunkValues.push(values[i]);
        i++;
      }

      // Add the chunk to the chunks array, or bump the id index.
      if (chunkIds.length > 0) {
        chunks.push({ index: j, ids: chunkIds, values: chunkValues });
      } else {
        i++;
      }
    }

    // Return the chunks array.
    return chunks;
  }
}
