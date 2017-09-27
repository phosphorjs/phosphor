/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  JSONArray, JSONObject, ReadonlyJSONValue, Token
} from '@phosphor/coreutils';

import {
  ISignal
} from '@phosphor/signaling';


/**
 * An object which represents an action for a data store.
 *
 * #### Notes
 * This class may be subclassed to create complex action types.
 */
export
class Action {
  /**
   * Construct a new action.
   *
   * @param type - The type of the action.
   */
  constructor(type: string) {
    this.type = type;
  }

  /**
   * The type of the action.
   *
   * #### Notes
   * The `type` of an action should be related directly to its actual
   * runtime type. This means that `type` can and will be used to cast
   * the action to the relevant derived `Action` subtype.
   */
  readonly type: string;
}


/**
 * A type alias for an action handler function.
 *
 * @param state - The data store which holds the state.
 *
 * @param action - The action to perform on the store.
 *
 * @returns Whether the given action was handled.
 */
export
type Handler = (store: IDataStore, action: Action) => boolean;


/**
 * A state store which enforces unidirectional dataflow.
 */
export
interface IDataStore {
  /**
   * A signal emitted when the data store changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDataStore, IDataStore.IChangedArgs>;

  /**
   * Whether the model can currently undo a transaction.
   */
  readonly canUndo: boolean;

  /**
   * Whether the model can currently redo an undone transaction.
   */
  readonly canRedo: boolean;

  /**
   * Undo the most recent transaction to the model.
   *
   * #### Notes
   * This is a no-op if `canUndo` is false.
   */
  undo(): void;

  /**
   * Redo the most recent undo operation on the model.
   *
   * #### Notes
   * This is a no-op if `canRedo` is false.
   */
  redo(): void;

  /**
   * Dispatch an action to the data store.
   *
   * @param action - The action(s) to dispatch to the store.
   *
   * @throws An exception if this method is called recursively.
   *
   * #### Notes
   * The data store state can only be modified during dispatch.
   */
  dispatch(action: Action | Action[]): void;

  /**
   * Add an action handler to the data store.
   *
   * @param handler - The action handler of interest.
   *
   * #### Notes
   * A message hook is invoked before a message is delivered to the
   * handler. If the hook returns `false`, no other hooks will be
   * invoked and the message will not be delivered to the handler.
   *
   * The most recently installed message hook is executed first.
   *
   * If the hook is already installed, this is a no-op.
   */
  addHandler(handler: Handler): void;

  /**
   *
   */
  removeHandler(handler: Handler): void;

  /**
   * Create a new DB list.
   *
   * @param values - The initial values for the list.
   *
   * @returns A new db list with the initial values.
   */
  createList<T extends ReadonlyJSONValue>(values?: IterableOrArrayLike<T>): IObservableList<T>;

  /**
   * Create a new DB map.
   *
   * @param items - The initial items for the map.
   *
   * @returns A new db map with the initial items.
   */
  createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IObservableMap<T>;

  /**
   * Create a new DB string.
   *
   * @param value - The initial value for the string.
   *
   * @returns A new db string with the initial value.
   */
  createString(value?: string): IObservableString;

  /**
   * Create a new DB record.
   *
   * @param state - The initial state for the record.
   *
   * @returns A new db record with the initial state.
   */
  createRecord<T extends IObservableRecord.State>(state: T): IObservableRecord<T>;

  /**
   * Create a new db table.
   *
   * @param token - The token for the table.
   *
   * @param records - The initial records for the table.
   *
   * @returns The new db table populated with the initial records.
   *
   * @throws An exception if the table has already been created.
   */
  createTable<T extends IObservableRecord.State>(token: Token<T>, records?: IterableOrArrayLike<IObservableRecord<T>>): IDBTable<T>;

  /**
   *
   */
  tables(): IIterator<IObservableTable<{}>>;

  /**
   * Test whether a specific table has been created.
   *
   * @param token - The token for the table of interest.
   *
   * @returns `true` if the table has been created, `false` otherwise.
   */
  hasTable<T extends IObservableRecord.State>(token: Token<T>): boolean;

  /**
   * Get the table for a specific token.
   *
   * @param token - The token for the table of interest.
   *
   * @returns The table for the specified token.
   *
   * @throws An exception the table has not yet been created.
   */
  getTable<T extends IObservableRecord.State>(token: Token<T>): IDBTable<T>;

