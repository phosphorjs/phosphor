// /*-----------------------------------------------------------------------------
// | Copyright (c) 2014-2017, PhosphorJS Contributors
// |
// | Distributed under the terms of the BSD 3-Clause License.
// |
// | The full license is in the file LICENSE, distributed with this software.
// |----------------------------------------------------------------------------*/
// import {
//   ArrayExt, IIterator, IterableOrArrayLike, each, iter, iterItems, iterKeys,
//   iterValues, retro, toArray
// } from '@phosphor/algorithm';

// import {
//   ReadonlyJSONValue, Token, UUID
// } from '@phosphor/coreutils';

// import {
//   ISignal, Signal
// } from '@phosphor/signaling';

// import {
//   DBRecord, IDBList, IDBMap, IDBString, IDBTable, IModelDB
// } from './modeldb';



// /**
//  * The namespace for the module implementation details.
//  */
// namespace Private {
//   /**
//    * The implementation class for a local model db.
//    */
//   export
//   class LocalDBImpl {

//     constructor(dbModel: LocalModelDB) {
//       this._dbModel = dbModel;
//     }

//     //-------------------------------------------------------------------------
//     // DB Methods
//     //-------------------------------------------------------------------------

//     get dbModel(): IModelDB {
//       return this._dbModel;
//     }

//     get canUndo(): boolean {
//       return false;
//     }

//     get canRedo(): boolean {
//       return false;
//     }

//     undo(): void {

//     }

//     redo(): void {

//     }

//     transact(auth: any, fn: () => void): void {
//       try {

//       } catch (error) {
//         // unwind transaction
//         throw error;
//       }
//     }

//     //-------------------------------------------------------------------------
//     // Model Methods
//     //-------------------------------------------------------------------------

//     createList<T extends ReadonlyJSONValue>(values?: IterableOrArrayLike<T>): IDBList<T> {
//       // Guard against disallowed mutations.
//       this._mutationGuard();

//       // Create and return the list.
//       return LocalDBList.create<T>(this, values);
//     }

//     createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IDBMap<T> {
//       // Guard against disallowed mutations.
//       this._mutationGuard();

//       // Create and return the map.
//       return LocalDBMap.create<T>(this, items);
//     }

//     createString(value?: string): IDBString {
//       // Guard against disallowed mutations.
//       this._mutationGuard();

//       // Create and return the string.
//       return LocalDBString.create(this, value);
//     }

//     createRecord<T extends DBRecord.State>(state: T): DBRecord<T> {
//       // Guard against disallowed mutations.
//       this._mutationGuard();

//       // Create and return the record.
//       return LocalDBRecordBase.create<T>(this, state);
//     }

//     createTable<T extends DBRecord.State>(token: Token<T>, records?: IterableOrArrayLike<DBRecord<T>>): IDBTable<T> {
//       // Guard against disallowed mutations.
//       this._mutationGuard();

//       // Ensure the table does not already exist.
//       if (this._tokenTableMap.has(token)) {
//         throw new Error(`A table already exists for the token: '${token.name}'.`);
//       }

//       // Create the table.
//       let table = new LocalDBTable<T>(token, this, records);

//       // Store the table for the token.
//       this._tokenTableMap.set(token, table);

//       // Register the change.
//       this._registerModelChange(undefined, table);

//       // Return the new table.
//       return table;
//     }

//     hasTable<T extends DBRecord.State>(token: Token<T>): boolean {
//       return this._tokenTableMap.has(token);
//     }

//     getTable<T extends DBRecord.State>(token: Token<T>): IDBTable<T> {
//       // Fetch the table for the token.
//       let table = this._tokenTableMap.get(token);

//       // Ensure the table exists.
//       if (!table) {
//         throw new Error(`No table exists for token: '${token.name}'.`);
//       }

//       // Return the table.
//       return table;
//     }

//     deleteTable<T extends DBRecord.State>(token: Token<T>): void {
//       // Fetch the table for the token.
//       let table = this._tokenTableMap.get(token);

//       // Ensure the table exists.
//       if (!table) {
//         throw new Error(`No table exists for token: '${token.name}'.`);
//       }

//       // Delete the table from the token map.
//       this._tokenTableMap.delete(token);

