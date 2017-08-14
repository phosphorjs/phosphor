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
  DBRecord, IDBList, IDBMap, IDBString, IDBTable, IModelDB
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

    constructor(dbModel: LocalModelDB) {
      this._dbModel = dbModel;
    }

    //-------------------------------------------------------------------------
    // DB Methods
    //-------------------------------------------------------------------------

    get dbModel(): IModelDB {
      return this._dbModel;
    }

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
      this._mutationGuard();

      // Create and initialize the list.
      let list = new LocalDBList<T>(this);
      this._createInternalListState(list, values);

      // Return the new list.
      return list;
    }

    createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IDBMap<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the map.
      let map = new LocalDBMap<T>(this);
      this._createInternalMapState(map, items);

      // Return the new map.
      return map;
    }

    createString(value?: string): IDBString {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the string.
      let str = new LocalDBString(this);
      this._createInternalStringState(str, value);

      // Return the new string.
      return str;
    }

    createRecord<T extends DBRecord.State>(state: T): DBRecord<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the record.
      let record = cachedRecordFactory(state)(this);
      this._createInternalRecordState(record, state);

      // Return the new record.
      return record;
    }

    createTable<T extends DBRecord.State>(token: Token<T>, records?: IterableOrArrayLike<DBRecord<T>>): IDBTable<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Ensure the table does not already exist.
      if (this._tokenTableMap.has(token)) {
        throw new Error(`A table already exists for the token: '${token.name}'.`);
      }

      // Create and initialize the table.
      let table = new LocalDBTable<T>(token, this);
      this._createInternalTableState(table, records);

      // Store the table for the token.
      this._tokenTableMap.set(token, table);

      // Register the change.
      this._registerModelChange(undefined, table);

      // Return the new table.
      return table;
    }

    hasTable<T extends DBRecord.State>(token: Token<T>): boolean {
      return this._tokenTableMap.has(token);
    }

    getTable<T extends DBRecord.State>(token: Token<T>): IDBTable<T> {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Return the table.
      return table;
    }

    deleteTable<T extends DBRecord.State>(token: Token<T>): void {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Delete the table from the token map.
      this._tokenTableMap.delete(token);

      // Register the change.
      this._registerModelChange(table, undefined);
    }

    //-------------------------------------------------------------------------
    // List Methods
    //-------------------------------------------------------------------------




    //-------------------------------------------------------------------------
    // Map Methods
    //-------------------------------------------------------------------------

    mapChanged<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): ISignal<IDBMap<T>, IDBMap.ChangedArgs<T>> {
      return this._mapStateMap.get(map)!.changed;
    }

    mapDBParent<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): DBRecord<{}> | null {
      return this._mapStateMap.get(map)!.dbParent as DBRecord<{}> | null;
    }

    mapIsEmpty<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): boolean {
      return this._mapStateMap.get(map)!.size === 0;
    }

    mapSize<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): number {
      return this._mapStateMap.get(map)!.size;
    }

    mapIter<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<[string, T]> {
      return iterItems(this._mapStateMap.get(map)!.items);
    }

    mapKeys<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<string> {
      return iterKeys(this._mapStateMap.get(map)!.items);
    }

    mapValues<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<T> {
      return iterValues(this._mapStateMap.get(map)!.items);
    }

    mapHas<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): boolean {
      return key in this._mapStateMap.get(map)!.items;
    }

    mapGet<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): T | undefined {
      return this._mapStateMap.get(map)!.items[key];
    }

    mapSet<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Look up the current value.
      let current = state.items[key];

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal state.
      state.items[key] = value;
      state.size += +(current === undefined);

      // Register the change.
      this._registerMapChange(map, key, current, value);
    }

    mapDelete<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Look up the current value.
      let current = state.items[key];

      // Bail early if the key does not exist.
      if (current === undefined) {
        return;
      }

      // Update the internal state.
      delete state.items[key];
      state.size--;

      // Register the change.
      this._registerMapChange(map, key, current, undefined);
    }

    mapClear<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Bail early if there is nothing to do.
      if (state.size === 0) {
        return;
      }

      // Iterate over the items.
      for (let key in state.items) {
        // Fetch the value.
        let value = state.items[key];

        // Update the internal state.
        delete state.items[key];
        state.size--;

        // Register the change.
        this._registerMapChange(map, key, value, undefined);
      }
    }

    //-------------------------------------------------------------------------
    // String Methods
    //-------------------------------------------------------------------------

    stringChanged(str: LocalDBString): ISignal<IDBString, IDBString.ChangedArgs> {
      return this._stringStateMap.get(str)!.changed;
    }

    stringDBParent(str: LocalDBString): DBRecord<{}> | null {
      return this._stringStateMap.get(str)!.dbParent as DBRecord<{}> | null;
    }

    stringIsEmpty(str: LocalDBString): boolean {
      return this._stringStateMap.get(str)!.value.length === 0;
    }

    stringLength(str: LocalDBString): number {
      return this._stringStateMap.get(str)!.value.length;
    }

    stringGet(str: LocalDBString): string {
      return this._stringStateMap.get(str)!.value;
    }

    stringSet(str: LocalDBString, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Look up the current value.
      let current = state.value;

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal value.
      state.value = value;

      // Register the change.
      this._registerStringChange(str, 0, current, value);
    }

    stringAppend(str: LocalDBString, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Get the index of the modification.
      let index = state.value.length;

      // Update the internal value.
      state.value += value;

      // Register the change.
      this._registerStringChange(str, index, '', value);
    }

    stringInsert(str: LocalDBString, index: number, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Normalize the index for the insert.
      if (index < 0) {
        index = Math.max(0, index + state.value.length);
      } else {
        index = Math.min(index, state.value.length);
      }

      // Update the internal value.
      let prefix = state.value.slice(0, index);
      let suffix = state.value.slice(index);
      state.value = prefix + value + suffix;

      // Register the change.
      this._registerStringChange(str, index, '', value);
    }

    stringSplice(str: LocalDBString, index: number, count: number, value?: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Normalize the remove count.
      count = Math.max(0, count);

      // Normalize the added text.
      let added = value || '';

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Bail early if there is nothing to do.
      if (!added && (count === 0 || !state.value)) {
        return;
      }

      // Normalize the index for the splice.
      if (index < 0) {
        index = Math.max(0, index + state.value.length);
      } else {
        index = Math.min(index, state.value.length);
      }

      // Extract the removed portion of the string.
      let removed = state.value.slice(index, index + count);

      // Bail early if there is no effective change.
      if (removed === added) {
        return;
      }

      // Update the internal value.
      let prefix = state.value.slice(0, index);
      let suffix = state.value.slice(index + count);
      state.value = prefix + added + suffix;

      // Register the change.
      this._registerStringChange(str, index, removed, added);
    }

    stringClear(str: LocalDBString): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Bail early if there is nothing to do.
      if (!state.value) {
        return;
      }

      // Get the removed value.
      let removed = state.value;

      // Update the internal value.
      state.value = '';

      // Register the change.
      this._registerStringChange(str, 0, removed, '');
    }

    //-------------------------------------------------------------------------
    // Record Methods
    //-------------------------------------------------------------------------

    recordChanged<T extends DBRecord.State>(record: LocalDBRecord<T>): ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>> {
      return this._recordStateMap.get(record)!.changed;
    }

    recordDBParent<T extends DBRecord.State>(record: LocalDBRecord<T>): IDBTable<T> | null {
      return this._recordStateMap.get(record)!.dbParent;
    }

    recordGet<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K): T[K] {
      return this._recordStateMap.get(record)!.data[name];
    }

    recordSet<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, value: T[K]): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // TODO validate the value

      // Fetch the state object.
      let state = this._recordStateMap.get(record)!;

      // Look up the current value.
      let old = state.data[name];

      // Bail early if there is no effective change.
      if (old === value) {
        return;
      }

      // Update the internal value.
      state.data[name] = value;

      // Unparent the old value if needed.
      this._removeParentIfNeeded(record, old);

      // Parent the new value if needed.
      this._addParentIfNeeded(record, value);

      // Register the change.
      this._registerRecordChange(record, name, old, value);
    }

    //-------------------------------------------------------------------------
    // Table Methods
    //-------------------------------------------------------------------------

    tableChanged<T extends DBRecord.State>(table: LocalDBTable<T>): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
      return this._tableStateMap.get(table)!.changed;
    }

    tableIsEmpty<T extends DBRecord.State>(table: LocalDBTable<T>): boolean {
      return this._tableStateMap.get(table)!.size === 0;
    }

    tableSize<T extends DBRecord.State>(table: LocalDBTable<T>): number {
      return this._tableStateMap.get(table)!.size;
    }

    tableIter<T extends DBRecord.State>(table: LocalDBTable<T>): IIterator<DBRecord<T>> {
      return iterValues(this._tableStateMap.get(table)!.records);
    }

    tableHas<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): boolean {
      return id in this._tableStateMap.get(table)!.records;
    }

    tableGet<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): DBRecord<T> | undefined {
      return this._tableStateMap.get(table)!.records[id];
    }

    tableInsert<T extends DBRecord.State>(table: LocalDBTable<T>, record: DBRecord<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Validate the type of the record.
      if (!(record instanceof LocalDBRecord)) {
        throw new Error('Record was not created by this model db.');
      }

      // Fetch the record state.
      let recordState = this._recordStateMap.get(record);

      // Validate the ownership of the record.
      if (!recordState) {
        throw new Error('Record was not created by this model db.');
      }

      // Ensure the record does not have a parent.
      if (recordState.dbParent) {
        throw new Error('Record already belongs to another table.');
      }

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Bail early if there is nothing to do.
      if (record.dbId in state.records) {
        return;
      }

      // Update the internal state.
      state.records[record.dbId] = record;
      state.size++;

      // Parent the record if needed.
      this._addParentIfNeeded(table, record);

      // Register the change.
      this._registerTableChange(table, undefined, record);
    }

    tableDelete<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Get the record object.
      let record = state.records[id];

      // Bail early if there is nothing to do.
      if (record === undefined) {
        return;
      }

      // Update the internal state.
      delete state.records[id];
      state.size--;

      // Unparent the record if needed.
      this._removeParentIfNeeded(table, record);

      // Register the change.
      this._registerTableChange(table, record, undefined);
    }

    tableClear<T extends DBRecord.State>(table: LocalDBTable<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Bail early if there is nothing to do.
      if (state.size === 0) {
        return;
      }

      // Iterate over the records.
      for (let id in state.records) {
        // Fetch the record.
        let record = state.records[id];

        // Update the internal state.
        delete state.records[id];
        state.size--;

        // Unparent the record if needed.
        this._removeParentIfNeeded(table, record);

        // Register the change.
        this._registerTableChange(table, record, undefined);
      }
    }

    //-------------------------------------------------------------------------
    // Private Methods
    //-------------------------------------------------------------------------

    private _mutationGuard(): void {
      if (!this._inTransaction) {
        throw new Error('DB mutation is only allowed within transaction.');
      }
    }

    private _createInternalListState<T extends ReadonlyJSONValue>(list: LocalDBList<T>, initial?: IterableOrArrayLike<T>): void {
      // Create the changed signal.
      let changed = new Signal<IDBList<T>, IDBList.ChangedArgs<T>>(list);

      // Create the values array.
      let values = initial ? toArray(initial) : [];

      // Create the internal list state.
      let listState: ListState<T> = { changed, values, dbParent: null };

      // Add the state to the internal state map.
      this._listStateMap.set(list, listState);
    }

    private _createInternalMapState<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, initial?: { [key: string]: T }): void {
      // Create the changed signal.
      let changed = new Signal<IDBMap<T>, IDBMap.ChangedArgs<T>>(map);

      // Create the initial items.
      let size = 0;
      let items: { [key: string]: T } = Object.create(null);

      // Update the initial items.
      if (initial) {
        for (let key in initial) {
          items[key] = initial[key];
          size++;
        }
      }

      // Create the internal map state.
      let mapState: MapState<T> = { changed, size, items, dbParent: null };

      // Add the state to the internal state map.
      this._mapStateMap.set(map, mapState);
    }

    private _createInternalStringState(str: LocalDBString, initial?: string): void {
      // Create the changed signal.
      let changed = new Signal<IDBString, IDBString.ChangedArgs>(str);

      // Create the initial value.
      let value = initial || '';

      // Create the internal string state.
      let stringState: StringState = { changed, value, dbParent: null };

      // Add the state to the internal map.
      this._stringStateMap.set(str, stringState);
    }

    private _createInternalRecordState<T extends DBRecord.State>(record: T & LocalDBRecord<T>, initial: T): void {
      // Create the changed signal.
      let changed = new Signal<DBRecord<T>, DBRecord.ChangedArgs<T>>(record);

      // Create the initial data.
      let data = { ...(initial as any) } as T;

      // TODO validate children and set up parent refs.

      // Create the internal record state.
      let recordState: RecordState<T> = { changed, data, dbParent: null };

      // Add the state to the internal map.
      this._recordStateMap.set(record, recordState);
    }

    private _createInternalTableState<T extends DBRecord.State>(table: LocalDBTable<T>, initial?: IterableOrArrayLike<DBRecord<T>>): void {
      // Create the changed signal.
      let changed = new Signal<IDBTable<T>, IDBTable.ChangedArgs<T>>(table);

      // Create the initial records.
      let size = 0;
      let records: { [key: string]: DBRecord<T> } = Object.create(null);

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

      // Create the internal table state.
      let tableState: TableState<T> = { changed, size, records };

      // Add the state to the internal map.
      this._tableStateMap.set(table, tableState);
    }

    private _registerModelChange(removed: LocalDBTable<{}> | undefined, added: LocalDBTable<{}> | undefined): void {

    }

    private _registerListChange<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, removed: ReadonlyArray<T>, added: ReadonlyArray<T>): void {

    }

    private _registerMapChange<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, removed: T | undefined, added: T | undefined): void {

    }

    private _registerStringChange(str: LocalDBString, index: number, removed: string, added: string): void {

    }

    private _registerRecordChange<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, oldValue: T[K], newValue: T[K]): void {

    }

    private _registerTableChange<T extends DBRecord.State>(table: LocalDBTable<T>, removed: DBRecord<T> | undefined, added: DBRecord<T> | undefined): void {

    }

    private _setObjectParent(object: IDBList | IDBMap | IDBString, record: DBRecord<{}>): void {

    }

    private _setRecordParent<T extends DBRecord.State>(record: DBRecord<T>, table: LocalDBTable<T>): void {
      // Fetch the record state.
      let state = this._recordStateMap.get(record as any);

      // Validate the ownership of the record.
      if (!state) {
        throw new Error('Record was not created by this model db.');
      }

      // Ensure the record does not have a parent.
      if (state.dbParent) {
        throw new Error('Record already belongs to another table.');
      }

      // Set the parent of the record.
      state.parent = table;
    }

    private _dbModel: LocalModelDB;
    private _inTransaction = false;
    private _tokenTableMap = new Map<Token<any>, LocalDBTable<any>>();
    private _stringStateMap = new WeakMap<LocalDBString, StringState>();
    private _mapStateMap = new WeakMap<LocalDBMap<any>, MapState<any>>();
    private _listStateMap = new WeakMap<LocalDBList<any>, ListState<any>>();
    private _tableStateMap = new WeakMap<LocalDBTable<any>, TableState<any>>();
    private _recordStateMap = new WeakMap<LocalDBRecord<any>, RecordState<any>>();
  }

  /**
   * A type alias for the internal state of a db list.
   */
  type ListState<T extends ReadonlyJSONValue> = {
    changed: Signal<LocalDBList<T>, IDBList.ChangedArgs<T>>;
    values: T[];
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db map.
   */
  type MapState<T extends ReadonlyJSONValue> = {
    changed: Signal<LocalDBMap<T>, IDBMap.ChangedArgs<T>>;
    size: number;
    items: { [key: string]: T };
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db string.
   */
  type StringState = {
    changed: Signal<LocalDBString, IDBString.ChangedArgs>;
    value: string;
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db record.
   */
  type RecordState<T extends DBRecord.State> = {
    changed: Signal<LocalDBRecord<T>, DBRecord.ChangedArgs<T>>;
    data: T;
    dbParent: LocalDBTable<T> | null;
  };

  /**
   * A type alias for the internal state of a db table.
   */
  type TableState<T extends DBRecord.State> = {
    changed: Signal<LocalDBTable<T>, IDBTable.ChangedArgs<T>>;
    size: number;
    records: { [key: string]: LocalDBRecord<T> };
  };

  /**
   * A concrete implementation of `IDBList`.
   */
  class LocalDBList<T extends ReadonlyJSONValue> implements IDBList<T> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBList<T>, IDBList.ChangedArgs<T>> {
      return this._changed;
    }

    get dbType(): 'list' {
      return 'list';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbParent;
    }

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
      return ArrayExt.indexOf(this._values, value, start, stop);
    }

    lastIndexOf(value: T, start?: number, stop?: number): number {
      return ArrayExt.lastIndexOf(this._values);
    }

    findIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return ArrayExt.findFirstIndex(this./*-----------------------------------------------------------------------------
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
  DBRecord, IDBList, IDBMap, IDBString, IDBTable, IModelDB
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

    constructor(dbModel: LocalModelDB) {
      this._dbModel = dbModel;
    }

    //-------------------------------------------------------------------------
    // DB Methods
    //-------------------------------------------------------------------------

    get dbModel(): IModelDB {
      return this._dbModel;
    }

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
      this._mutationGuard();

      // Create and initialize the list.
      let list = new LocalDBList<T>(this);
      this._createInternalListState(list, values);

      // Return the new list.
      return list;
    }

    createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IDBMap<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the map.
      let map = new LocalDBMap<T>(this);
      this._createInternalMapState(map, items);

      // Return the new map.
      return map;
    }

    createString(value?: string): IDBString {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the string.
      let str = new LocalDBString(this);
      this._createInternalStringState(str, value);

      // Return the new string.
      return str;
    }

    createRecord<T extends DBRecord.State>(state: T): DBRecord<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the record.
      let record = cachedRecordFactory(state)(this);
      this._createInternalRecordState(record, state);

      // Return the new record.
      return record;
    }

    createTable<T extends DBRecord.State>(token: Token<T>, records?: IterableOrArrayLike<DBRecord<T>>): IDBTable<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Ensure the table does not already exist.
      if (this._tokenTableMap.has(token)) {
        throw new Error(`A table already exists for the token: '${token.name}'.`);
      }

      // Create and initialize the table.
      let table = new LocalDBTable<T>(token, this);
      this._createInternalTableState(table, records);

      // Store the table for the token.
      this._tokenTableMap.set(token, table);

      // Register the change.
      this._registerModelChange(undefined, table);

      // Return the new table.
      return table;
    }

    hasTable<T extends DBRecord.State>(token: Token<T>): boolean {
      return this._tokenTableMap.has(token);
    }

    getTable<T extends DBRecord.State>(token: Token<T>): IDBTable<T> {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Return the table.
      return table;
    }

    deleteTable<T extends DBRecord.State>(token: Token<T>): void {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Delete the table from the token map.
      this._tokenTableMap.delete(token);

      // Register the change.
      this._registerModelChange(table, undefined);
    }

    //-------------------------------------------------------------------------
    // List Methods
    //-------------------------------------------------------------------------

    listChanged<T extends ReadonlyJSONValue>(list: LocalDBList<T>): ISignal<IDBList<T>, IDBList.ChangedArgs<T>> {
      return this._listStateMap.get(list)!.changed;
    }

    listDBParent<T extends ReadonlyJSONValue>(list: LocalDBList<T>): DBRecord<{}> | null {
      return this._listStateMap.get(list)!.dbParent as DBRecord<{}> | null;
    }

    listIsEmpty<T extends ReadonlyJSONValue>(list: LocalDBList<T>): boolean {
      return this._listStateMap.get(list)!.values.length === 0;
    }

    listLength<T extends ReadonlyJSONValue>(list: LocalDBList<T>): number {
      return this._listStateMap.get(list)!.values.length;
    }

    listIter<T extends ReadonlyJSONValue>(list: LocalDBList<T>): IIterator<T> {
      return iter(this._listStateMap.get(list)!.values);
    }

    listRetro<T extends ReadonlyJSONValue>(list: LocalDBList<T>): IIterator<T> {
      return retro(this._listStateMap.get(list)!.values);
    }

    listIndexOf<T extends ReadonlyJSONValue>(list: LocalDBList<T>, value: T, start?: number, stop?: number): number {
      return ArrayExt.firstIndexOf(this._listStateMap.get(list)!.values, value, start, stop);
    }

    listLastIndexOf<T extends ReadonlyJSONValue>(list: LocalDBList<T>, value: T, start?: number, stop?: number): number {
      return ArrayExt.lastIndexOf(this._listStateMap.get(list)!.values, value, start, stop);
    }

    listFindIndex<T extends ReadonlyJSONValue>(list: LocalDBList<T>, fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return ArrayExt.findFirstIndex(this._listStateMap.get(list)!.values, fn, start, stop);
    }

    listFindLastIndex<T extends ReadonlyJSONValue>(list: LocalDBList<T>, fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return ArrayExt.findLastIndex(this._listStateMap.get(list)!.values, fn, start, stop);
    }

    listFirst<T extends ReadonlyJSONValue>(list: LocalDBList<T>): T | undefined {
      return this.listGet(list, 0);
    }

    listLast<T extends ReadonlyJSONValue>(list: LocalDBList<T>): T | undefined {
      return this.listGet(list, -1);
    }

    listGet<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number): T | undefined {
      let values = this._listStateMap.get(list)!.values;
      return values[index < 0 ? index + values.length : index];
    }

    listSet<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Wrap the index for negative offsets.
      if (index < 0) {
        index += values.length;
      }

      // Bail early if the index is out of range.
      if (index < 0 || index >= values.length) {
        return;
      }

      // Look up the current value.
      let current = values[index];

      // Bail early if the value does not change.
      if (current === value) {
        return;
      }

      // Update the internal value.
      values[index] = value;

      // Register the change.
      this._registerListChange(list, index, [current], [value]);
    }

    listPush<T extends ReadonlyJSONValue>(list: LocalDBList<T>, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Get the index of the modification.
      let index = values.length;

      // Update the list.
      values.push(value);

      // Register the change.
      this._registerListChange(list, index, [], [value]);
    }

    listInsert<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Normalize the index for the insert.
      if (index < 0) {
        index = Math.max(0, index + values.length);
      } else {
        index = Math.min(index, values.length);
      }

      // Update the list.
      ArrayExt.insert(values, index, value);

      // Register the change.
      this._registerListChange(list, index, [], [value]);
    }

    listRemove<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Wrap the index for negative offsets.
      if (index < 0) {
        index += values.length;
      }

      // Bail early if the index is out of range.
      if (index < 0 || index >= values.length) {
        return;
      }

      // Remove the value from the array.
      let removed = ArrayExt.removeAt(values, index)!;

      // Register the change.
      this._registerListChange(list, index, [removed], []);
    }

    listSplice<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, count: number, values?: IterableOrArrayLike<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Normalize the remove count.
      count = Math.max(0, count);

      // Normalize the added values.
      let added = values ? toArray(values) : [];

      // Fetch the internal state.
      let state = this._listStateMap.get(list)!;

      // Bail early if there is nothing to do.
      if (added.length === 0 && (count === 0 || state.values.length === 0)) {
        return;
      }

      // Normalize the index for the splice.
      if (index < 0) {
        index = Math.max(0, index + state.values.length);
      } else {
        index = Math.min(index, state.values.length);
      }

      // Update the internal list.
      let removed = state.values.splice(index, count, ...added);

      // Bail early if there is no effective change.
      if (shallowEqual(removed, added)) {
        return;
      }

      // Register the change.
      this._registerListChange(list, index, removed, added);
    }

    listClear<T extends ReadonlyJSONValue>(list: LocalDBList<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Bail early if there is no effective change.
      if (values.length === 0) {
        return;
      }

      // Shallow copy the list.
      let removed = values.slice();

      // Clear the list contents.
      values.length = 0;

      // Register the change.
      this._registerListChange(list, 0, removed, []);
    }

    //-------------------------------------------------------------------------
    // Map Methods
    //-------------------------------------------------------------------------

    mapChanged<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): ISignal<IDBMap<T>, IDBMap.ChangedArgs<T>> {
      return this._mapStateMap.get(map)!.changed;
    }

    mapDBParent<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): DBRecord<{}> | null {
      return this._mapStateMap.get(map)!.dbParent as DBRecord<{}> | null;
    }

    mapIsEmpty<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): boolean {
      return this._mapStateMap.get(map)!.size === 0;
    }

    mapSize<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): number {
      return this._mapStateMap.get(map)!.size;
    }

    mapIter<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<[string, T]> {
      return iterItems(this._mapStateMap.get(map)!.items);
    }

    mapKeys<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<string> {
      return iterKeys(this._mapStateMap.get(map)!.items);
    }

    mapValues<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<T> {
      return iterValues(this._mapStateMap.get(map)!.items);
    }

    mapHas<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): boolean {
      return key in this._mapStateMap.get(map)!.items;
    }

    mapGet<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): T | undefined {
      return this._mapStateMap.get(map)!.items[key];
    }

    mapSet<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Look up the current value.
      let current = state.items[key];

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal state.
      state.items[key] = value;
      state.size += +(current === undefined);

      // Register the change.
      this._registerMapChange(map, key, current, value);
    }

    mapDelete<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Look up the current value.
      let current = state.items[key];

      // Bail early if the key does not exist.
      if (current === undefined) {
        return;
      }

      // Update the internal state.
      delete state.items[key];
      state.size--;

      // Register the change.
      this._registerMapChange(map, key, current, undefined);
    }

    mapClear<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Bail early if there is nothing to do.
      if (state.size === 0) {
        return;
      }

      // Iterate over the items.
      for (let key in state.items) {
        // Fetch the value.
        let value = state.items[key];

        // Update the internal state.
        delete state.items[key];
        state.size--;

        // Register the change.
        this._registerMapChange(map, key, value, undefined);
      }
    }

    //-------------------------------------------------------------------------
    // String Methods
    //-------------------------------------------------------------------------

    stringChanged(str: LocalDBString): ISignal<IDBString, IDBString.ChangedArgs> {
      return this._stringStateMap.get(str)!.changed;
    }

    stringDBParent(str: LocalDBString): DBRecord<{}> | null {
      return this._stringStateMap.get(str)!.dbParent as DBRecord<{}> | null;
    }

    stringIsEmpty(str: LocalDBString): boolean {
      return this._stringStateMap.get(str)!.value.length === 0;
    }

    stringLength(str: LocalDBString): number {
      return this._stringStateMap.get(str)!.value.length;
    }

    stringGet(str: LocalDBString): string {
      return this._stringStateMap.get(str)!.value;
    }

    stringSet(str: LocalDBString, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Look up the current value.
      let current = state.value;

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal value.
      state.value = value;

      // Register the change.
      this._registerStringChange(str, 0, current, value);
    }

    stringAppend(str: LocalDBString, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Get the index of the modification.
      let index = state.value.length;

      // Update the internal value.
      state.value += value;

      // Register the change.
      this._registerStringChange(str, index, '', value);
    }

    stringInsert(str: LocalDBString, index: number, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Normalize the index for the insert.
      if (index < 0) {
        index = Math.max(0, index + state.value.length);
      } else {
        index = Math.min(index, state.value.length);
      }

      // Update the internal value.
      let prefix = state.value.slice(0, index);
      let suffix = state.value.slice(index);
      state.value = prefix + value + suffix;

      // Register the change.
      this._registerStringChange(str, index, '', value);
    }

    stringSplice(str: LocalDBString, index: number, count: number, value?: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Normalize the remove count.
      count = Math.max(0, count);

      // Normalize the added text.
      let added = value || '';

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Bail early if there is nothing to do.
      if (!added && (count === 0 || !state.value)) {
        return;
      }

      // Normalize the index for the splice.
      if (index < 0) {
        index = Math.max(0, index + state.value.length);
      } else {
        index = Math.min(index, state.value.length);
      }

      // Extract the removed portion of the string.
      let removed = state.value.slice(index, index + count);

      // Bail early if there is no effective change.
      if (removed === added) {
        return;
      }

      // Update the internal value.
      let prefix = state.value.slice(0, index);
      let suffix = state.value.slice(index + count);
      state.value = prefix + added + suffix;

      // Register the change.
      this._registerStringChange(str, index, removed, added);
    }

    stringClear(str: LocalDBString): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Bail early if there is nothing to do.
      if (!state.value) {
        return;
      }

      // Get the removed value.
      let removed = state.value;

      // Update the internal value.
      state.value = '';

      // Register the change.
      this._registerStringChange(str, 0, removed, '');
    }

    //-------------------------------------------------------------------------
    // Record Methods
    //-------------------------------------------------------------------------

    recordChanged<T extends DBRecord.State>(record: LocalDBRecord<T>): ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>> {
      return this._recordStateMap.get(record)!.changed;
    }

    recordDBParent<T extends DBRecord.State>(record: LocalDBRecord<T>): IDBTable<T> | null {
      return this._recordStateMap.get(record)!.dbParent;
    }

    recordGet<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K): T[K] {
      return this._recordStateMap.get(record)!.data[name];
    }

    recordSet<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, value: T[K]): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // TODO validate the value

      // Fetch the state object.
      let state = this._recordStateMap.get(record)!;

      // Look up the current value.
      let old = state.data[name];

      // Bail early if there is no effective change.
      if (old === value) {
        return;
      }

      // Update the internal value.
      state.data[name] = value;

      // Unparent the old value if needed.
      this._removeParentIfNeeded(record, old);

      // Parent the new value if needed.
      this._addParentIfNeeded(record, value);

      // Register the change.
      this._registerRecordChange(record, name, old, value);
    }

    //-------------------------------------------------------------------------
    // Table Methods
    //-------------------------------------------------------------------------

    tableChanged<T extends DBRecord.State>(table: LocalDBTable<T>): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
      return this._tableStateMap.get(table)!.changed;
    }

    tableIsEmpty<T extends DBRecord.State>(table: LocalDBTable<T>): boolean {
      return this._tableStateMap.get(table)!.size === 0;
    }

    tableSize<T extends DBRecord.State>(table: LocalDBTable<T>): number {
      return this._tableStateMap.get(table)!.size;
    }

    tableIter<T extends DBRecord.State>(table: LocalDBTable<T>): IIterator<DBRecord<T>> {
      return iterValues(this._tableStateMap.get(table)!.records);
    }

    tableHas<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): boolean {
      return id in this._tableStateMap.get(table)!.records;
    }

    tableGet<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): DBRecord<T> | undefined {
      return this._tableStateMap.get(table)!.records[id];
    }

    tableInsert<T extends DBRecord.State>(table: LocalDBTable<T>, record: DBRecord<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Validate the type of the record.
      if (!(record instanceof LocalDBRecord)) {
        throw new Error('Record was not created by this model db.');
      }

      // Fetch the record state.
      let recordState = this._recordStateMap.get(record);

      // Validate the ownership of the record.
      if (!recordState) {
        throw new Error('Record was not created by this model db.');
      }

      // Ensure the record does not have a parent.
      if (recordState.dbParent) {
        throw new Error('Record already belongs to another table.');
      }

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Bail early if there is nothing to do.
      if (record.dbId in state.records) {
        return;
      }

      // Update the internal state.
      state.records[record.dbId] = record;
      state.size++;

      // Parent the record if needed.
      this._addParentIfNeeded(table, record);

      // Register the change.
      this._registerTableChange(table, undefined, record);
    }

    tableDelete<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Get the record object.
      let record = state.records[id];

      // Bail early if there is nothing to do.
      if (record === undefined) {
        return;
      }

      // Update the internal state.
      delete state.records[id];
      state.size--;

      // Unparent the record if needed.
      this._removeParentIfNeeded(table, record);

      // Register the change.
      this._registerTableChange(table, record, undefined);
    }

    tableClear<T extends DBRecord.State>(table: LocalDBTable<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Bail early if there is nothing to do.
      if (state.size === 0) {
        return;
      }

      // Iterate over the records.
      for (let id in state.records) {
        // Fetch the record.
        let record = state.records[id];

        // Update the internal state.
        delete state.records[id];
        state.size--;

        // Unparent the record if needed.
        this._removeParentIfNeeded(table, record);

        // Register the change.
        this._registerTableChange(table, record, undefined);
      }
    }

    //-------------------------------------------------------------------------
    // Private Methods
    //-------------------------------------------------------------------------

    private _mutationGuard(): void {
      if (!this._inTransaction) {
        throw new Error('DB mutation is only allowed within transaction.');
      }
    }

    private _createInternalMapState<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, initial?: { [key: string]: T }): void {
      // Create the changed signal.
      let changed = new Signal<IDBMap<T>, IDBMap.ChangedArgs<T>>(map);

      // Create the initial items.
      let size = 0;
      let items: { [key: string]: T } = Object.create(null);

      // Update the initial items.
      if (initial) {
        for (let key in initial) {
          items[key] = initial[key];
          size++;
        }
      }

      // Create the internal map state.
      let mapState: MapState<T> = { changed, size, items, dbParent: null };

      // Add the state to the internal state map.
      this._mapStateMap.set(map, mapState);
    }

    private _createInternalStringState(str: LocalDBString, initial?: string): void {
      // Create the changed signal.
      let changed = new Signal<IDBString, IDBString.ChangedArgs>(str);

      // Create the initial value.
      let value = initial || '';

      // Create the internal string state.
      let stringState: StringState = { changed, value, dbParent: null };

      // Add the state to the internal map.
      this._stringStateMap.set(str, stringState);
    }

    private _createInternalRecordState<T extends DBRecord.State>(record: T & LocalDBRecord<T>, initial: T): void {
      // Create the changed signal.
      let changed = new Signal<DBRecord<T>, DBRecord.ChangedArgs<T>>(record);

      // Create the initial data.
      let data = { ...(initial as any) } as T;

      // TODO validate children and set up parent refs.

      // Create the internal record state.
      let recordState: RecordState<T> = { changed, data, dbParent: null };

      // Add the state to the internal map.
      this._recordStateMap.set(record, recordState);
    }

    private _createInternalTableState<T extends DBRecord.State>(table: LocalDBTable<T>, initial?: IterableOrArrayLike<DBRecord<T>>): void {
      // Create the changed signal.
      let changed = new Signal<IDBTable<T>, IDBTable.ChangedArgs<T>>(table);

      // Create the initial records.
      let size = 0;
      let records: { [key: string]: DBRecord<T> } = Object.create(null);

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

      // Create the internal table state.
      let tableState: TableState<T> = { changed, size, records };

      // Add the state to the internal map.
      this._tableStateMap.set(table, tableState);
    }

    private _registerModelChange(removed: LocalDBTable<{}> | undefined, added: LocalDBTable<{}> | undefined): void {

    }

    private _registerListChange<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, removed: ReadonlyArray<T>, added: ReadonlyArray<T>): void {

    }

    private _registerMapChange<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, removed: T | undefined, added: T | undefined): void {

    }

    private _registerStringChange(str: LocalDBString, index: number, removed: string, added: string): void {

    }

    private _registerRecordChange<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, oldValue: T[K], newValue: T[K]): void {

    }

    private _registerTableChange<T extends DBRecord.State>(table: LocalDBTable<T>, removed: DBRecord<T> | undefined, added: DBRecord<T> | undefined): void {

    }

    private _setObjectParent(object: IDBList | IDBMap | IDBString, record: DBRecord<{}>): void {

    }

    private _setRecordParent<T extends DBRecord.State>(record: DBRecord<T>, table: LocalDBTable<T>): void {
      // Fetch the record state.
      let state = this._recordStateMap.get(record as any);

      // Validate the ownership of the record.
      if (!state) {
        throw new Error('Record was not created by this model db.');
      }

      // Ensure the record does not have a parent.
      if (state.dbParent) {
        throw new Error('Record already belongs to another table.');
      }

      // Set the parent of the record.
      state.parent = table;
    }

    private _dbModel: LocalModelDB;
    private _inTransaction = false;
    private _tokenTableMap = new Map<Token<any>, LocalDBTable<any>>();
    private _stringStateMap = new WeakMap<LocalDBString, StringState>();
    private _mapStateMap = new WeakMap<LocalDBMap<any>, MapState<any>>();
    private _listStateMap = new WeakMap<LocalDBList<any>, ListState<any>>();
    private _tableStateMap = new WeakMap<LocalDBTable<any>, TableState<any>>();
    private _recordStateMap = new WeakMap<LocalDBRecord<any>, RecordState<any>>();
  }

  /**
   * A type alias for the internal state of a db map.
   */
  type MapState<T extends ReadonlyJSONValue> = {
    changed: Signal<LocalDBMap<T>, IDBMap.ChangedArgs<T>>;
    size: number;
    items: { [key: string]: T };
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db string.
   */
  type StringState = {
    changed: Signal<LocalDBString, IDBString.ChangedArgs>;
    value: string;
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db record.
   */
  type RecordState<T extends DBRecord.State> = {
    changed: Signal<LocalDBRecord<T>, DBRecord.ChangedArgs<T>>;
    data: T;
    dbParent: LocalDBTable<T> | null;
  };

  /**
   * A type alias for the internal state of a db table.
   */
  type TableState<T extends DBRecord.State> = {
    changed: Signal<LocalDBTable<T>, IDBTable.ChangedArgs<T>>;
    size: number;
    records: { [key: string]: LocalDBRecord<T> };
  };

  /**
   * A concrete implementation of `IDBList`.
   */
  class LocalDBList<T extends ReadonlyJSONValue> implements IDBList<T> {

    constructor(dbImpl: LocalDBImpl, values?: IterableOrArrayLike<T>) {
      this._dbImpl = dbImpl;
      this._values = values ? toArray(values) : [];
    }

    get changed(): ISignal<IDBList<T>, IDBList.ChangedArgs<T>> {
      return this._changed;
    }

    get dbType(): 'list' {
      return 'list';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbParent;
    }

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
      return ArrayExt.indexOf(this._values, value, start, stop);
    }

    lastIndexOf(value: T, start?: number, stop?: number): number {
      return ArrayExt.lastIndexOf(this._values)
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
      if (shallowEqual(removed, added)) {
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

    private _values: T[];
    private _dbId = UUID.uuid4();
    private _dbImpl: LocalDBImpl;
    private _dbParent: LocalDBRecord<{}> | null = null;
    private _changed = new Signal<this, IDBList.ChangedArgs<T>>(this);
  }

  /**
   * A concrete implementation of `IDBMap`.
   */
  class LocalDBMap<T extends ReadonlyJSONValue> implements IDBMap<T> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBMap<T>, IDBMap.ChangedArgs<T>> {
      return this._changed;
    }

    get dbType(): 'map' {
      return 'map';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbParent;
    }

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
      this._dbImpl.mapSet(this, key, value);
    }

    delete(key: string): void {
      this._dbImpl.mapDelete(this, key);
    }

    clear(): void {
      this._dbImpl.mapClear(this);
    }

    private _size = 0;
    private _dbId = UUID.uuid4();
    private _dbImpl: LocalDBImpl;
    private _dbParent: LocalDBRecord<{}> | null = null;
    private _items: { [key: string]: T } = Object.create(null);
    private _changed = new Signal<this, IDBMap.ChangedArgs<T>>;
  }

  /**
   * A concrete implementation of `IDBString`.
   */
  class LocalDBString implements IDBString {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBString, IDBString.ChangedArgs> {
      return this._dbImpl.stringChanged(this);
    }

    get dbType(): 'string' {
      return 'string';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbImpl.stringDBParent(this);
    }

    get isEmpty(): boolean {
      return this._dbImpl.stringIsEmpty(this);
    }

    get length(): number {
      return this._dbImpl.stringLength(this);
    }

    get(): string {
      return this._dbImpl.stringGet(this);
    }

    set(value: string): void {
      this._dbImpl.stringSet(this, value);
    }

    append(value: string): void {
      this._dbImpl.stringAppend(this, value);
    }

    insert(index: number, value: string): void {
      this._dbImpl.stringInsert(this, index, value);
    }

    splice(index: number, count: number, value?: string): void {
      this._dbImpl.stringSplice(this, index, count, value);
    }

    clear(): void {
      this._dbImpl.stringClear(this);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A concrete partial implementation of `DBRecord`.
   */
  class LocalDBRecordBase<T extends DBRecord.State> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>> {
      return this._dbImpl.recordChanged(this);
    }

    get dbType(): 'record' {
      return 'record';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): IDBTable<T> | null {
      return this._dbImpl.recordDBParent(this);
    }

    get<K extends keyof T>(name: K): T[K] {
      return this._dbImpl.recordGet(this, name);
    }

    set<K extends keyof T>(name: K, value: T[K]): void {
      this._dbImpl.recordSet(this, name, value);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A type alias for a concrete implementation of `DBRecord`.
   */
  type LocalDBRecord<T extends DBRecord.State> = T & LocalDBRecordBase<T>;

  /**
   * A type alias for a record factory function.
   */
  type RecordFactory<T extends DBRecord.State> = (dbImpl: LocalDBImpl) => LocalDBRecord<T>;

  /**
   * A concrete implementation of `IDBTable`.
   */
  class LocalDBTable<T extends DBRecord.State> implements IDBTable<T> {

    constructor(dbToken: Token<T>, dbImpl: LocalDBImpl) {
      this._dbToken = dbToken;
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
      return this._dbImpl.tableChanged(this);
    }

    get dbType(): 'table' {
      return 'table';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbToken(): Token<T> {
      return this._dbToken;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get isEmpty(): boolean {
      return this._dbImpl.tableIsEmpty(this);
    }

    get size(): number {
      return this._dbImpl.tableSize(this);
    }

    iter(): IIterator<DBRecord<T>> {
      return this._dbImpl.tableIter(this);
    }

    has(id: string): boolean {
      return this._dbImpl.tableHas(this, id);
    }

    get(id: string): DBRecord<T> | undefined {
      return this._dbImpl.tableGet(this, id);
    }

    insert(record: DBRecord<T>): void {
      this._dbImpl.tableInsert(this, record);
    }

    delete(id: string): void {
      this._dbImpl.tableDelete(this, id);
    }

    clear(): void {
      this._dbImpl.tableClear(this);
    }

    private _dbToken: Token<T>;
    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * An enum of the reserved property names for a record.
   */
  enum ReservedRecordNames {
    changed, dbType, dbId, dbModel, dbParent, get, set, _dbImpl, _dbId
  };

  /**
   * A cache of record factory functions.
   */
  const factoryCache: { [key: string]: RecordFactory<any> } = Object.create(null);

  /**
   * Get and/or create the cached record factory for a state object.
   */
  function cachedRecordFactory<T extends DBRecord.State>(state: T): RecordFactory<T> {
    // Get the property names for the record in canonical order.
    let names = Object.keys(state).sort();

    // Create a map key for the property names.
    let key = names.join(',');

    // Get and/or create the factory function for the record.
    return factoryCache[key] || (factoryCache[key] = createRecordFactory<T>(names));
  }

  /**
   * Create a factory function for creating full db records.
   */
  function createRecordFactory<T extends DBRecord.State>(names: string[]): RecordFactory<T> {
    // Create a new subclass for defining the named properties.
    const cls = class extends LocalDBRecordBase<T> { };

    // Define the record properties, disallowing reserved names.
    for (let name of names) {
      if (name in ReservedRecordNames) {
        throw new Error(`Invalid record property name: '${name}'`);
      }
      defineRecordProperty(cls.prototype, name);
    }

    // Return a factory function for the new class.
    return ((dbImpl: LocalDBImpl) => new cls(dbImpl)) as RecordFactory<T>;
  }

  /**
   * Define the get/set property for a record prototype.
   */
  function defineRecordProperty(proto: object, name: string): void {
    Object.defineProperty(proto, name, {
      get: function() { return this.get(name); },
      set: function(value: any) { this.set(name, value); },
      enumerable: true,
      configurable: true
    });
  }

  /**
   * Test two arrays for shallow equality.
   */
  function shallowEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, n = a.length; i < n; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
}
_, fn, start, stop);
    }

    findLastIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return this._dbImpl.listFindLastIndex(this./*-----------------------------------------------------------------------------
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
  DBRecord, IDBList, IDBMap, IDBString, IDBTable, IModelDB
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

    constructor(dbModel: LocalModelDB) {
      this._dbModel = dbModel;
    }

    //-------------------------------------------------------------------------
    // DB Methods
    //-------------------------------------------------------------------------

    get dbModel(): IModelDB {
      return this._dbModel;
    }

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
      this._mutationGuard();

      // Create and initialize the list.
      let list = new LocalDBList<T>(this);
      this._createInternalListState(list, values);

      // Return the new list.
      return list;
    }

    createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IDBMap<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the map.
      let map = new LocalDBMap<T>(this);
      this._createInternalMapState(map, items);

      // Return the new map.
      return map;
    }

    createString(value?: string): IDBString {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the string.
      let str = new LocalDBString(this);
      this._createInternalStringState(str, value);

      // Return the new string.
      return str;
    }

    createRecord<T extends DBRecord.State>(state: T): DBRecord<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Create and initialize the record.
      let record = cachedRecordFactory(state)(this);
      this._createInternalRecordState(record, state);

      // Return the new record.
      return record;
    }

    createTable<T extends DBRecord.State>(token: Token<T>, records?: IterableOrArrayLike<DBRecord<T>>): IDBTable<T> {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Ensure the table does not already exist.
      if (this._tokenTableMap.has(token)) {
        throw new Error(`A table already exists for the token: '${token.name}'.`);
      }

      // Create and initialize the table.
      let table = new LocalDBTable<T>(token, this);
      this._createInternalTableState(table, records);

      // Store the table for the token.
      this._tokenTableMap.set(token, table);

      // Register the change.
      this._registerModelChange(undefined, table);

      // Return the new table.
      return table;
    }

    hasTable<T extends DBRecord.State>(token: Token<T>): boolean {
      return this._tokenTableMap.has(token);
    }

    getTable<T extends DBRecord.State>(token: Token<T>): IDBTable<T> {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Return the table.
      return table;
    }

    deleteTable<T extends DBRecord.State>(token: Token<T>): void {
      // Fetch the table for the token.
      let table = this._tokenTableMap.get(token);

      // Ensure the table exists.
      if (!table) {
        throw new Error(`No table exists for token: '${token.name}'.`);
      }

      // Delete the table from the token map.
      this._tokenTableMap.delete(token);

      // Register the change.
      this._registerModelChange(table, undefined);
    }

    //-------------------------------------------------------------------------
    // List Methods
    //-------------------------------------------------------------------------

    listChanged<T extends ReadonlyJSONValue>(list: LocalDBList<T>): ISignal<IDBList<T>, IDBList.ChangedArgs<T>> {
      return this._listStateMap.get(list)!.changed;
    }

    listDBParent<T extends ReadonlyJSONValue>(list: LocalDBList<T>): DBRecord<{}> | null {
      return this._listStateMap.get(list)!.dbParent as DBRecord<{}> | null;
    }

    listIsEmpty<T extends ReadonlyJSONValue>(list: LocalDBList<T>): boolean {
      return this._listStateMap.get(list)!.values.length === 0;
    }

    listLength<T extends ReadonlyJSONValue>(list: LocalDBList<T>): number {
      return this._listStateMap.get(list)!.values.length;
    }

    listIter<T extends ReadonlyJSONValue>(list: LocalDBList<T>): IIterator<T> {
      return iter(this._listStateMap.get(list)!.values);
    }

    listRetro<T extends ReadonlyJSONValue>(list: LocalDBList<T>): IIterator<T> {
      return retro(this._listStateMap.get(list)!.values);
    }

    listIndexOf<T extends ReadonlyJSONValue>(list: LocalDBList<T>, value: T, start?: number, stop?: number): number {
      return ArrayExt.firstIndexOf(this._listStateMap.get(list)!.values, value, start, stop);
    }

    listLastIndexOf<T extends ReadonlyJSONValue>(list: LocalDBList<T>, value: T, start?: number, stop?: number): number {
      return ArrayExt.lastIndexOf(this._listStateMap.get(list)!.values, value, start, stop);
    }

    listFindIndex<T extends ReadonlyJSONValue>(list: LocalDBList<T>, fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return ArrayExt.findFirstIndex(this._listStateMap.get(list)!.values, fn, start, stop);
    }

    listFindLastIndex<T extends ReadonlyJSONValue>(list: LocalDBList<T>, fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return ArrayExt.findLastIndex(this._listStateMap.get(list)!.values, fn, start, stop);
    }

    listFirst<T extends ReadonlyJSONValue>(list: LocalDBList<T>): T | undefined {
      return this.listGet(list, 0);
    }

    listLast<T extends ReadonlyJSONValue>(list: LocalDBList<T>): T | undefined {
      return this.listGet(list, -1);
    }

    listGet<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number): T | undefined {
      let values = this._listStateMap.get(list)!.values;
      return values[index < 0 ? index + values.length : index];
    }

    listSet<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Wrap the index for negative offsets.
      if (index < 0) {
        index += values.length;
      }

      // Bail early if the index is out of range.
      if (index < 0 || index >= values.length) {
        return;
      }

      // Look up the current value.
      let current = values[index];

      // Bail early if the value does not change.
      if (current === value) {
        return;
      }

      // Update the internal value.
      values[index] = value;

      // Register the change.
      this._registerListChange(list, index, [current], [value]);
    }

    listPush<T extends ReadonlyJSONValue>(list: LocalDBList<T>, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Get the index of the modification.
      let index = values.length;

      // Update the list.
      values.push(value);

      // Register the change.
      this._registerListChange(list, index, [], [value]);
    }

    listInsert<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Normalize the index for the insert.
      if (index < 0) {
        index = Math.max(0, index + values.length);
      } else {
        index = Math.min(index, values.length);
      }

      // Update the list.
      ArrayExt.insert(values, index, value);

      // Register the change.
      this._registerListChange(list, index, [], [value]);
    }

    listRemove<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Wrap the index for negative offsets.
      if (index < 0) {
        index += values.length;
      }

      // Bail early if the index is out of range.
      if (index < 0 || index >= values.length) {
        return;
      }

      // Remove the value from the array.
      let removed = ArrayExt.removeAt(values, index)!;

      // Register the change.
      this._registerListChange(list, index, [removed], []);
    }

    listSplice<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, count: number, values?: IterableOrArrayLike<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Normalize the remove count.
      count = Math.max(0, count);

      // Normalize the added values.
      let added = values ? toArray(values) : [];

      // Fetch the internal state.
      let state = this._listStateMap.get(list)!;

      // Bail early if there is nothing to do.
      if (added.length === 0 && (count === 0 || state.values.length === 0)) {
        return;
      }

      // Normalize the index for the splice.
      if (index < 0) {
        index = Math.max(0, index + state.values.length);
      } else {
        index = Math.min(index, state.values.length);
      }

      // Update the internal list.
      let removed = state.values.splice(index, count, ...added);

      // Bail early if there is no effective change.
      if (shallowEqual(removed, added)) {
        return;
      }

      // Register the change.
      this._registerListChange(list, index, removed, added);
    }

    listClear<T extends ReadonlyJSONValue>(list: LocalDBList<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal values.
      let values = this._listStateMap.get(list)!.values;

      // Bail early if there is no effective change.
      if (values.length === 0) {
        return;
      }

      // Shallow copy the list.
      let removed = values.slice();

      // Clear the list contents.
      values.length = 0;

      // Register the change.
      this._registerListChange(list, 0, removed, []);
    }

    //-------------------------------------------------------------------------
    // Map Methods
    //-------------------------------------------------------------------------

    mapChanged<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): ISignal<IDBMap<T>, IDBMap.ChangedArgs<T>> {
      return this._mapStateMap.get(map)!.changed;
    }

    mapDBParent<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): DBRecord<{}> | null {
      return this._mapStateMap.get(map)!.dbParent as DBRecord<{}> | null;
    }

    mapIsEmpty<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): boolean {
      return this._mapStateMap.get(map)!.size === 0;
    }

    mapSize<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): number {
      return this._mapStateMap.get(map)!.size;
    }

    mapIter<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<[string, T]> {
      return iterItems(this._mapStateMap.get(map)!.items);
    }

    mapKeys<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<string> {
      return iterKeys(this._mapStateMap.get(map)!.items);
    }

    mapValues<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): IIterator<T> {
      return iterValues(this._mapStateMap.get(map)!.items);
    }

    mapHas<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): boolean {
      return key in this._mapStateMap.get(map)!.items;
    }

    mapGet<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): T | undefined {
      return this._mapStateMap.get(map)!.items[key];
    }

    mapSet<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, value: T): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Look up the current value.
      let current = state.items[key];

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal state.
      state.items[key] = value;
      state.size += +(current === undefined);

      // Register the change.
      this._registerMapChange(map, key, current, value);
    }

    mapDelete<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Look up the current value.
      let current = state.items[key];

      // Bail early if the key does not exist.
      if (current === undefined) {
        return;
      }

      // Update the internal state.
      delete state.items[key];
      state.size--;

      // Register the change.
      this._registerMapChange(map, key, current, undefined);
    }

    mapClear<T extends ReadonlyJSONValue>(map: LocalDBMap<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the internal state.
      let state = this._mapStateMap.get(map)!;

      // Bail early if there is nothing to do.
      if (state.size === 0) {
        return;
      }

      // Iterate over the items.
      for (let key in state.items) {
        // Fetch the value.
        let value = state.items[key];

        // Update the internal state.
        delete state.items[key];
        state.size--;

        // Register the change.
        this._registerMapChange(map, key, value, undefined);
      }
    }

    //-------------------------------------------------------------------------
    // String Methods
    //-------------------------------------------------------------------------

    stringChanged(str: LocalDBString): ISignal<IDBString, IDBString.ChangedArgs> {
      return this._stringStateMap.get(str)!.changed;
    }

    stringDBParent(str: LocalDBString): DBRecord<{}> | null {
      return this._stringStateMap.get(str)!.dbParent as DBRecord<{}> | null;
    }

    stringIsEmpty(str: LocalDBString): boolean {
      return this._stringStateMap.get(str)!.value.length === 0;
    }

    stringLength(str: LocalDBString): number {
      return this._stringStateMap.get(str)!.value.length;
    }

    stringGet(str: LocalDBString): string {
      return this._stringStateMap.get(str)!.value;
    }

    stringSet(str: LocalDBString, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Look up the current value.
      let current = state.value;

      // Bail early if there is no effective change.
      if (current === value) {
        return;
      }

      // Update the internal value.
      state.value = value;

      // Register the change.
      this._registerStringChange(str, 0, current, value);
    }

    stringAppend(str: LocalDBString, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Get the index of the modification.
      let index = state.value.length;

      // Update the internal value.
      state.value += value;

      // Register the change.
      this._registerStringChange(str, index, '', value);
    }

    stringInsert(str: LocalDBString, index: number, value: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Bail early if there is nothing to do.
      if (!value) {
        return;
      }

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Normalize the index for the insert.
      if (index < 0) {
        index = Math.max(0, index + state.value.length);
      } else {
        index = Math.min(index, state.value.length);
      }

      // Update the internal value.
      let prefix = state.value.slice(0, index);
      let suffix = state.value.slice(index);
      state.value = prefix + value + suffix;

      // Register the change.
      this._registerStringChange(str, index, '', value);
    }

    stringSplice(str: LocalDBString, index: number, count: number, value?: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Normalize the remove count.
      count = Math.max(0, count);

      // Normalize the added text.
      let added = value || '';

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Bail early if there is nothing to do.
      if (!added && (count === 0 || !state.value)) {
        return;
      }

      // Normalize the index for the splice.
      if (index < 0) {
        index = Math.max(0, index + state.value.length);
      } else {
        index = Math.min(index, state.value.length);
      }

      // Extract the removed portion of the string.
      let removed = state.value.slice(index, index + count);

      // Bail early if there is no effective change.
      if (removed === added) {
        return;
      }

      // Update the internal value.
      let prefix = state.value.slice(0, index);
      let suffix = state.value.slice(index + count);
      state.value = prefix + added + suffix;

      // Register the change.
      this._registerStringChange(str, index, removed, added);
    }

    stringClear(str: LocalDBString): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._stringStateMap.get(str)!;

      // Bail early if there is nothing to do.
      if (!state.value) {
        return;
      }

      // Get the removed value.
      let removed = state.value;

      // Update the internal value.
      state.value = '';

      // Register the change.
      this._registerStringChange(str, 0, removed, '');
    }

    //-------------------------------------------------------------------------
    // Record Methods
    //-------------------------------------------------------------------------

    recordChanged<T extends DBRecord.State>(record: LocalDBRecord<T>): ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>> {
      return this._recordStateMap.get(record)!.changed;
    }

    recordDBParent<T extends DBRecord.State>(record: LocalDBRecord<T>): IDBTable<T> | null {
      return this._recordStateMap.get(record)!.dbParent;
    }

    recordGet<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K): T[K] {
      return this._recordStateMap.get(record)!.data[name];
    }

    recordSet<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, value: T[K]): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // TODO validate the value

      // Fetch the state object.
      let state = this._recordStateMap.get(record)!;

      // Look up the current value.
      let old = state.data[name];

      // Bail early if there is no effective change.
      if (old === value) {
        return;
      }

      // Update the internal value.
      state.data[name] = value;

      // Unparent the old value if needed.
      this._removeParentIfNeeded(record, old);

      // Parent the new value if needed.
      this._addParentIfNeeded(record, value);

      // Register the change.
      this._registerRecordChange(record, name, old, value);
    }

    //-------------------------------------------------------------------------
    // Table Methods
    //-------------------------------------------------------------------------

    tableChanged<T extends DBRecord.State>(table: LocalDBTable<T>): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
      return this._tableStateMap.get(table)!.changed;
    }

    tableIsEmpty<T extends DBRecord.State>(table: LocalDBTable<T>): boolean {
      return this._tableStateMap.get(table)!.size === 0;
    }

    tableSize<T extends DBRecord.State>(table: LocalDBTable<T>): number {
      return this._tableStateMap.get(table)!.size;
    }

    tableIter<T extends DBRecord.State>(table: LocalDBTable<T>): IIterator<DBRecord<T>> {
      return iterValues(this._tableStateMap.get(table)!.records);
    }

    tableHas<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): boolean {
      return id in this._tableStateMap.get(table)!.records;
    }

    tableGet<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): DBRecord<T> | undefined {
      return this._tableStateMap.get(table)!.records[id];
    }

    tableInsert<T extends DBRecord.State>(table: LocalDBTable<T>, record: DBRecord<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Validate the type of the record.
      if (!(record instanceof LocalDBRecord)) {
        throw new Error('Record was not created by this model db.');
      }

      // Fetch the record state.
      let recordState = this._recordStateMap.get(record);

      // Validate the ownership of the record.
      if (!recordState) {
        throw new Error('Record was not created by this model db.');
      }

      // Ensure the record does not have a parent.
      if (recordState.dbParent) {
        throw new Error('Record already belongs to another table.');
      }

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Bail early if there is nothing to do.
      if (record.dbId in state.records) {
        return;
      }

      // Update the internal state.
      state.records[record.dbId] = record;
      state.size++;

      // Parent the record if needed.
      this._addParentIfNeeded(table, record);

      // Register the change.
      this._registerTableChange(table, undefined, record);
    }

    tableDelete<T extends DBRecord.State>(table: LocalDBTable<T>, id: string): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Get the record object.
      let record = state.records[id];

      // Bail early if there is nothing to do.
      if (record === undefined) {
        return;
      }

      // Update the internal state.
      delete state.records[id];
      state.size--;

      // Unparent the record if needed.
      this._removeParentIfNeeded(table, record);

      // Register the change.
      this._registerTableChange(table, record, undefined);
    }

    tableClear<T extends DBRecord.State>(table: LocalDBTable<T>): void {
      // Guard against disallowed mutations.
      this._mutationGuard();

      // Fetch the state object.
      let state = this._tableStateMap.get(table)!;

      // Bail early if there is nothing to do.
      if (state.size === 0) {
        return;
      }

      // Iterate over the records.
      for (let id in state.records) {
        // Fetch the record.
        let record = state.records[id];

        // Update the internal state.
        delete state.records[id];
        state.size--;

        // Unparent the record if needed.
        this._removeParentIfNeeded(table, record);

        // Register the change.
        this._registerTableChange(table, record, undefined);
      }
    }

    //-------------------------------------------------------------------------
    // Private Methods
    //-------------------------------------------------------------------------

    private _mutationGuard(): void {
      if (!this._inTransaction) {
        throw new Error('DB mutation is only allowed within transaction.');
      }
    }

    private _createInternalListState<T extends ReadonlyJSONValue>(list: LocalDBList<T>, initial?: IterableOrArrayLike<T>): void {
      // Create the changed signal.
      let changed = new Signal<IDBList<T>, IDBList.ChangedArgs<T>>(list);

      // Create the values array.
      let values = initial ? toArray(initial) : [];

      // Create the internal list state.
      let listState: ListState<T> = { changed, values, dbParent: null };

      // Add the state to the internal state map.
      this._listStateMap.set(list, listState);
    }

    private _createInternalMapState<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, initial?: { [key: string]: T }): void {
      // Create the changed signal.
      let changed = new Signal<IDBMap<T>, IDBMap.ChangedArgs<T>>(map);

      // Create the initial items.
      let size = 0;
      let items: { [key: string]: T } = Object.create(null);

      // Update the initial items.
      if (initial) {
        for (let key in initial) {
          items[key] = initial[key];
          size++;
        }
      }

      // Create the internal map state.
      let mapState: MapState<T> = { changed, size, items, dbParent: null };

      // Add the state to the internal state map.
      this._mapStateMap.set(map, mapState);
    }

    private _createInternalStringState(str: LocalDBString, initial?: string): void {
      // Create the changed signal.
      let changed = new Signal<IDBString, IDBString.ChangedArgs>(str);

      // Create the initial value.
      let value = initial || '';

      // Create the internal string state.
      let stringState: StringState = { changed, value, dbParent: null };

      // Add the state to the internal map.
      this._stringStateMap.set(str, stringState);
    }

    private _createInternalRecordState<T extends DBRecord.State>(record: T & LocalDBRecord<T>, initial: T): void {
      // Create the changed signal.
      let changed = new Signal<DBRecord<T>, DBRecord.ChangedArgs<T>>(record);

      // Create the initial data.
      let data = { ...(initial as any) } as T;

      // TODO validate children and set up parent refs.

      // Create the internal record state.
      let recordState: RecordState<T> = { changed, data, dbParent: null };

      // Add the state to the internal map.
      this._recordStateMap.set(record, recordState);
    }

    private _createInternalTableState<T extends DBRecord.State>(table: LocalDBTable<T>, initial?: IterableOrArrayLike<DBRecord<T>>): void {
      // Create the changed signal.
      let changed = new Signal<IDBTable<T>, IDBTable.ChangedArgs<T>>(table);

      // Create the initial records.
      let size = 0;
      let records: { [key: string]: DBRecord<T> } = Object.create(null);

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

      // Create the internal table state.
      let tableState: TableState<T> = { changed, size, records };

      // Add the state to the internal map.
      this._tableStateMap.set(table, tableState);
    }

    private _registerModelChange(removed: LocalDBTable<{}> | undefined, added: LocalDBTable<{}> | undefined): void {

    }

    private _registerListChange<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, removed: ReadonlyArray<T>, added: ReadonlyArray<T>): void {

    }

    private _registerMapChange<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, removed: T | undefined, added: T | undefined): void {

    }

    private _registerStringChange(str: LocalDBString, index: number, removed: string, added: string): void {

    }

    private _registerRecordChange<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, oldValue: T[K], newValue: T[K]): void {

    }

    private _registerTableChange<T extends DBRecord.State>(table: LocalDBTable<T>, removed: DBRecord<T> | undefined, added: DBRecord<T> | undefined): void {

    }

    private _setObjectParent(object: IDBList | IDBMap | IDBString, record: DBRecord<{}>): void {

    }

    private _setRecordParent<T extends DBRecord.State>(record: DBRecord<T>, table: LocalDBTable<T>): void {
      // Fetch the record state.
      let state = this._recordStateMap.get(record as any);

      // Validate the ownership of the record.
      if (!state) {
        throw new Error('Record was not created by this model db.');
      }

      // Ensure the record does not have a parent.
      if (state.dbParent) {
        throw new Error('Record already belongs to another table.');
      }

      // Set the parent of the record.
      state.parent = table;
    }

    private _dbModel: LocalModelDB;
    private _inTransaction = false;
    private _tokenTableMap = new Map<Token<any>, LocalDBTable<any>>();
    private _stringStateMap = new WeakMap<LocalDBString, StringState>();
    private _mapStateMap = new WeakMap<LocalDBMap<any>, MapState<any>>();
    private _listStateMap = new WeakMap<LocalDBList<any>, ListState<any>>();
    private _tableStateMap = new WeakMap<LocalDBTable<any>, TableState<any>>();
    private _recordStateMap = new WeakMap<LocalDBRecord<any>, RecordState<any>>();
  }

  /**
   * A type alias for the internal state of a db list.
   */
  type ListState<T extends ReadonlyJSONValue> = {
    changed: Signal<LocalDBList<T>, IDBList.ChangedArgs<T>>;
    values: T[];
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db map.
   */
  type MapState<T extends ReadonlyJSONValue> = {
    changed: Signal<LocalDBMap<T>, IDBMap.ChangedArgs<T>>;
    size: number;
    items: { [key: string]: T };
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db string.
   */
  type StringState = {
    changed: Signal<LocalDBString, IDBString.ChangedArgs>;
    value: string;
    dbParent: LocalDBRecord<{}> | null;
  };

  /**
   * A type alias for the internal state of a db record.
   */
  type RecordState<T extends DBRecord.State> = {
    changed: Signal<LocalDBRecord<T>, DBRecord.ChangedArgs<T>>;
    data: T;
    dbParent: LocalDBTable<T> | null;
  };

  /**
   * A type alias for the internal state of a db table.
   */
  type TableState<T extends DBRecord.State> = {
    changed: Signal<LocalDBTable<T>, IDBTable.ChangedArgs<T>>;
    size: number;
    records: { [key: string]: LocalDBRecord<T> };
  };

  /**
   * A concrete implementation of `IDBList`.
   */
  class LocalDBList<T extends ReadonlyJSONValue> implements IDBList<T> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBList<T>, IDBList.ChangedArgs<T>> {
      return this._changed;
    }

    get dbType(): 'list' {
      return 'list';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      //return this._dbImpl.listDBParent(this);
      return this._dbParent;
    }

    get isEmpty(): boolean {
      //return this._dbImpl.listIsEmpty(this);
      return this._values.length === 0;
    }

    get length(): number {
      //return this._dbImpl.listLength(this);
      return this._values.length;
    }

    get first(): T | undefined {
      //return this._dbImpl.listFirst(this);
      return this.get(0);
    }

    get last(): T | undefined {
      //return this._dbImpl.listLast(this);
      return this.get(-1);
    }

    iter(): IIterator<T> {
      //return this._dbImpl.listIter(this);
      return iter(this._values);
    }

    retro(): IIterator<T> {
      //return this._dbImpl.listRetro(this);
      return retro(this._values);
    }

    indexOf(value: T, start?: number, stop?: number): number {
      //return this._dbImpl.listIndexOf(this, value, start, stop);
      return ArrayExt.indexOf(this._values, value, start, stop);
    }

    lastIndexOf(value: T, start?: number, stop?: number): number {
      //return this._dbImpl.listLastIndexOf(this, value, start, stop);
      return ArrayExt.lastIndexOf(this._values)
    }

    findIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return this._dbImpl.listFindIndex(this, fn, start, stop);
    }

    findLastIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
      return this._dbImpl.listFindLastIndex(this, fn, start, stop);
    }

    get(index: number): T | undefined {
      return this._dbImpl.listGet(this, index);
    }

    set(index: number, value: T): void {
      this._dbImpl.listSet(this, index, value);
    }

    push(value: T): void {
      this._dbImpl.listPush(this, value);
    }

    insert(index: number, value: T): void {
      this._dbImpl.listInsert(this, index, value);
    }

    remove(index: number): void {
      this._dbImpl.listRemove(this, index);
    }

    splice(index: number, count: number, values?: IterableOrArrayLike<T>): void {
      this._dbImpl.listSplice(this, index, count, values);
    }

    clear(): void {
      this._dbImpl.listClear(this);
    }

    private _values: T[];
    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
    private _changed = new Signal<this, IDBList.ChangedArgs<T>>(this);
  }

  /**
   * A concrete implementation of `IDBMap`.
   */
  class LocalDBMap<T extends ReadonlyJSONValue> implements IDBMap<T> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBMap<T>, IDBMap.ChangedArgs<T>> {
      return this._dbImpl.mapChanged(this);
    }

    get dbType(): 'map' {
      return 'map';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbImpl.mapDBParent(this);
    }

    get isEmpty(): boolean {
      return this._dbImpl.mapIsEmpty(this);
    }

    get size(): number {
      return this._dbImpl.mapSize(this);
    }

    iter(): IIterator<[string, T]> {
      return this._dbImpl.mapIter(this);
    }

    keys(): IIterator<string> {
      return this._dbImpl.mapKeys(this);
    }

    values(): IIterator<T> {
      return this._dbImpl.mapValues(this);
    }

    has(key: string): boolean {
      return this._dbImpl.mapHas(this, key);
    }

    get(key: string): T | undefined {
      return this._dbImpl.mapGet(this, key);
    }

    set(key: string, value: T): void {
      this._dbImpl.mapSet(this, key, value);
    }

    delete(key: string): void {
      this._dbImpl.mapDelete(this, key);
    }

    clear(): void {
      this._dbImpl.mapClear(this);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A concrete implementation of `IDBString`.
   */
  class LocalDBString implements IDBString {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBString, IDBString.ChangedArgs> {
      return this._dbImpl.stringChanged(this);
    }

    get dbType(): 'string' {
      return 'string';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbImpl.stringDBParent(this);
    }

    get isEmpty(): boolean {
      return this._dbImpl.stringIsEmpty(this);
    }

    get length(): number {
      return this._dbImpl.stringLength(this);
    }

    get(): string {
      return this._dbImpl.stringGet(this);
    }

    set(value: string): void {
      this._dbImpl.stringSet(this, value);
    }

    append(value: string): void {
      this._dbImpl.stringAppend(this, value);
    }

    insert(index: number, value: string): void {
      this._dbImpl.stringInsert(this, index, value);
    }

    splice(index: number, count: number, value?: string): void {
      this._dbImpl.stringSplice(this, index, count, value);
    }

    clear(): void {
      this._dbImpl.stringClear(this);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A concrete partial implementation of `DBRecord`.
   */
  class LocalDBRecordBase<T extends DBRecord.State> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>> {
      return this._dbImpl.recordChanged(this);
    }

    get dbType(): 'record' {
      return 'record';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): IDBTable<T> | null {
      return this._dbImpl.recordDBParent(this);
    }

    get<K extends keyof T>(name: K): T[K] {
      return this._dbImpl.recordGet(this, name);
    }

    set<K extends keyof T>(name: K, value: T[K]): void {
      this._dbImpl.recordSet(this, name, value);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A type alias for a concrete implementation of `DBRecord`.
   */
  type LocalDBRecord<T extends DBRecord.State> = T & LocalDBRecordBase<T>;

  /**
   * A type alias for a record factory function.
   */
  type RecordFactory<T extends DBRecord.State> = (dbImpl: LocalDBImpl) => LocalDBRecord<T>;

  /**
   * A concrete implementation of `IDBTable`.
   */
  class LocalDBTable<T extends DBRecord.State> implements IDBTable<T> {

    constructor(dbToken: Token<T>, dbImpl: LocalDBImpl) {
      this._dbToken = dbToken;
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
      return this._dbImpl.tableChanged(this);
    }

    get dbType(): 'table' {
      return 'table';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbToken(): Token<T> {
      return this._dbToken;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get isEmpty(): boolean {
      return this._dbImpl.tableIsEmpty(this);
    }

    get size(): number {
      return this._dbImpl.tableSize(this);
    }

    iter(): IIterator<DBRecord<T>> {
      return this._dbImpl.tableIter(this);
    }

    has(id: string): boolean {
      return this._dbImpl.tableHas(this, id);
    }

    get(id: string): DBRecord<T> | undefined {
      return this._dbImpl.tableGet(this, id);
    }

    insert(record: DBRecord<T>): void {
      this._dbImpl.tableInsert(this, record);
    }

    delete(id: string): void {
      this._dbImpl.tableDelete(this, id);
    }

    clear(): void {
      this._dbImpl.tableClear(this);
    }

    private _dbToken: Token<T>;
    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * An enum of the reserved property names for a record.
   */
  enum ReservedRecordNames {
    changed, dbType, dbId, dbModel, dbParent, get, set, _dbImpl, _dbId
  };

  /**
   * A cache of record factory functions.
   */
  const factoryCache: { [key: string]: RecordFactory<any> } = Object.create(null);

  /**
   * Get and/or create the cached record factory for a state object.
   */
  function cachedRecordFactory<T extends DBRecord.State>(state: T): RecordFactory<T> {
    // Get the property names for the record in canonical order.
    let names = Object.keys(state).sort();

    // Create a map key for the property names.
    let key = names.join(',');

    // Get and/or create the factory function for the record.
    return factoryCache[key] || (factoryCache[key] = createRecordFactory<T>(names));
  }

  /**
   * Create a factory function for creating full db records.
   */
  function createRecordFactory<T extends DBRecord.State>(names: string[]): RecordFactory<T> {
    // Create a new subclass for defining the named properties.
    const cls = class extends LocalDBRecordBase<T> { };

    // Define the record properties, disallowing reserved names.
    for (let name of names) {
      if (name in ReservedRecordNames) {
        throw new Error(`Invalid record property name: '${name}'`);
      }
      defineRecordProperty(cls.prototype, name);
    }

    // Return a factory function for the new class.
    return ((dbImpl: LocalDBImpl) => new cls(dbImpl)) as RecordFactory<T>;
  }

  /**
   * Define the get/set property for a record prototype.
   */
  function defineRecordProperty(proto: object, name: string): void {
    Object.defineProperty(proto, name, {
      get: function() { return this.get(name); },
      set: function(value: any) { this.set(name, value); },
      enumerable: true,
      configurable: true
    });
  }

  /**
   * Test two arrays for shallow equality.
   */
  function shallowEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, n = a.length; i < n; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
}
_, fn, start, stop);
    }

    get(index: number): T | undefined {
      return this._dbImpl.listGet(this, index);
    }

    set(index: number, value: T): void {
      this._dbImpl.listSet(this, index, value);
    }

    push(value: T): void {
      this._dbImpl.listPush(this, value);
    }

    insert(index: number, value: T): void {
      this._dbImpl.listInsert(this, index, value);
    }

    remove(index: number): void {
      this._dbImpl.listRemove(this, index);
    }

    splice(index: number, count: number, values?: IterableOrArrayLike<T>): void {
      this._dbImpl.listSplice(this, index, count, values);
    }

    clear(): void {
      this._dbImpl.listClear(this);
    }

    private _values: T[];
    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
    private _changed = new Signal<this, IDBList.ChangedArgs<T>>(this);
  }

  /**
   * A concrete implementation of `IDBMap`.
   */
  class LocalDBMap<T extends ReadonlyJSONValue> implements IDBMap<T> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBMap<T>, IDBMap.ChangedArgs<T>> {
      return this._dbImpl.mapChanged(this);
    }

    get dbType(): 'map' {
      return 'map';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbImpl.mapDBParent(this);
    }

    get isEmpty(): boolean {
      return this._dbImpl.mapIsEmpty(this);
    }

    get size(): number {
      return this._dbImpl.mapSize(this);
    }

    iter(): IIterator<[string, T]> {
      return this._dbImpl.mapIter(this);
    }

    keys(): IIterator<string> {
      return this._dbImpl.mapKeys(this);
    }

    values(): IIterator<T> {
      return this._dbImpl.mapValues(this);
    }

    has(key: string): boolean {
      return this._dbImpl.mapHas(this, key);
    }

    get(key: string): T | undefined {
      return this._dbImpl.mapGet(this, key);
    }

    set(key: string, value: T): void {
      this._dbImpl.mapSet(this, key, value);
    }

    delete(key: string): void {
      this._dbImpl.mapDelete(this, key);
    }

    clear(): void {
      this._dbImpl.mapClear(this);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A concrete implementation of `IDBString`.
   */
  class LocalDBString implements IDBString {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBString, IDBString.ChangedArgs> {
      return this._dbImpl.stringChanged(this);
    }

    get dbType(): 'string' {
      return 'string';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): DBRecord<{}> | null {
      return this._dbImpl.stringDBParent(this);
    }

    get isEmpty(): boolean {
      return this._dbImpl.stringIsEmpty(this);
    }

    get length(): number {
      return this._dbImpl.stringLength(this);
    }

    get(): string {
      return this._dbImpl.stringGet(this);
    }

    set(value: string): void {
      this._dbImpl.stringSet(this, value);
    }

    append(value: string): void {
      this._dbImpl.stringAppend(this, value);
    }

    insert(index: number, value: string): void {
      this._dbImpl.stringInsert(this, index, value);
    }

    splice(index: number, count: number, value?: string): void {
      this._dbImpl.stringSplice(this, index, count, value);
    }

    clear(): void {
      this._dbImpl.stringClear(this);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A concrete partial implementation of `DBRecord`.
   */
  class LocalDBRecordBase<T extends DBRecord.State> {

    constructor(dbImpl: LocalDBImpl) {
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>> {
      return this._dbImpl.recordChanged(this);
    }

    get dbType(): 'record' {
      return 'record';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get dbParent(): IDBTable<T> | null {
      return this._dbImpl.recordDBParent(this);
    }

    get<K extends keyof T>(name: K): T[K] {
      return this._dbImpl.recordGet(this, name);
    }

    set<K extends keyof T>(name: K, value: T[K]): void {
      this._dbImpl.recordSet(this, name, value);
    }

    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * A type alias for a concrete implementation of `DBRecord`.
   */
  type LocalDBRecord<T extends DBRecord.State> = T & LocalDBRecordBase<T>;

  /**
   * A type alias for a record factory function.
   */
  type RecordFactory<T extends DBRecord.State> = (dbImpl: LocalDBImpl) => LocalDBRecord<T>;

  /**
   * A concrete implementation of `IDBTable`.
   */
  class LocalDBTable<T extends DBRecord.State> implements IDBTable<T> {

    constructor(dbToken: Token<T>, dbImpl: LocalDBImpl) {
      this._dbToken = dbToken;
      this._dbImpl = dbImpl;
    }

    get changed(): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
      return this._dbImpl.tableChanged(this);
    }

    get dbType(): 'table' {
      return 'table';
    }

    get dbId(): string {
      return this._dbId;
    }

    get dbToken(): Token<T> {
      return this._dbToken;
    }

    get dbModel(): IModelDB {
      return this._dbImpl.dbModel;
    }

    get isEmpty(): boolean {
      return this._dbImpl.tableIsEmpty(this);
    }

    get size(): number {
      return this._dbImpl.tableSize(this);
    }

    iter(): IIterator<DBRecord<T>> {
      return this._dbImpl.tableIter(this);
    }

    has(id: string): boolean {
      return this._dbImpl.tableHas(this, id);
    }

    get(id: string): DBRecord<T> | undefined {
      return this._dbImpl.tableGet(this, id);
    }

    insert(record: DBRecord<T>): void {
      this._dbImpl.tableInsert(this, record);
    }

    delete(id: string): void {
      this._dbImpl.tableDelete(this, id);
    }

    clear(): void {
      this._dbImpl.tableClear(this);
    }

    private _dbToken: Token<T>;
    private _dbImpl: LocalDBImpl;
    private _dbId = UUID.uuid4();
  }

  /**
   * An enum of the reserved property names for a record.
   */
  enum ReservedRecordNames {
    changed, dbType, dbId, dbModel, dbParent, get, set, _dbImpl, _dbId
  };

  /**
   * A cache of record factory functions.
   */
  const factoryCache: { [key: string]: RecordFactory<any> } = Object.create(null);

  /**
   * Get and/or create the cached record factory for a state object.
   */
  function cachedRecordFactory<T extends DBRecord.State>(state: T): RecordFactory<T> {
    // Get the property names for the record in canonical order.
    let names = Object.keys(state).sort();

    // Create a map key for the property names.
    let key = names.join(',');

    // Get and/or create the factory function for the record.
    return factoryCache[key] || (factoryCache[key] = createRecordFactory<T>(names));
  }

  /**
   * Create a factory function for creating full db records.
   */
  function createRecordFactory<T extends DBRecord.State>(names: string[]): RecordFactory<T> {
    // Create a new subclass for defining the named properties.
    const cls = class extends LocalDBRecordBase<T> { };

    // Define the record properties, disallowing reserved names.
    for (let name of names) {
      if (name in ReservedRecordNames) {
        throw new Error(`Invalid record property name: '${name}'`);
      }
      defineRecordProperty(cls.prototype, name);
    }

    // Return a factory function for the new class.
    return ((dbImpl: LocalDBImpl) => new cls(dbImpl)) as RecordFactory<T>;
  }

  /**
   * Define the get/set property for a record prototype.
   */
  function defineRecordProperty(proto: object, name: string): void {
    Object.defineProperty(proto, name, {
      get: function() { return this.get(name); },
      set: function(value: any) { this.set(name, value); },
      enumerable: true,
      configurable: true
    });
  }

  /**
   * Test two arrays for shallow equality.
   */
  function shallowEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, n = a.length; i < n; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
}