  /**
   * Delete a table from the model db.
   *
   * @param token - The token for the table to delete.
   *
   * @throws An exception the table has not yet been created.
   */
  deleteTable<T extends IObservableRecord.State>(token: Token<T>): void;
}


/**
 * The common base state for objects created by a data store.
 */
export
interface IObservableObject {
  /**
   * A signal emitted when the object state changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IObservableObject, IObservableObject.IChangedArgs>;

  /**
   * The type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly type: 'list' | 'map' | 'string' | 'record' | 'table';

  /**
   * The unique id of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly id: string;

  /**
   * The parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly parent: IObservableObject | null;

  /**
   * Create a JSON representation of the object.
   *
   * @returns A new JSON representation of the object.
   */
  toJSON(): JSONObject | JSONArray | string;
}


/**
 * The namespace for the `IObservableObject` interface statics.
 */
export
namespace IObservableObject {
  /**
   * The data for a change to an observable object.
   */
  export
  interface IChange {
    /**
     * Whether the change was generated by an undo action.
     */
    readonly isUndo: boolean;

    /**
     * Whether the change was generated by a redo action.
     */
    readonly isRedo: boolean;

    /**
     * Whether the change was generated by the local application.
     */
    readonly isLocal: boolean;

    /**
     * The id of the user which generated the change.
     */
    readonly userId: string;

    /**
     * The id of the session which generated the change.
     */
    readonly sessionId: string;
  }

  /**
   * The type of the observable object changed arguments.
   */
  export
  interface IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'list' | 'map' | 'string' | 'record' | 'table';

    /**
     * The object which generated the changes.
     */
    readonly target: IObservableObject;

    /**
     * The changes applied to the object.
     */
    readonly changes: ReadonlyArray<IChange>;
  }
}


/**
 * An observable object which holds an ordered list of JSON values.
 */
export
interface IObservableList<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IObservableObject, IIterable<T>, IRetroable<T> {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IObservableList<T>, IObservableList.IChangedArgs<T>>;

  /**
   * The type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly type: 'list';

  /**
   * The parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly parent: IObservableRecord<{}> | null;

  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the list.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * The first value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly first: T | undefined;

  /**
   * The last value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly last: T | undefined;

  /**
   * Find the index of the first occurrence of a value in the list.
   *
   * @param value - The value to locate in the list. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the first occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  indexOf(value: T, start?: number, stop?: number): number;

  /**
   * Find the index of the last occurrence of a value in the list.
   *
   * @param value - The value to locate in the list. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the last occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  lastIndexOf(value: T, start?: number, stop?: number): number;

  /**
   * Find the index of the first value which matches a predicate.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the first matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the list while searching.
   */
  findIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number;

  /**
   * Find the index of the last value which matches a predicate.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the last matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the list while searching.
   */
  findLastIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number;

  /**
   * Get the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @returns The value at the specified index or `undefined` if the
   *   index is out of range.
   *
   * #### Complexity
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  get(index: number): T | undefined;

  /**
   * Set the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Notes
   * This method is a no-op if `index` is out of range.
   *
   * #### Complexity
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  set(index: number, value: T): void;

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the list.
   *
   * #### Complexity
   * Constant.
   */
  push(value: T): void;

  /**
   * Insert a value into the list.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  insert(index: number, value: T): void;

  /**
   * Remove a value at a specific index in the list.
   *
   * @param index - The index of the value to remove. Negative values
   *   are taken as an offset from the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  remove(index: number): void;

  /**
   * Replace a range of values in the list.
   *
   * @param index - The index of the first element to be removed.
   *   Negative values are taken as an offset from the end of the list.
   *
   * @param count - The number of elements to remove.
   *
   * @param values - The values to insert at the specified index.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, values?: IterableOrArrayLike<T>): void;

  /**
   * Clear all values from the list.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;

  /**
   * Create a JSON representation of the list.
   *
   * @returns A new JSON representation of the list.
   */
  toJSON(): JSONArray;
}


/**
 * The namespace for the `IObservableList` interface statics.
 */
export
namespace IObservableList {
  /**
   * The data for a change to an observable list.
   */
  export
  interface IChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IObservableObject.IChange {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The values that were removed from the given index.
     */
    readonly removed: ReadonlyArray<T>;

    /**
     * The values that were added at the given index.
     */
    readonly added: ReadonlyArray<T>;
  }