//       // Register the change.
//       this._registerModelChange(table, undefined);
//     }

//     //-------------------------------------------------------------------------
//     // Private Methods
//     //-------------------------------------------------------------------------

//     private _mutationGuard(): void {
//       if (!this._inTransaction) {
//         throw new Error('DB mutation is only allowed within transaction.');
//       }
//     }

//     private _registerModelChange(removed: LocalDBTable<{}> | undefined, added: LocalDBTable<{}> | undefined): void {

//     }

//     private _registerListChange<T extends ReadonlyJSONValue>(list: LocalDBList<T>, index: number, removed: ReadonlyArray<T>, added: ReadonlyArray<T>): void {

//     }

//     private _registerMapChange<T extends ReadonlyJSONValue>(map: LocalDBMap<T>, key: string, removed: T | undefined, added: T | undefined): void {

//     }

//     private _registerStringChange(str: LocalDBString, index: number, removed: string, added: string): void {

//     }

//     private _registerRecordChange<T extends DBRecord.State, K extends keyof T>(record: LocalDBRecord<T>, name: K, oldValue: T[K], newValue: T[K]): void {

//     }

//     private _registerTableChange<T extends DBRecord.State>(table: LocalDBTable<T>, removed: DBRecord<T> | undefined, added: DBRecord<T> | undefined): void {

//     }

//     private _setObjectParent(object: IDBList | IDBMap | IDBString, record: DBRecord<{}>): void {

//     }

//     private _setRecordParent<T extends DBRecord.State>(record: DBRecord<T>, table: LocalDBTable<T>): void {
//       // Fetch the record state.
//       let state = this._recordStateMap.get(record as any);

//       // Validate the ownership of the record.
//       if (!state) {
//         throw new Error('Record was not created by this model db.');
//       }

//       // Ensure the record does not have a parent.
//       if (state.dbParent) {
//         throw new Error('Record already belongs to another table.');
//       }

//       // Set the parent of the record.
//       state.parent = table;
//     }

//     private _dbModel: LocalModelDB;
//     private _inTransaction = false;
//     private _tokenTableMap = new Map<Token<any>, LocalDBTable<any>>();
//   }

//   /**
//    *
//    */
//   abstract class LocalDBObject {

//     static getImpl(obj: LocalDBObject): LocalDBImpl {
//       return obj._dbImpl;
//     }

//     constructor(dbImpl: LocalDBImpl) {
//       this._dbImpl = dbImpl;
//     }



//     get dbId(): string {
//       return this._dbId;
//     }

//     get dbModel(): IModelDB {
//       return this._dbImpl.dbModel;
//     }

//     private _dbId = UUID.uuid4();
//     private _dbImpl: LocalDBImpl;
//     private _changed = new Signal<this, any>(this);
//   }

//   /**
//    *
//    */
//   abstract class LocalDBRecordChild extends LocalDBObject {

//     static setParent(child: LocalDBRecordChild, parent: LocalDBRecord<{}> | null): void {
//       child._dbParent = parent;
//     }

//     get dbParent(): DBRecord<{}> | null {
//       return this._dbParent;
//     }

//     private _dbParent: LocalDBRecord<{}> | null = null;
//   }

//   /**
//    * A concrete implementation of `IDBList`.
//    */
//   class LocalDBList<T extends ReadonlyJSONValue> extends LocalDBRecordChild implements IDBList<T> {

//     static create<K  extends ReadonlyJSONValue>(dbImpl: LocalDBImpl, values?: IterableOrArrayLike<K>): LocalDBList<K> {
//       // Create the list instance.
//       let list = new LocalDBList<K>(dbImpl);

//       // Bail early if there are no initial values.
//       if (!values) {
//         return list;
//       }

//       // Add the initial list values.
//       each(values, value => { list._values.push(value); });

//       // Return the initialized list.
//       return list;
//     }

//     get changed(): ISignal<this, IDBList.ChangedArgs<T>> {
//       return this._changed;
//     }

//     get dbType(): 'list' {
//       return 'list';
//     }

//     get isEmpty(): boolean {
//       return this._values.length === 0;
//     }

