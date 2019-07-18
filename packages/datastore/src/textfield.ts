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
  Field
} from './field';

import {
  createTriplexIds
} from './utilities';


/**
 * A field which represents collaborative text.
 */
export
class TextField extends Field<TextField.Value, TextField.Update, TextField.Metadata, TextField.Change, TextField.Patch> {
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

  /**
   * Create the initial value for the field.
   *
   * @returns The initial value for the field.
   */
  createValue(): TextField.Value {
    return '';
  }

  /**
   * Create the metadata for the field.
   *
   * @returns The metadata for the field.
   */
  createMetadata(): TextField.Metadata {
    return { ids: [], cemetery: {} };
  }

  /**
   * Apply a user update to the field.
   *
   * @param args - The arguments for the update.
   *
   * @returns The result of applying the update.
   */
  applyUpdate(args: Field.UpdateArgs<TextField.Value, TextField.Update, TextField.Metadata>): Field.UpdateResult<TextField.Value, TextField.Change, TextField.Patch> {
    // Unpack the arguments.
    let { previous, update, metadata, version, storeId } = args;

    // Set up a variable to hold the current value.
    let value = previous;

    // Set up the change and patch arrays.
    let change: TextField.ChangePart[] = [];
    let patch: TextField.PatchPart[] = [];

    // Coerce the update into an array of splices.
    if (Private.isSplice(update)) {
      update = [update];
    }

    // Iterate over the update.
    for (let splice of update) {
      // Apply the splice to the value.
      let obj = Private.applySplice(value, splice, metadata, version, storeId);

      // Update the change array.
      change.push(obj.change);

      // Update the patch array.
      patch.push(obj.patch);

      // Update the current value.
      value = obj.value;
    }

    // Return the update result.
    return { value, change, patch };
  }

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  applyPatch(args: Field.PatchArgs<TextField.Value, TextField.Patch, TextField.Metadata>): Field.PatchResult<TextField.Value, TextField.Change> {
    // Unpack the arguments.
    let { previous, patch, metadata } = args;

    // Set up a variable to hold the current value.
    let value = previous;

    // Set up the change array.
    let change: TextField.ChangePart[] = [];

    // Iterate over the patch.
    for (let part of patch) {
      // Apply the patch part to the value.
      let obj = Private.applyPatch(value, part, metadata);

      // Update the change array.
      change.push(...obj.change);

      // Update the current value.
      value = obj.value;
    }

    // Return the patch result.
    return { value, change };
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
  mergeChange(first: TextField.Change, second: TextField.Change): TextField.Change {
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
  mergePatch(first: TextField.Patch, second: TextField.Patch): TextField.Patch {
    return [...first, ...second];
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
  interface IOptions extends Field.IOptions { }

  /**
   * A type alias for the value type of a text field.
   */
  export
  type Value = string;

  /**
   * A type alias for a text field splice.
   */
  export
  type Splice = {
    /**
     * The index of the splice.
     */
    readonly index: number;

    /**
     * The number of characters to remove.
     */
    readonly remove: number;

    /**
     * The text to insert.
     */
    readonly text: string;
  };

  /**
   * A type alias for the text field update type.
   */
  export
  type Update = Splice | ReadonlyArray<Splice>;

  /**
   * A type alias for the text field metadata type.
   */
  export
  type Metadata = {
    /**
     * An array of ids corresponding to the text characters.
     */
    readonly ids: Array<string>;

    /**
     * The cemetery for concurrently deleted characters.
     */
    readonly cemetery: { [id: string]: number };
  };

  /**
   * A type alias for a text field change part.
   */
  export
  type ChangePart = {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text that was removed.
     */
    readonly removed: string;

    /**
     * The text that was inserted.
     */
    readonly inserted: string;
  };

  /**
   * A type alias for the text field change type.
   */
  export
  type Change = ReadonlyArray<ChangePart>;

  /**
   * A type alias for the text field patch part.
   */
  export
  type PatchPart = {
    /**
     * The ids that were removed.
     */
    readonly removedIds: ReadonlyArray<string>;

    /**
     * The text that was removed.
     */
    readonly removedText: string;

    /**
     * The ids that were inserted.
     */
    readonly insertedIds: ReadonlyArray<string>;

    /**
     * The text that was inserted.
     */
    readonly insertedText: string;
  };

  /**
   * A type alias for the text field patch type.
   */
  export
  type Patch = ReadonlyArray<PatchPart>;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type-guard function for a text field update type.
   */
  export
  function isSplice(value: TextField.Update): value is TextField.Splice {
    return !Array.isArray(value);
  }

  /**
   * A type alias for the result of a splice operation.
   */
  export
  type SpliceResult = {
    /**
     * The user-facing change part for the splice.
     */
    readonly change: TextField.ChangePart;

    /**
     * The system-facing patch part for the splice.
     */
    readonly patch: TextField.PatchPart;

    /**
     * The new value of the text.
     */
    readonly value: string;
  };

  /**
   * Apply a splice to a text field.
   *
   * @param value - The current value of the field.
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
  function applySplice(value: string, splice: TextField.Splice, metadata: TextField.Metadata, version: number, storeId: number): SpliceResult {
    // Unpack the splice.
    let { index, remove, text } = splice;

    // Clamp the index to the string bounds.
    if (index < 0) {
      index = Math.max(0, index + value.length);
    } else {
      index = Math.min(index, value.length);
    }

    // Clamp the remove count to the string bounds.
    let count = Math.min(remove, value.length - index);

    // Fetch the lower and upper identifiers.
    let lower = index === 0 ? '' : metadata.ids[index - 1];
    let upper = index === value.length ? '' : metadata.ids[index];

    // Create the ids for the splice.
    let ids = createTriplexIds(text.length, version, storeId, lower, upper);

    // Apply the splice to the ids.
    let removedIds = metadata.ids.splice(index, count, ...ids);

    // Compute the removed text.
    let removedText = value.slice(index, index + count);

    // Create the change object.
    let change = { index, removed: removedText, inserted: text };

    // Create the patch object.
    let patch = { removedIds, removedText, insertedIds: ids, insertedText: text };

    // Compute the new value.
    value = value.slice(0, index) + text + value.slice(index + count);

    // Return the splice result.
    return { change, patch, value };
  }

  /**
   * A type alias for the result of a patch operation.
   */
  export
  type PatchResult = {
    /**
     * The user-facing change for the patch.
     */
    readonly change: TextField.Change;

    /**
     * The new value of the text.
     */
    readonly value: string;
  };

  /**
   * Apply a patch to a text field.
   *
   * @param value - The current value of the field.
   *
   * @param patch - The patch part to apply to the field.
   *
   * @param metadata - The metadata for the field.
   *
   * @returns The user-facing change array for the patch.
   */
  export
  function applyPatch(value: string, patch: TextField.PatchPart, metadata: TextField.Metadata): PatchResult {
    // Unpack the patch.
    let { removedIds, insertedIds, insertedText } = patch;

    // Set up the change array.
    let change: TextField.ChangePart[] = [];

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

        // Compute the removed text
        let removed = value.slice(index, index + count);

        // Compute the new value.
        value = value.slice(0, index) + value.slice(index + count);

        // Add the change part to the change array.
        change.push({ index, removed, inserted: '' });
      }
    }

    // Process the inserted identifiers, if necessary.
    if (insertedIds.length > 0) {
      // Chunkify the inserted identifiers, or decrement the removed
      // ids in the cemetery.
      let chunks = findInsertedChunks(insertedIds, insertedText, metadata);

      // Process the chunks.
      while (chunks.length > 0) {
        // Pop the last-most chunk.
        let { index, ids, text } = chunks.pop()!;

        // Insert the identifiers into the metadata.
        metadata.ids.splice(index, 0, ...ids);

        // Insert the text into the value.
        value = value.slice(0, index) + text + value.slice(index);

        // Add the change part to the change array.
        change.push({ index, removed: '', inserted: text });
      }
    }

    // Return the change array.
    return { change, value };
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
   * @param metadata - The metadata for the text field.
   *
   * @returns The ordered chunks to remove.
   *
   * #### Notes
   * The metadata may be mutated if concurrently removed chunks are encountered.
   */
  function findRemovedChunks(ids: ReadonlyArray<string>, metadata: TextField.Metadata): RemoveChunk[] {
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

      // If the boundary is at the end of the array, or if the boundary id
      // does not match the id we are looking for, then we are dealing with
      // a concurrently deleted value. In that case, increment its reference
      // in the cemetery and continue processing ids.
      if (j === metadata.ids.length || metadata.ids[j] !== ids[i]) {
        let count = metadata.cemetery[ids[i]] || 0;
        metadata.cemetery[ids[i]] = count + 1;
        i++
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
  type InsertChunk = {
    // The index of the insert.
    index: number;

    // The identifiers to insert.
    ids: string[];

    // The text to insert.
    text: string;
  };

  /**
   * Convert arrays of identifiers and values into insert chunks.
   *
   * @param ids - The ids to be inserted.
   *
   * @param text - The text to be inserted.
   *
   * @param metadata - The metadata for the text field.
   *
   * @returns The ordered chunks to insert.
   *
   * #### Notes
   * The metadata may be mutated if concurrently removed chunks are encountered.
   */
  function findInsertedChunks(ids: ReadonlyArray<string>, text: string, metadata: TextField.Metadata): InsertChunk[] {
    // Set up the chunks array.
    let chunks: InsertChunk[] = [];

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
      }
      if (count > 1) {
        metadata.cemetery[ids[i]] = count - 1;
        i++;
        continue;
      }

      // Find the boundary identifier for the current id.
      let j = ArrayExt.lowerBound(metadata.ids, ids[i], StringExt.cmp);

      // Bail early if the boundary is the end of the array.
      if (j === metadata.ids.length) {
        chunks.push({ index: j, ids: ids.slice(i), text: text.slice(i) });
        break;
      }

      // Set up the chunk ids.
      let chunkIds: string[] = [];

      // Set up the chunk text.
      let chunkText: string = '';

      // Find the extent of the chunk.
      while (i < n && StringExt.cmp(ids[i], metadata.ids[j]) < 0) {
        chunkIds.push(ids[i]);
        chunkText += text[i];
        i++;
      }

      // Add the chunk to the chunks array, or bump the id index.
      if (chunkIds.length > 0) {
        chunks.push({ index: j, ids: chunkIds, text: chunkText });
      } else {
        i++;
      }
    }

    // Return the chunks array.
    return chunks;
  }
}