  /**
   * The type of the observable list changed arguments.
   */
  export
  interface IChangedArgs<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IObservableObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'list';

    /**
     * The list which generated the changes.
     */
    readonly target: IObservableList<T>;

    /**
     * The changes applied to the list.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }
}


/**
 * An observable object which maps string keys to JSON values.
 */
export
interface IObservableMap<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IObservableObject, IIterable<[string, T]> {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IObservableMap<T>, IObservableMap.IChangedArgs<T>>;

  /**
   * The type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly type: 'map';

  /**
   * The parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly parent: IObservableRecord<{}> | null;

  /**
   * Whether the map is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The size of the map.
   *
   * #### Complexity
   * Constant.
   */
  readonly size: number;

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator over the keys in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  keys(): IIterator<string>;

  /**
   * Create an iterator over the values in the map.
   *
   * @returns A new iterator over the values in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  values(): IIterator<T>;

  /**
   * Test whether the map has a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns `true` if the map has the given key, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   */
  has(key: string): boolean;

  /**
   * Get the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @returns The key value or `undefined` if the key is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(key: string): T | undefined;

  /**
   * Set the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @param value - The value to set for the given key.
   *
   * #### Complexity
   * Constant.
   */
  set(key: string, value: T): void;

  /**
   * Delete an item from the map.
   *
   * @param key - The key of the item to delete from the map.
   *
   * #### Complexity
   * Constant.
   */
  delete(key: string): void;

  /**
   * Clear all items from the map.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;

  /**
   * Create a JSON representation of the map.
   *
   * @returns A new JSON representation of the map.
   */
  toJSON(): JSONObject;
}


/**
 * The namespace for the `IObservableMap` interface statics.
 */
export
namespace IObservableMap {
  /**
   * The data for a change to an observable map.
   */
  export
  interface IChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IObservableObject.IChange {
    /**
     * The items that were removed from the map.
     */
    readonly removed: { readonly [key: string]: T };

    /**
     * The items that were added to the map.
     */
    readonly added: { readonly [key: string]: T };
  }

  /**
   * The type of the observable map changed arguments.
   */
  export
  interface IChangedArgs<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IObservableObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'map';

    /**
     * The map which generated the changes.
     */
    readonly target: IObservableMap<T>;

    /**
     * The changes applied to the map.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }
}


/**
 * An observable object which holds a string.
 */
export
interface IObservableString extends IObservableObject {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IObservableString, IObservableString.IChangedArgs>;

  /**
   * The type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly type: 'string';

  /**
   * The parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly parent: IObservableRecord<{}> | null;

  /**
   * Whether the string is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the string.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * Get the value of the string.
   *
   * @returns The current string value.
   */
  get(): string;

  /**
   * Set the value of the string.
   *
   * @param value - The desired value for the string.
   */
  set(value: string): void;

  /**
   * Add text to the end of the string.
   *
   * @param value - The text to add to the end of the string.
   */
  append(value: string): void;

  /**
   * Insert text into the string.
   *
   * @param index - The index at which to insert the text.
   *
   * @param value - The text to insert into the string.
   */
  insert(index: number, value: string): void;

  /**
   * Replace a range of text in the string.
   *
   * @param index - The index of the first character to be removed.
   *   Negative values are offset from the end of the string.
   *
   * @param count - The number of characters to remove.
   *
   * @param value - The text to insert at the specified index.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, value?: string): void;

  /**
   * Clear the string.
   */
  clear(): void;

  /**
   * Create a JSON representation of the string.
   *
   * @returns A new JSON representation of the string.
   */
  toJSON(): string;
}


/**
 * The namespace for the `IObservableString` interface statics.
 */
export
namespace IObservableString {
  /**
   * The data for a change to an observable string.
   */
  export
  interface IChange extends IObservableObject.IChange {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text that was removed from the string.
     */
    readonly removed: string;

    /**
     * The text that was added to the string.
     */
    readonly added: string;
  }

  /**
   * The type of the observable string changed arguments.
   */
  export
  interface IChangedArgs extends IObservableObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'string';

    /**
     * The string which generated the changes.
     */
    readonly target: IObservableString;

    /**
     * The changes applied to the string.
     */
    readonly changes: ReadonlyArray<IChange>;
  }
}


/**
 * An observable object which holds user-defined state.
 */
export
interface IObservableRecord<T extends IObservableRecord.State> extends IObservableObject {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IObservableRecord<T>, IObservableRecord.IChangedArgs<T> | IObservableRecord.BubbledArgs>;