//     get length(): number {
//       return this._values.length;
//     }

//     get first(): T | undefined {
//       return this.get(0);
//     }

//     get last(): T | undefined {
//       return this.get(-1);
//     }

//     iter(): IIterator<T> {
//       return iter(this._values);
//     }

//     retro(): IIterator<T> {
//       return retro(this._values);
//     }

//     indexOf(value: T, start?: number, stop?: number): number {
//       return ArrayExt.indexOf(this._values, value, start, stop);
//     }

//     lastIndexOf(value: T, start?: number, stop?: number): number {
//       return ArrayExt.lastIndexOf(this._values, value, start, stop);
//     }

//     findIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
//       return ArrayExt.findFirstIndex(this._values, fn, start, stop);
//     }

//     findLastIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number {
//       return ArrayExt.findLastIndex(this._values, fn, start, stop);
//     }

//     get(index: number): T | undefined {
//       return this._values[index < 0 ? index + this._values.length : index];
//     }

//     set(index: number, value: T): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Wrap the index for negative offsets.
//       if (index < 0) {
//         index += this._values.length;
//       }

//       // Bail early if the index is out of range.
//       if (index < 0 || index >= this._values.length) {
//         return;
//       }

//       // Look up the current value.
//       let current = this._values[index];

//       // Bail early if the value does not change.
//       if (current === value) {
//         return;
//       }

//       // Update the internal values.
//       this._values[index] = value;

//       // Register the change.
//       this._dbImpl.registerListChange(this, index, [current], [value]);
//     }

//     push(value: T): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Update the internal values.
//       let index = this._values.push(value) - 1;

//       // Register the change.
//       this._dbImpl.registerListChange(this, index, [], [value]);
//     }

//     insert(index: number, value: T): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Normalize the index for the insert.
//       if (index < 0) {
//         index = Math.max(0, index + this._values.length);
//       } else {
//         index = Math.min(index, this._values.length);
//       }

//       // Update the internal values.
//       ArrayExt.insert(this._values, index, value);

//       // Register the change.
//       this._dbImpl.registerListChange(this, index, [], [value]);
//     }

//     remove(index: number): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Wrap the index for negative offsets.
//       if (index < 0) {
//         index += this._values.length;
//       }

//       // Bail early if the index is out of range.
//       if (index < 0 || index >= this._values.length) {
//         return;
//       }

//       // Update the internal values.
//       let removed = ArrayExt.removeAt(this._values, index)!;

//       // Register the change.
//       this._dbImpl.registerListChange(this, index, [removed], []);
//     }

//     splice(index: number, count: number, values?: IterableOrArrayLike<T>): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Normalize the remove count.
//       count = Math.max(0, count);

//       // Normalize the added values.
//       let added = values ? toArray(values) : [];

//       // Bail early if there is nothing to do.
//       if (added.length === 0 && (count === 0 || this._values.length === 0)) {
//         return;
//       }

//       // Normalize the index for the splice.
//       if (index < 0) {
//         index = Math.max(0, index + this._values.length);
//       } else {
//         index = Math.min(index, this._values.length);
//       }

//       // Update the internal values.
//       let removed = this._values.splice(index, count, ...added);

//       // Bail early if there is no effective change.
//       if (shallowEqual(removed, added)) {
//         return;
//       }

//       // Register the change.
//       this._dbImpl.registerListChange(this, index, removed, added);
//     }

//     clear(): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Bail early if there is no effective change.
//       if (this._values.length === 0) {
//         return;
//       }

//       // Shallow copy the list.
//       let removed = this._values.slice();

//       // Update the internal values.
//       this._values.length = 0;

//       // Register the change.
//       this._dbImpl.registerListChange(this, 0, removed, []);
//     }

//     private constructor(dbImpl: LocalDBImpl) { super(dbImpl); }

//     private _values: T[] = [];
//     private _changed = new Signal<this, IDBList.ChangedArgs<T>>(this);
//   }

//   /**
//    * A concrete implementation of `IDBMap`.
//    */
//   class LocalDBMap<T extends ReadonlyJSONValue> extends LocalDBLeaf implements IDBMap<T> {

