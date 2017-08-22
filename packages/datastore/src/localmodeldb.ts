/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, IIterator, IterableOrArrayLike, each, iter, iterItems, iterKeys,
  iterValues, retro, toArray
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue, Token, UUID
} from '@phosphor/coreutils';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  IDBList, IDBMap, IDBObject, IDBRecord, IDBString, IDBTable, IModelDB
} from './modeldb';



/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The implementation class for a local model db.
   */
  export
  class LocalDBImpl {

    constructor() { }

    //-------------------------------------------------------------------------
    // DB Methods
    //-------------------------------------------------------------------------
    get canUndo(): boolean {
      return false;
    }

    get canRedo(): boolean {
      return false;
    }

    undo(): void {

    }

    redo(): void {

    }

    transact(auth: any, fn: () => void): void {
      try {

      } catch (error) {
        // unwind transaction
        throw error;
      }
    }

    //-------------------------------------------------------------------------
    // Model Methods
    //-------------------------------------------------------------------------

    createList<T extends ReadonlyJSONValue>(values?: IterableOrArrayLike<T>): IDBList<T> {
      // Guard against disallowed mutations.
      this.mutationGuard();

      // Create and return the list.
      return LocalDBList.create<T>(this, values);
    }

    createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IDBMap<T> {
      // Guard against disallowed mutations.
      this.mutationGuard();

      // Create and return the map.
      return LocalDBMap.create<T>(this, items);
    }

    createString(value?: string): IDBString {
      // Guard against disallowed mutations.
      this.mutationGuard();

      // Create and return the string.
      return LocalDBString.create(this, value);
    }

    createRecord<T extends IDBRecord.State>(state: T): IDBRecord.Instance<T> {
      // Guard against disallowed mutations.
      this.mutationGuard();

      // Create and return the record.
      return LocalDBRecord.create<T>(this, state);
    }

    createTable<T extends IDBRecord.State>(token: Token<T>, records?: IterableOrArrayLike<IDBRecord.Instance<T>>): IDBTable<T> {
      // Guard against disallowed mutations.
      this.mutationGuard();

      // Ensure the table does not already exist.
      if (this._tokenTableMap.has(token)) {
        throw new Error(`A table already exists for the token: '${token.name}'.`);
      }

      // Create the table.
      let table = new LocalDBTable.create<T>(token, this, records);

      // Store the table for the token.
      this._tokenTableMap.set(token, table);

      // Register the change.
      this._registerModelChange(undefined, table);

      // Return the new table.
      return table;
    }

    hasTable<T extends IDBRecord.State>(token: Token<T>): boolean {
      return this._tokenTableMap.has(token);
    }

    getTable<T extends IDBRecord.State>(token: Token<T>): IDBTable<T> {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Return the table.
      return table;
    }

    deleteTable<T extends IDBRecord.State>(token: Token<T>): void {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Delete the table from the token map.
      this._tokenTableMap.delete(token);

      // Register the change.
      this.registerModelChange(table, undefined);
    }

    //-------------------------------------------------------------------------
    //
    //-------------------------------------------------------------------------
    mutationGuard(): void {
      if (!this._inTransaction) {
        throw new Error('DB mutation is only allowed within transaction.');
      }
    }

    registerModelChange(removed: LocalDBTable<{}> | undefined, added: LocalDBTable<{}> | undefined): void {

    }

    registerListChange<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, removed: ReadonlyArray<T>, added: ReadonlyArray<T>): void {

    }

    registerMapChange<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, removed: T | undefined, added: T | undefined): void {

    }

    registerStringChange(str: LocalDBString, index: number, removed: string, added: string): void {

    }

    registerRecordChange<T extends IDBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, oldValue: T[K], newValue: T[K]): void {

    }

    registerTableChange<T extends IDBRecord.State>(table: LocalDBTable<T>, removed: IDBRecord.Instance<T> | undefined, added: IDBRecord.Instance<T> | undefined): void {

    }


    private _inTransaction = false;
    private _tokenTableMap = new Map<Token<any>, LocalDBTable<any>>();
  }

  /**
   * Test whether a value should be treated as an `IDBObject`.
   */
  function isIDBObject(value: any): value is IDBObject {
    return value ? typeof value.dbType === 'string' : false;
  }

  /**
   * An abstract base class implementation of `IDBObject`.
   */
  abstract class LocalDBObject implements IDBObject {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    abstract readonly dbType: 'list' | 'map' | 'string' | 'record' | 'table';

    readonly dbId = UUID.uuid4();

    get dbParent(): IDBObject | null {
      return this._dbParent;
    }

    get changed(): ISignal<IDBObject, IDBObject.IChangedArgs> {
      return this._changed;
    }

    /* internal */ _dbImpl: LocalDBImpl;
    /* internal */ _dbParent: LocalDBObject | null = null;
    /* internal */ _changed = new Signal<this, IDBObject.IChangedArgs>(this);
  }

  /**
   * A concrete implementation of `IDBList`.
   */
  class LocalDBList<T extends ReadonlyJSONValue> extends LocalDBObject implements IDBList<T> {

    static create<K extends ReadonlyJSONValue>(dbImpl: LocalDBImpl, values?: IterableOrArrayLike<K>): LocalDBList<K> {
      // Create the list instance.
      let list = new LocalDBList<K>(dbImpl);

      // Bail early if there are no initial values.
      if (!values) {
        return list;
      }

      // Add the initial list values.
      each(values, value => { list._values.push(value); });

      // Return the initialized list.
      return list;
    }

    get dbType(): 'list' {
      return 'list';
    }

    readonly dbParent: IDBRecord<{}> | null;

    readonly changed: ISignal<IDBList<T>, IDBList.IChangedArgs<T>>;

    get isEmpty(): boolean {
      return this._values.length === 0;
    }

    get length(): number {
      return this._values.length;
    }

    get first(): T | undefined {
      return this.get(0);
    }

    get last(): T | undefined {
      return this.get(-1);
    }

    iter(): IIterator<T> {
      return iter(this._values);
    }

    retro(): IIterator<T> {
      return retro(this._values);
    }

    indexOf(value: T, start?: number, stop?: number): number {
      return ArrayExt.firstIndexOf(this._values, value, start, stop);
    }

    lastIndexOf(value: T, start?: number, stop?: number): number {
      return ArrayExt.lastIndexOf(this._values, value, start, stop);
    }

    findIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return ArrayExt.findFirstIndex(this._values, fn, start, stop);
    }

    findLastIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return ArrayExt.findLastIndex(this._values, fn, start, stop);
    }

    get(index: number): T | undefined {
      return this._values[index < 0 ? index + this._values.length : index];
    }

    set(index: number, value: T): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Wrap the index for negative offsets.
      if (index < 0) {
        index += this._values.length;
      }

      // Bail early if the index is out of range.
      if (index < 0 || index >= this._values.length) {
        return;
      }

      // Look up the current value.
      let current = this._values[index];

      // Bail early if the value does not change.
      if (current === value) {
        return;
      }

      // Update the internal values.
      this._values[index] = value;

      // Register the change.
      this._dbImpl.registerListChange(this, index, [current], [value]);
    }

    push(value: T): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Update the internal values.
      let index = this._values.push(value) - 1;

      // Register the change.
      this._dbImpl.registerListChange(this, index, [], [value]);
    }

    insert(index: number, value: T): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Normalize the index for the insert.
      if (index < 0) {
        index = Math.max(0, index + this._values.length);
      } else {
        index = Math.min(index, this._values.length);
      }

      // Update the internal values.
      ArrayExt.insert(this._values, index, value);

      // Register the change.
      this._dbImpl.registerListChange(this, index, [], [value]);
    }

    remove(index: number): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Wrap the index for negative offsets.
      if (index < 0) {
        index += this._values.length;
      }

      // Bail early if the index is out of range.
      if (index < 0 || index >= this._values.length) {
        return;
      }

      // Update the internal values.
      let removed = ArrayExt.removeAt(this._values, index)!;

      // Register the change.
      this._dbImpl.registerListChange(this, index, [removed], []);
    }

    splice(index: number, count: number, values?: IterableOrArrayLike<T>): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Normalize the remove count.
      count = Math.max(0, count);

      // Normalize the added values.
      let added = values ? toArray(values) : [];

      // Bail early if there is nothing to do.
      if (added.length === 0 && (count === 0 || this._values.length === 0)) {
        return;
      }

      // Normalize the index for the splice.
      if (index < 0) {
        index = Math.max(0, index + this._values.length);
      } else {
        index = Math.min(index, this._values.length);
      }

      // Update the internal values.
      let removed = this._values.splice(index, count, ...added);

      // Bail early if there is no effective change.
      if (ArrayExt.shallowEqual(removed, added)) {
        return;
      }

      // Register the change.
      this._dbImpl.registerListChange(this, index, removed, added);
    }

    clear(): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Bail early if there is no effective change.
      if (this._values.length === 0) {
        return;
      }

      // Shallow copy the list.
      let removed = this._values.slice();

      // Update the internal values.
      this._values.length = 0;

      // Register the change.
      this._dbImpl.registerListChange(this, 0, removed, []);
    }

    private constructor(dbImpl: LocalDBImpl) { super(dbImpl); }

    private _values: T[] = [];
  }

  /**
   * A concrete implementation of `IDBMap`.
   */
  class LocalDBMap<T extends ReadonlyJSONValue> extends LocalDBObject implements IDBMap<T> {

    static create<K  extends ReadonlyJSONValue>(dbImpl: LocalDBImpl, items?: { [key: string]: K }): LocalDBMap<K> {
      // Create the map instance.
      let map = new LocalDBMap<K>(dbImpl);

      // Bail early if there are no initial items.
      if (!items) {
        return map;
      }

      // Add the initial map items.
      for (let key in items) {
        map._items[key] = items[key];
        map._size++;
      }

      // Return the initialized map.
      return map;
    }

    get dbType(): 'map' {
      return 'map';
    }

    readonly dbParent: IDBRecord<{}> | null;

    readonly changed: ISignal<IDBMap<T>, IDBMap.IChangedArgs<T>>;

    get isEmpty(): boolean {
      return this._size === 0;
    }

    get size(): number {
      return this._size;
    }

    iter(): IIterator<[string, T]> {
      return iterItems(this._items);
    }

    keys(): IIterator<string> {
      return iterKeys(this._items);
    }

    values(): IIterator<T> {
      return iterValues(this._items);
    }

    has(key: string): boolean {
      return key in this._items;
    }

    get(key: string): T | undefined {
      return this._items[key];
    }

    set(key: string, value: T): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Look up the current value.
      let current = this._items[key];

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal state.
      this._items[key] = value;
      this._size += +(current === undefined);

      // Register the change.
      this._dbImpl.registerMapChange(this, key, current, value);
    }

    delete(key: string): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Look up the current value.
      let current = this._items[key];

      // Bail early if the key does not exist.
      if (current === undefined) {
        return;
      }

      // Update the internal state.
      delete this._items[key];
      this._size--;

      // Register the change.
      this._dbImpl.registerMapChange(this, key, current, undefined);
    }

    clear(): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Bail early if there is nothing to do.
      if (this._size === 0) {
        return;
      }

      // Iterate over the items.
      for (let key in this._items) {
        // Fetch the value.
        let value = this._items[key];

        // Update the internal state.
        delete this._items[key];
        this._size--;

        // Register the change.
        this._dbImpl.registerMapChange(this, key, value, undefined);
      }
    }

    private constructor(dbImpl: LocalDBImpl) { super(dbImpl); }

    private _size = 0;
    private _items: { [key: string]: T } = Object.create(null);
  }

  /**
   * A concrete implementation of `IDBString`.
   */
  class LocalDBString extends LocalDBObject implements IDBString {

    static create(dbImpl: LocalDBImpl, value?: string): LocalDBString {
      // Create the string instance.
      let str = new LocalDBString(dbImpl);

      // Bail early if there is no initial value.
      if (!value) {
        return str;
      }

      // Set the initial value.
      str._value = value;

      // Return the initialized string.
      return str;
    }

    get dbType(): 'string' {
      return 'string';
    }

    readonly dbParent: IDBRecord<{}> | null;

    readonly changed: ISignal<IDBString, IDBString.IChangedArgs>;

    get isEmpty(): boolean {
      return this._value.length === 0;
    }

    get length(): number {
      return this._value.length;
    }

    get(): string {
      return this._value;
    }

    set(value: string): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Look up the current value.
      let current = this._value;

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal value.
      this._value = value;

      // Register the change.
      this._dbImpl.registerStringChange(this, 0, current, value);
    }

    append(value: string): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Get the index of the modification.
      let index = this._value.length;

      // Update the internal value.
      this._value += value;

      // Register the change.
      this._dbImpl.registerStringChange(this, index, '', value);
    }

    insert(index: number, value: string): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Normalize the index for the insert.
      if (index < 0) {
        index = Math.max(0, index + this._value.length);
      } else {
        index = Math.min(index, this._value.length);
      }

      // Update the internal value.
      let prefix = this._value.slice(0, index);
      let suffix = this._value.slice(index);
      this._value = prefix + value + suffix;

      // Register the change.
      this._dbImpl.registerStringChange(this, index, '', value);
    }

    splice(index: number, count: number, value?: string): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Normalize the remove count.
      count = Math.max(0, count);

      // Normalize the added text.
      let added = value || '';

      // Bail early if there is nothing to do.
      if (!added && (count === 0 || !this._value)) {
        return;
      }

      // Normalize the index for the splice.
      if (index < 0) {
        index = Math.max(0, index + this._value.length);
      } else {
        index = Math.min(index, this._value.length);
      }

      // Extract the removed portion of the string.
      let removed = this._value.slice(index, index + count);

      // Bail early if there is no effective change.
      if (removed === added) {
        return;
      }

      // Update the internal value.
      let prefix = this._value.slice(0, index);
      let suffix = this._value.slice(index + count);
      this._value = prefix + added + suffix;

      // Register the change.
      this._dbImpl.registerStringChange(this, index, removed, added);
    }

    clear(): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Bail early if there is nothing to do.
      if (!this._value) {
        return;
      }

      // Get the removed value.
      let removed = this._value;

      // Update the internal value.
      this._value = '';

      // Register the change.
      this._dbImpl.registerStringChange(this, 0, removed, '');
    }

    private constructor(dbImpl: LocalDBImpl) { super(dbImpl); }

    private _value = '';
  }

  /**
   * A concrete implementation of `IDBRecord`.
   */
  class LocalDBRecord<T extends IDBRecord.State> extends LocalDBObject implements IDBRecord<T> {

    static create<K extends IDBRecord.State>(dbImpl: LocalDBImpl, state: K): LocalDBRecord.Instance<K> {
      // Set up an array for the validated db children.
      let children: LocalDBObject[] = [];

      // Validate the the record state.
      for (let key in state) {
        // Fetch the current value.
        let value = state[key];

        // Skip values which are not db objects.
        if (!isIDBObject(value)) {
          continue;
        }

        // Ensure the value is a compatible db object.
        if (!(value instanceof LocalDBObject)) {
          throw new Error('Invalid record state.');
        }

        // Ensure the value does not have a parent.
        if (value._dbParent !== null) {
          throw new Error('Invalid record state.');
        }

        // Ensure the value was created by the same model db.
        if (value._dbImpl !== dbImpl) {
          throw new Error('Invalid record state.');
        }

        // Add the db child to the array.
        children.push(value);
      }

      // Create the record instance.
      let record = this._cachedFactory(state)(dbImpl);

      // Initialize the state for the record.
      record._state = { ...(state as any) } as K;

      // Set the parent for the children.
      for (let child of children) {
        child._dbParent = record;
      }

      // Return the initialized record.
      return record;
    }

    get dbType(): 'record' {
      return 'record';
    }

    readonly dbParent: IDBTable<T> | null;

    readonly changed: ISignal<IDBRecord.Instance<T>, IDBRecord.IChangedArgs<T>>;

    get<K extends keyof T>(name: K): T[K] {
      return this._state[name];
    }

    set<K extends keyof T>(name: K, value: T[K]): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Look up the current value.
      let current = this._state[name];

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      //
      if (isIDBObject(value)) {
        // Ensure the value is a compatible db object.
        if (!(value instanceof LocalDBObject)) {
          throw new Error('Invalid record state.');
        }

        // Ensure the value does not have a parent.
        if (value._dbParent !== null) {
          throw new Error('Invalid record state.');
        }

        // Ensure the value was created by the same model db.
        if (value._dbImpl !== this._dbImpl) {
          throw new Error('Invalid record state.');
        }

        //
        value._dbParent = this;
      }

      //
      if (current instanceof LocalDBObject) {
        current._dbParent = null;
      }

      // Update the internal state.
      this._state[name] = value;

      // Register the change.
      this._dbImpl.registerRecordChange(this, name, current, value);
    }

    private constructor(dbImpl: LocalDBImpl) { super(dbImpl); }

    private _state: T;

    private static _factoryCache: { [key: string]: LocalDBRecord.Factory<any> } = Object.create(null);

    private static _cachedFactory<K extends IDBRecord.State>(state: K): LocalDBRecord.Factory<K> {
      // Get the property names for the record in a canonical order.
      let names = Object.keys(state).sort();

      // Create a map key for the property names.
      let key = names.join(',');

      // Get the factory function for the record.
      let factory = this._factoryCache[key];

      // Return the factory if it exists.
      if (factory) {
        return factory;
      }

      // Create a new subclass for the record shape.
      let cls = class extends LocalDBRecord<K> { }

      // Create the instance properties for the subclass.
      for (let name of names) {
        // TODO audit these names
        // Disallow properties with reserved names.
        switch (name) {
        case 'dbId':
        case 'dbType':
        case 'dbParent':
        case 'changed':
        case 'get':
        case 'set':
        case '_dbId':
        case '_dbImpl':
        case '_dbParent':
        case '_changed':
        case '_state':
          throw new Error(`Reserved record property name: '${name}'`);
        }

        // Define the named record property.
        Object.defineProperty(cls.prototype, name, {
          get: function() { return this.get(name); },
          set: function(value: any) { this.set(name, value); },
          enumerable: true,
          configurable: true
        });
      }

      // Create the factory function for the new class.
      factory = (dbImpl: LocalDBImpl) => {
        return new cls(dbImpl) as LocalDBRecord.Instance<K>;
      };

      // Cache and return the new factory function.
      return this._factoryCache[key] = factory;
    }
  }

  /**
   * The namespace for the `LocalDBRecord` class statics.
   */
  namespace LocalDBRecord {
    /**
     * A type alias for a local db record instance.
     */
    export
    type Instance<T extends IDBRecord.State> = T & LocalDBRecord<T>;

    /**
     * A type alias for a local db record factory.
     */
    export
    type Factory<T extends IDBRecord.State> = (dbImpl: LocalDBImpl) => Instance<T>;
  }

  /**
   * A concrete implementation of `IDBTable`.
   */
  class LocalDBTable<T extends IDBRecord.State> extends LocalDBObject implements IDBTable<T> {

    static create(...) {
      // Update the initial records.
      if (initial) {
        // De-duplicate before validating.
        each(initial, record => { records[record.dbId] = record; });

        // Set the parent of the records and update the map size.
        for (let id in records) {
          this._setRecordParent(record, table);
          size++;
        }
      }
    }

    private constructor(dbImpl: LocalDBImpl) {
      super(dbImpl);
      this._dbToken = dbToken;
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
      return this._changed;
    }

    get dbType(): 'table' {
      return 'table';
    }

    get dbToken(): Token<T> {
      return this._dbToken;
    }

    get isEmpty(): boolean {
      return this._size === 0;
    }

    get size(): number {
      return this._size;
    }

    iter(): IIterator<IDBRecord.Instance<T>> {
      return iterValues(this._records);
    }

    has(id: string): boolean {
      return id in this._records;
    }

    get(id: string): IDBRecord.Instance<T> | undefined {
      return this._records[id];
    }

    insert(record: IDBRecord.Instance<T>): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // // Validate the type of the record.
      // if (!(record instanceof LocalDBRecord)) {
      //   throw new Error('Record was not created by this model db.');
      // }

      // // Fetch the record state.
      // let recordState = this._recordStateMap.get(record);

      // // Validate the ownership of the record.
      // if (!recordState) {
      //   throw new Error('Record was not created by this model db.');
      // }

      // // Ensure the record does not have a parent.
      // if (recordState.dbParent) {
      //   throw new Error('Record already belongs to another table.');
      // }

      // Bail early if there is nothing to do.
      if (record.dbId in this._records) {
        return;
      }

      // Update the internal state.
      this._records[record.dbId] = record;
      this._size++;

      // Parent the record if needed.
      // this._dbImpl.addParentIfNeeded(table, record);

      // Register the change.
      this._dbImpl.registerTableChange(this, undefined, record);
    }

    delete(id: string): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Get the record object.
      let record = this._records[id];

      // Bail early if there is nothing to do.
      if (record === undefined) {
        return;
      }

      // Update the internal state.
      delete this._records[id];
      this._size--;

      // Unparent the record if needed.
      // this._dbImpl.removeParentIfNeeded(this, record);

      // Register the change.
      this._dbImpl.registerTableChange(this, record, undefined);
    }

    clear(): void {
      // Guard against disallowed mutations.
      this._dbImpl.mutationGuard();

      // Bail early if there is nothing to do.
      if (this._size === 0) {
        return;
      }

      // Iterate over the records.
      for (let id in this._records) {
        // Fetch the record.
        let record = this._records[id];

        // Update the internal state.
        delete this._records[id];
        this._size--;

        // Unparent the record if needed.
        // this._dbImpl.removeParentIfNeeded(this, record);

        // Register the change.
        this._dbImpl.registerTableChange(this, record, undefined);
      }
    }

    private _size = 0;
    private _dbToken: Token<T>;
    private _records: { [id: string]: LocalDBRecord<T> } = Object.create(null);
  }
}