  /**
   * The type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly type: 'record';

  /**
   * The parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly parent: IObservableTable<T> | null;

  /**
   * The user-defined state of the record.
   *
   * #### Complexity
   * Constant.
   */
  readonly state: Readonly<T>;

  /**
   * Update the user-defined state of the record.
   *
   * @param state - The partial updated state for the record.
   */
  update(state: Partial<T>): void;

  /**
   * Create a JSON representation of the record.
   *
   * @returns A new JSON representation of the record.
   */
  toJSON(): JSONObject;
}


/**
 * The namespace for the `IObservableRecord` interface statics.
 */
export
namespace IObservableRecord {
  /**
   * The allowed state of an observable record.
   */
  export
  type State = {
    /**
     * The index signature for the state of an observable record.
     */
    [key: string]: ReadonlyJSONValue | IObservableList | IObservableMap | IObservableString;
  };

  /**
   * The data for a change to an observable record.
   */
  export
  interface IChange<T extends State> extends IObservableObject.IChange {
    /**
     * The old state for the changed portion of the record.
     */
    readonly oldState: Partial<Readonly<T>>;

    /**
     * The new state for the changed portion of the record.
     */
    readonly newState: Partial<Readonly<T>>;
  }

  /**
   * The type of the observable record changed arguments.
   */
  export
  interface IChangedArgs<T extends State> extends IObservableObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'record';

    /**
     * The record which generated the changes.
     */
    readonly target: IObservableRecord<T>;

    /**
     * The changes applied to the record.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }

  /**
   * A type alias for the observable record bubbled args.
   */
  export
  type BubbledArgs = IObservableList.IChangedArgs | IObservableMap.IChangedArgs | IObservableString.IChangedArgs;
}


/**
 * An observable object which holds records.
 */
export
interface IObservableTable<T extends IObservableRecord.State> extends IObservableObject, IIterable<IObservableRecord<T>> {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IObservableTable<T>, IObservableTable.IChangedArgs<T> | IObservableTable.BubbledArgs<T>>;

  /**
   * The type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly type: 'table';

  /**
   * The parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly parent: null;

  /**
   * The token associated with the table.
   *
   * #### Complexity
   * Constant.
   */
  readonly token: Token<T>;

  /**
   * Whether the table is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The size of the table.
   *
   * #### Complexity
   * Constant.
   */
  readonly size: number;

  /**
   * Test whether the table has a particular record.
   *
   * @param id - The record id of interest.
   *
   * @returns `true` if the table has the record, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   */
  has(id: string): boolean;

  /**
   * Get the record for a particular id the table.
   *
   * @param id - The record id of interest.
   *
   * @returns The requested record, or `undefined` if the id is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(id: string): IObservableRecord<T> | undefined;

  /**
   * Insert a record into the table
   *
   * @param record - The record to insert into the table.
   *
   * #### Complexity
   * Constant.
   */
  insert(record: IObservableRecord<T>): void;

  /**
   * Delete a record or records from the table.
   *
   * @param id - The id of the record to delete from the table.
   *
   * #### Complexity
   * Constant.
   */
  delete(id: string): void;

  /**
   * Clear all records from the table.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;

  /**
   * Create a JSON representation of the table.
   *
   * @returns A new JSON representation of the table.
   */
  toJSON(): JSONObject;
}


/**
 * The namespace for the `IObservableTable` interface statics.
 */
export
namespace IObservableTable {
  /**
   * The data for a change to an observable table.
   */
  export
  interface IChange<T extends IObservableRecord.State> extends IObservableObject.IChange {
    /**
     * The records that were removed from the table.
     */
    readonly removed: ReadonlyArray<IObservableRecord<T>>;

    /**
     * The records that were added to the table.
     */
    readonly added: ReadonlyArray<IObservableRecord<T>>;
  }

  /**
   * The type of the observable table changed arguments.
   */
  export
  interface IChangedArgs<T extends IObservableRecord.State> extends IObservableObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'table';

    /**
     * The table which generated the changes.
     */
    readonly target: IObservableTable<T>;

    /**
     * The changes applied to the table.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }

  /**
   * A type alias for the observable table bubbled args.
   */
  export
  type BubbledArgs<T extends IObservableRecord.State> = IObservableRecord.IChangedArgs<T> | IObservableRecord.BubbledArgs;
}