//     static create<K  extends ReadonlyJSONValue>(dbImpl: LocalDBImpl, items?: { [key: string]: K }): LocalDBMap<K> {
//       // Create the map instance.
//       let map = new LocalDBMap<K>(dbImpl);

//       // Bail early if there are no initial items.
//       if (!items) {
//         return map;
//       }

//       // Add the initial map items.
//       for (let key in items) {
//         map._items[key] = items[key];
//         map._size++;
//       }

//       // Return the initialized map.
//       return map;
//     }

//     get dbType(): 'map' {
//       return 'map';
//     }

//     get isEmpty(): boolean {
//       return this._size === 0;
//     }

//     get size(): number {
//       return this._size;
//     }

//     iter(): IIterator<[string, T]> {
//       return iterItems(this._items);
//     }

//     keys(): IIterator<string> {
//       return iterKeys(this._items);
//     }

//     values(): IIterator<T> {
//       return iterValues(this._items);
//     }

//     has(key: string): boolean {
//       return key in this._items;
//     }

//     get(key: string): T | undefined {
//       return this._items[key];
//     }

//     set(key: string, value: T): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Look up the current value.
//       let current = this._items[key];

//       // Bail early if there is no effective change.
//       if (current === value) {
//         return;
//       }

//       // Update the internal state.
//       this._items[key] = value;
//       this._size += +(current === undefined);

//       // Register the change.
//       this._dbImpl.registerMapChange(this, key, current, value);
//     }

//     delete(key: string): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Look up the current value.
//       let current = this._items[key];

//       // Bail early if the key does not exist.
//       if (current === undefined) {
//         return;
//       }

//       // Update the internal state.
//       delete this._items[key];
//       this._size--;

//       // Register the change.
//       this._dbImpl.registerMapChange(this, key, current, undefined);
//     }

//     clear(): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Bail early if there is nothing to do.
//       if (this._size === 0) {
//         return;
//       }

//       // Iterate over the items.
//       for (let key in this._items) {
//         // Fetch the value.
//         let value = this._items[key];

//         // Update the internal state.
//         delete this._items[key];
//         this._size--;

//         // Register the change.
//         this._dbImpl.registerMapChange(this, key, value, undefined);
//       }
//     }

//     private constructor(dbImpl: LocalDBImpl) { super(dbImpl); }

//     private _size = 0;
//     private _items: { [key: string]: T } = Object.create(null);
//   }

//   /**
//    * A concrete implementation of `IDBString`.
//    */
//   class LocalDBString extends LocalDBObject implements IDBString {

//     static create(dbImpl: LocalDBImpl, value?: string): LocalDBString {
//       // Create the string instance.
//       let str = new LocalDBString(dbImpl);

//       // Bail early if there is no initial value.
//       if (!value) {
//         return str;
//       }

//       // Set the initial value.
//       str._value = value;

//       // Return the initialized string.
//       return str;
//     }

//     get dbType(): 'string' {
//       return 'string';
//     }

//     get isEmpty(): boolean {
//       return this._value.length === 0;
//     }

//     get length(): number {
//       return this._value.length;
//     }

//     get(): string {
//       return this._value;
//     }

//     set(value: string): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Look up the current value.
//       let current = this._value;

//       // Bail early if there is no effective change.
//       if (current === value) {
//         return;
//       }

//       // Update the internal value.
//       this._value = value;

//       // Register the change.
//       this._dbImpl.registerStringChange(this, 0, current, value);
//     }

//     append(value: string): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Bail early if there is nothing to do.
//       if (!value) {
//         return;
//       }

//       // Get the index of the modification.
//       let index = this._value.length;

//       // Update the internal value.
//       this._value += value;

//       // Register the change.
//       this._dbImpl.registerStringChange(this, index, '', value);
//     }

//     insert(index: number, value: string): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Bail early if there is nothing to do.
//       if (!value) {
//         return;
//       }

//       // Normalize the index for the insert.
//       if (index < 0) {
//         index = Math.max(0, index + this._value.length);
//       } else {
//         index = Math.min(index, this._value.length);
//       }

//       // Update the internal value.
//       let prefix = this._value.slice(0, index);
//       let suffix = this._value.slice(index);
//       this._value = prefix + value + suffix;

//       // Register the change.
//       this._dbImpl.registerStringChange(this, index, '', value);
//     }

//     splice(index: number, count: number, value?: string): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Normalize the remove count.
//       count = Math.max(0, count);

//       // Normalize the added text.
//       let added = value || '';

//       // Bail early if there is nothing to do.
//       if (!added && (count === 0 || !this._value)) {
//         return;
//       }

//       // Normalize the index for the splice.
//       if (index < 0) {
//         index = Math.max(0, index + this._value.length);
//       } else {
//         index = Math.min(index, this._value.length);
//       }

//       // Extract the removed portion of the string.
//       let removed = this._value.slice(index, index + count);

//       // Bail early if there is no effective change.
//       if (removed === added) {
//         return;
//       }

//       // Update the internal value.
//       let prefix = this._value.slice(0, index);
//       let suffix = this._value.slice(index + count);
//       this._value = prefix + added + suffix;

//       // Register the change.
//       this._dbImpl.registerStringChange(this, index, removed, added);
//     }

//     clear(): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Bail early if there is nothing to do.
//       if (!this._value) {
//         return;
//       }

//       // Get the removed value.
//       let removed = this._value;

//       // Update the internal value.
//       this._value = '';

//       // Register the change.
//       this._dbImpl.registerStringChange(str, 0, removed, '');
//     }

//     private constructor(dbImpl: LocalDBImpl) { super(dbImpl); }

//     private _value = '';
//   }

//   /**
//    * A concrete partial implementation of `DBRecord`.
//    */
//   class LocalDBRecordBase<T extends DBRecord.State> extends LocalDBObject {

//     static create<K extends DBRecord.State>(dbImpl: LocalDBImpl, state: K): LocalDBRecord<T> {
//       // Validate the values in the record state.
//       for (let key in state) {
//         validateDBValue(state[key], dbImpl);
//       }

//       // Create the record instance.
//       let record = this._cachedFactory(state)(dbImpl);

//       // Initialize the state for the record.
//       record._state = { ...state as any } as T;

//       // Set the db parents.
//       for (let key in record._state) {
//         setDBValueParent(record._state[key], record);
//       }

//       // Return the initialized record.
//       return record;
//     }

//     static setParent<K extends DBRecord.State>(record: LocalDBRecord<K>, parent: LocalDBTable<K>): void {
//       record._dbParent = parent;
//     }

//     get changed(): ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>> {
//       return this._changed;
//     }

//     get dbType(): 'record' {
//       return 'record';
//     }

//     get dbId(): string {
//       return this._dbId;
//     }

//     get dbModel(): IModelDB {
//       return this._dbImpl.dbModel;
//     }

//     get dbParent(): IDBTable<T> | null {
//       return this._dbParent;
//     }

//     get<K extends keyof T>(name: K): T[K] {
//       return this._state[name];
//     }

//     set<K extends keyof T>(name: K, value: T[K]): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // TODO validate the value

//       // Look up the current value.
//       let current = this._state.data[name];

//       // Bail early if there is no effective change.
//       if (current === value) {
//         return;
//       }

//       // Update the internal value.
//       this._state[name] = value;

//       // Unparent the old value if needed.
//       this._dbImpl.removeParentIfNeeded(record, current);

//       // Parent the new value if needed.
//       this._dbImpl.addParentIfNeeded(record, value);

//       // Register the change.
//       this._dbImpl.registerRecordChange(record, name, current, value);
//     }

//     private constructor(dbImpl: LocalDBImp) { super(dbImpl); }

//     private _state: T;
//     private _dbId = UUID.uuid4();
//     private _dbImpl: LocalDBImpl;
//     private _dbParent: LocalDBTable<T> | null = null;
//     private _changed = new Signal<this, DBRecord.ChangedArgs<T>>(this);

//     private static _reservedNames = {
//       changed: true,
//       dbType: true,
//       dbId: true,
//       dbModel: true,
//       dbParent: true,
//       get: true,
//       set: true,
//       _state: true,
//       _dbId: true,
//       _dbImpl: true,
//       _dbParent: true,
//       _changed: true
//     };

//     private static _factoryCache: {
//       [key: string]: (dbImpl: LocalDBImpl) => LocalDBRecord<any>
//     } = Object.create(null);

//     private static _cachedFactory<K extends DBRecord.State>(state: K): (dbImpl: LocalDBImpl) => LocalDBRecord<K> {
//       // Get the property names for the record in a canonical order.
//       let names = Object.keys(state).sort();

//       // Create a map key for the property names.
//       let key = names.join(',');

//       // Get the factory function for the record.
//       let factory = this._factoryCache[key];

//       // Return the factory if it exists.
//       if (factory) {
//         return factory;
//       }

//       // Create a new subclass for the record shape.
//       let cls = class extends LocalDBRecordBase<T> { };

//       // Iterate over the property names.
//       for (let name of names) {
//         // Disallow properties with reserved names.
//         if (name in this._reservedNames) {
//           throw new Error(`Reserved record property name: '${name}'`);
//         }

//         // Define the named record property.
//         Object.defineProperty(cls.prototype, name, {
//           get: function() { return this.get(name); },
//           set: function(value: any) { this.set(name, value); },
//           enumerable: true,
//           configurable: true
//         });
//       }

//       // Create the factory function for the new class.
//       factory = (dbImpl: LocalDBImpl) => new cls(dbImpl) as LocalDBRecord<T>;

//       // Cache and return the new factory function.
//       return this._factoryCache[key] = factory;
//     }
//   }

//   /**
//    * A type alias for a concrete implementation of `DBRecord`.
//    */
//   type LocalDBRecord<T extends DBRecord.State> = T & LocalDBRecordBase<T>;

//   /**
//    * A concrete implementation of `IDBTable`.
//    */
//   class LocalDBTable<T extends DBRecord.State> implements IDBTable<T> {

//     // static create(...) {
//     //   // Update the initial records.
//     //   if (initial) {
//     //     // De-duplicate before validating.
//     //     each(initial, record => { records[record.dbId] = record; });

//     //     // Set the parent of the records and update the map size.
//     //     for (let id in records) {
//     //       this._setRecordParent(record, table);
//     //       size++;
//     //     }
//     //   }
//     // }

//     constructor(dbToken: Token<T>, dbImpl: LocalDBImpl) {
//       this._dbToken = dbToken;
//       this._dbImpl = dbImpl;
//     }

//     get changed(): ISignal<IDBTable<T>, IDBTable.ChangedArgs<T>> {
//       return this._changed;
//     }

//     get dbType(): 'table' {
//       return 'table';
//     }

//     get dbId(): string {
//       return this._dbId;
//     }

//     get dbToken(): Token<T> {
//       return this._dbToken;
//     }

//     get dbModel(): IModelDB {
//       return this._dbImpl.dbModel;
//     }

//     get isEmpty(): boolean {
//       return this._size === 0;
//     }

//     get size(): number {
//       return this._size;
//     }

//     iter(): IIterator<DBRecord<T>> {
//       return iterValues(this._records);
//     }

//     has(id: string): boolean {
//       return id in this._records;
//     }

//     get(id: string): DBRecord<T> | undefined {
//       return this._records[id];
//     }

//     insert(record: DBRecord<T>): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // // Validate the type of the record.
//       // if (!(record instanceof LocalDBRecord)) {
//       //   throw new Error('Record was not created by this model db.');
//       // }

//       // // Fetch the record state.
//       // let recordState = this._recordStateMap.get(record);

//       // // Validate the ownership of the record.
//       // if (!recordState) {
//       //   throw new Error('Record was not created by this model db.');
//       // }

//       // // Ensure the record does not have a parent.
//       // if (recordState.dbParent) {
//       //   throw new Error('Record already belongs to another table.');
//       // }

//       // Bail early if there is nothing to do.
//       if (record.dbId in this._records) {
//         return;
//       }

//       // Update the internal state.
//       this._records[record.dbId] = record;
//       this._size++;

//       // Parent the record if needed.
//       // this._dbImpl.addParentIfNeeded(table, record);

//       // Register the change.
//       this._dbImpl.registerTableChange(this, undefined, record);
//     }

//     delete(id: string): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Get the record object.
//       let record = this._records[id];

//       // Bail early if there is nothing to do.
//       if (record === undefined) {
//         return;
//       }

//       // Update the internal state.
//       delete this._records[id];
//       this._size--;

//       // Unparent the record if needed.
//       // this._dbImpl.removeParentIfNeeded(this, record);

//       // Register the change.
//       this._dbImpl.registerTableChange(this, record, undefined);
//     }

//     clear(): void {
//       // Guard against disallowed mutations.
//       this._dbImpl.mutationGuard();

//       // Bail early if there is nothing to do.
//       if (this._size === 0) {
//         return;
//       }

//       // Iterate over the records.
//       for (let id in this._records) {
//         // Fetch the record.
//         let record = this._records[id];

//         // Update the internal state.
//         delete this._records[id];
//         this._size--;

//         // Unparent the record if needed.
//         // this._dbImpl.removeParentIfNeeded(this, record);

//         // Register the change.
//         this._dbImpl.registerTableChange(this, record, undefined);
//       }
//     }

//     private _size = 0;
//     private _dbToken: Token<T>;
//     private _dbId = UUID.uuid4();
//     private _dbImpl: LocalDBImpl;
//     private _changed = new Signal<this, IDBTable.ChangedArgs<T>>(this);
//     private _records: { [id: string]: LocalDBRecord<T> } = Object.create(null);
//   }

//   /**
//    * Test two arrays for shallow equality.
//    */
//   function shallowEqual<T>(a: T[], b: T[]): boolean {
//     if (a.length !== b.length) {
//       return false;
//     }
//     for (let i = 0, n = a.length; i < n; ++i) {
//       if (a[i] !== b[i]) {
//         return false;
//       }
//     }
//     return true;
//   }

//   /**
//    * Validate a (potential) DB list/map/string for type and owner.
//    */
//   function validateDBValue(value: any, dbImpl: LocalDBImpl): void {
//     // Bail realy if the value is not a db object.
//     if (typeof value.dbType !== 'string') {
//       return;
//     }

//     // Validate the value based on the db type.
//     switch (value.dbType) {
//     case 'list':
//       assert(value instanceof LocalDBList, 'Invalid DB list type.');
//       assert(LocalDBList.getImpl(value) === dbImpl, 'Invalid DB list owner.');
//       assert(value.dbParent === null, 'DB list already belongs to a record.');
//       break;
//     case 'map':
//       assert(value instanceof LocalDBMap, 'Invalid DB map type.');
//       assert(LocalDBMap.getImpl(value) === dbImpl, 'Invalid DB map owner.');
//       assert(value.dbParent === null, 'DB map already belongs to a record.');
//       break;
//     case 'string':
//       assert(value instanceof LocalDBString, 'Invalid DB string type.');
//       assert(LocalDBString.getImpl(value) === dbImpl, 'Invalid DB string owner.');
//       assert(value.dbParent === null, 'DB string already belongs to a record.');
//       break;
//     default:
//       assert(false, 'Invalid DB type.');
//       break;
//     }
//   }

//   function setDBValueParent(value: any, dbParent: LocalDBRecord<{}>): void {
//     //
//     if (typeof value.dbType !== 'string') {
//       return;
//     }

//     //
//     switch (value.type) {
//     case 'list':
//       LocalDBList.setParent(value, dbParent);
//       break;
//     case 'map':
//       LocalDBMap.setParent(value, dbParent);
//       break;
//     case 'string':
//       LocalDBString.setParent(value, dbParent);
//       break;
//     default:
//       assert(false, 'Invalid DB type.');
//       break;
//     }
//   }

//   /**
//    * Validate a DB record for type and owner.
//    */
//   function validateDBRecord<T extends DBRecord.State>(value: DBRecord<T>, dbImpl: LocalDBImpl): void {
//     assert(value instanceof LocalDBRecordBase, 'Invalid DB record type.');
//     assert(LocalDBRecordBase.getImpl(value) === dbImpl, 'Invalid DB record owner.');
//     assert(value.dbParent === null, 'DB record already belongs to a table.');
//   }

//   /**
//    * A simple assert function.
//    */
//   function assert(ok: boolean, msg: string): void {
//     if (!ok) throw new Error(msg);
//   }
// }
