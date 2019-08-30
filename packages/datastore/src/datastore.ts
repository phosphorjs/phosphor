/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each, IIterable, IIterator, iterItems, map, StringExt, toArray, toObject
} from '@phosphor/algorithm';

import {
  BPlusTree
} from '@phosphor/collections';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Record
} from './record';

import {
  Schema, validateSchema
} from './schema';

import {
  IServerAdapter
} from './serveradapter';

import {
  Table
} from './table';

import {
  createDuplexId
} from './utilities';


/**
 * A multi-user collaborative datastore.
 *
 * #### Notes
 * A store is structured in a maximally flat way using a hierarchy
 * of tables, records, and fields. Internally, the object graph is
 * synchronized among all users via CRDT algorithms.
 *
 * https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type
 * https://hal.inria.fr/file/index/docid/555588/filename/techreport.pdf
 */
export
class Datastore implements IIterable<Table<Schema>>, IDisposable {

  /**
   * Create a new datastore.
   *
   * @param options - The options for creating the datastore
   *
   * @returns A new datastore table.
   *
   * @throws An exception if any of the schema definitions are invalid.
   */
  static create(options: Datastore.IOptions): Datastore {
    const {schemas} = options;
    // Throws an error for invalid schemas:
    Private.validateSchemas(schemas);

    const context =  {
      inTransaction: false,
      transactionId: '',
      version: 0,
      storeId: options.id,
      change: {},
      patch: {},
    };

    const tables = new BPlusTree<Table<Schema>>(Private.recordCmp);
    if (options.restoreState) {
      // If passed state to restore, pass the intital state to recreate each
      // table
      const state = JSON.parse(options.restoreState);
      tables.assign(map(schemas, s => {
        return Table.recreate(s, context, state[s.id] || []);
      }));
    } else {
      // Otherwise, simply create a new, empty table
      tables.assign(map(schemas, s => {
        return Table.create(s, context);
      }));
    }

    return new Datastore(context, tables, options.adapter);
  }

  /**
   * Dispose of the resources held by the datastore.
   */
  dispose(): void {
    // Bail if already disposed.
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    Signal.clearData(this);

    this._adapter = null;
  }

  /**
   * Whether the datastore has been disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * A signal emitted when changes are made to the store.
   *
   * #### Notes
   * This signal is emitted either at the end of a local mutation,
   * or after a remote mutation has been applied. The storeId can
   * be used to determine its source.
   *
   * The payload represents the set of local changes that were made
   * to bring the store to its current state.
   *
   * #### Complexity
   * `O(1)`
   */
  get changed(): ISignal<Datastore, Datastore.IChangedArgs> {
    return this._changed;
  }

  /**
   * The unique id of the store.
   *
   * #### Notes
   * The id is unique among all other collaborating peers.
   *
   * #### Complexity
   * `O(1)`
   */
  get id(): number {
    return this._context.storeId;
  }

  /**
   * Whether a transaction is currently in progress.
   *
   * #### Complexity
   * `O(1)`
   */
  get inTransaction(): boolean {
    return this._context.inTransaction;
  }

  /**
   * The current version of the datastore.
   *
   * #### Notes
   * This version is automatically increased for each transaction
   * to the store. However, it might not increase linearly (i.e.
   * it might make jumps).
   *
   * #### Complexity
   * `O(1)`
   */
  get version(): number {
    return this._context.version;
  }

  /**
   * Create an iterator over all the tables of the datastore.
   *
   * @returns An iterator.
   */
  iter(): IIterator<Table<Schema>> {
    return this._tables.iter();
  }

  /**
   * Get the table for a particular schema.
   *
   * @param schema - The schema of interest.
   *
   * @returns The table for the specified schema.
   *
   * @throws An exception if no table exists for the given schema.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  get<S extends Schema>(schema: S): Table<S> {
    const t = this._tables.get(schema.id, Private.recordIdCmp);
    if (t === undefined) {
      throw new Error(`No table found for schema with id: ${schema.id}`);
    }
    return t as Table<S>;
  }

  /**
   * Begin a new transaction in the store.
   *
   * @returns The id of the new transaction
   *
   * @throws An exception if a transaction is already in progress.
   *
   * #### Notes
   * This will allow the state of the store to be mutated
   * thorugh the `update` method on the individual tables.
   *
   * After the updates are completed, `endTransaction` should
   * be called.
   */
  beginTransaction(): string {
    const newVersion = this._context.version + 1;
    const id = this._transactionIdFactory(newVersion, this.id);
    this._initTransaction(id, newVersion);
    return id;
  }

  /**
   * Completes a transaction.
   *
   * #### Notes
   * This completes a transaction previously started with
   * `beginTransaction`. If a change has occurred, the
   * `changed` signal will be emitted.
   */
  endTransaction(): void {
    this._finalizeTransaction();
    const {patch, change, storeId, transactionId, version} = this._context;
    // Possibly broadcast the transaction to collaborators.
    if (this._adapter && !Private.isPatchEmpty(patch)) {
      this._adapter.broadcast({
        id: transactionId,
        storeId,
        patch,
        version
      });
    }
    // Add the transation to the cemetery to indicate it is visible.
    this._cemetery[transactionId] = 1;
    // Emit a change signal
    if (!Private.isChangeEmpty(this._context.change)) {
      this._changed.emit({
        storeId,
        transactionId,
        type: 'transaction',
        change,
      });
    }
  }

  /**
   * Undo a patch that was previously applied.
   *
   * @param transactionId - The transaction to undo.
   *
   * @returns A promise which resolves when the action is complete.
   *
   * @throws An exception if `undo` is called during a mutation.
   *
   * #### Notes
   * If changes are made, the `changed` signal will be emitted before
   * the promise resolves.
   */
  undo(transactionId: string): Promise<void> {
    if (!this._adapter) {
      return Promise.resolve(undefined);
    }
    return this._adapter.undo(transactionId);
  }

  /**
   * Redo a patch that was previously undone.
   *
   * @param transactionId - The transaction to redo.
   *
   * @returns A promise which resolves when the action is complete.
   *
   * @throws An exception if `redo` is called during a mutation.
   *
   * #### Notes
   * If changes are made, the `changed` signal will be emitted before
   * the promise resolves.
   */
  redo(transactionId: string): Promise<void> {
    if (!this._adapter) {
      return Promise.resolve(undefined);
    }
    return this._adapter.redo(transactionId);
  }

  /**
   * The handler for broadcasting transactions to peers.
   */
  get adapter(): IServerAdapter | null {
    return this._adapter;
  }

  /**
   * Serialize the state of the datastore to a string.
   *
   * @returns The serialized state.
   */
  toString(): string {
    return JSON.stringify(toObject(
      map(this, (table): [string, Record<Schema>[]] => {
        return [table.schema.id, toArray(table)];
      })
    ));
  }

  /**
   * Create a new datastore.
   *
   * @param id - The unique id of the datastore.
   * @param tables - The tables of the datastore.
   */
  private constructor(
    context: Datastore.Context,
    tables: BPlusTree<Table<Schema>>,
    adapter?: IServerAdapter,
    transactionIdFactory?: Datastore.TransactionIdFactory
  ) {
    this._context = context;
    this._tables = tables;
    this._adapter = adapter || null;
    this._transactionIdFactory = transactionIdFactory || createDuplexId;
    if (this._adapter) {
      this._adapter.received.connect(
        this._onRemoteTransaction,
        this
      );
    }
  }

  /**
   * Handle a transaction from the server adapter.
   */
  private _onRemoteTransaction(
    sender: IServerAdapter,
    args: IServerAdapter.IReceivedArgs
  ): void {
    let { transaction, type } = args;
    switch (type) {
      case 'undo':
        this._processTransaction(transaction, type);
        break;
      case 'redo':
      case 'transaction':
        this._processTransaction(transaction, type);
        break;
      default:
        throw 'Unreachable';
        break;
    }
  }

  /**
   * Apply a transaction to the datastore.
   *
   * @param transaction - The data of the transaction.
   *
   * @throws An exception if `apply` is called during a mutation.
   *
   * #### Notes
   * If changes are made, the `changed` signal will be emitted.
   */
  private _processTransaction(transaction: Datastore.Transaction, which: Datastore.TransactionType = 'transaction'): void {
    const {storeId, patch} = transaction;

    this._initTransaction(transaction.id, Math.max(this._context.version, transaction.version));
    const change: Datastore.MutableChange = {};
    try {
      each(iterItems(patch), ([schemaId, tablePatch]) => {
        const table = this._tables.get(schemaId, Private.recordIdCmp);
        if (table === undefined) {
          console.warn(
            `Missing table for schema id '${
              schemaId
            }' in transaction '${transaction.id}'`);
          this._finalizeTransaction();
          return;
        }
        if (which === 'transaction' || which === 'redo') {
          let count = this._cemetery[transaction.id];
          if (count === undefined) {
            this._cemetery[transaction.id] = 1;
            change[schemaId] = Table.patch(table, tablePatch);
            return;
          }
          this._cemetery[transaction.id] = count + 1;
          // If the transaction is just now positive, apply it to the store.
          if (this._cemetery[transaction.id] === 1) {
            change[schemaId] = Table.patch(table, tablePatch);
            return;
          }
        } else {
          let count = this._cemetery[transaction.id];
          if (count === undefined) {
            this._cemetery[transaction.id] = -1;
            return;
          }
          this._cemetery[transaction.id] = count - 1;
          // If the transaction hasn't already been unapplied, do so.
          if (this._cemetery[transaction.id] === 0) {
            change[schemaId] = Table.unpatch(table, tablePatch);
          }
        }
      });
    } finally {
      this._finalizeTransaction();
    }
    if (!Private.isChangeEmpty(change)) {
      this._changed.emit({
        storeId,
        transactionId: transaction.id,
        type: which,
        change,
      });
    }
  }

  /**
   * Reset the context state for a new transaction.
   *
   * @param id - The id of the new transaction.
   * @param newVersion - The version of the datastore after the transaction.
   *
   * @throws An exception if a transaction is already in progress.
   */
  private _initTransaction(id: string, newVersion: number): void {
    const context = this._context as Private.MutableContext;
    if (context.inTransaction) {
      throw new Error(`Already in a transaction: ${this._context.transactionId}`);
    }
    context.inTransaction = true;
    context.change = {};
    context.patch = {};
    context.transactionId = id;
    context.version = newVersion;
  }

  /**
   * Finalize the context state for a transaction in progress.
   *
   * @throws An exception if no transaction is in progress.
   */
  private _finalizeTransaction(): void {
    const context = this._context as Private.MutableContext;
    if (!context.inTransaction) {
      throw new Error('No transaction in progress.');
    }
    context.inTransaction = false;
  }

  private _adapter: IServerAdapter | null;
  private _cemetery: { [id: string]: number } = {};
  private _disposed = false;
  private _tables: BPlusTree<Table<Schema>>;
  private _context: Datastore.Context;
  private _changed = new Signal<Datastore, Datastore.IChangedArgs>(this);
  private _transactionIdFactory: Datastore.TransactionIdFactory;
}


/**
 * The namespace for the `Datastore` class statics.
 */
export
namespace Datastore {
  /**
   * A type alias for kinds of transactions.
   */
  export type TransactionType = 'transaction' | 'undo' | 'redo';

  /**
   * An options object for initializing a datastore.
   */
  export
  interface IOptions {
    /**
     * The unique id of the datastore.
     */
    id: number;

    /**
     * The table schemas of the datastore.
     */
    schemas: ReadonlyArray<Schema>;

    /**
     * An optional handler for broadcasting transactions to peers.
     */
    adapter?: IServerAdapter;

    /**
     * An optional transaction id factory to override the default.
     */
    transactionIdFactory?: TransactionIdFactory;

    /**
     * Initialize the state to a previously serialized one.
     */
    restoreState?: string;
  }

  /**
   * The arguments object for the store `changed` signal.
   */
  export
  interface IChangedArgs {
    /**
     * Whether the change was generated by transaction, undo, or redo.
     */
    readonly type: TransactionType;

    /**
     * The transaction id associated with the change.
     */
    readonly transactionId: string;

    /**
     * The id of the store responsible for the change.
     */
    readonly storeId: number;

    /**
     * A mapping of schema id to table change set.
     */
    readonly change: Change;
  }

  /**
   * A type alias for a store change.
   */
  export
  type Change = {
    readonly [schemaId: string]: Table.Change<Schema>;
  };

  /**
   * A type alias for a store patch.
   */
  export
  type Patch = {
    readonly [schemaId: string]: Table.Patch<Schema>;
  };

  /**
   * @internal
   */
  export
  type MutableChange = {
    [schemaId: string]: Table.MutableChange<Schema>;
  };

  /**
   * @internal
   */
  export
  type MutablePatch = {
    [schemaId: string]: Table.MutablePatch<Schema>;
  };

  /**
   * An object representing a datastore transaction.
   */
  export
  type Transaction = {

    /**
     * The id of the transaction.
     */
    readonly id: string;

    /**
     * The id of the store responsible for the transaction.
     */
    readonly storeId: number;

    /**
     * The patch data of the transaction.
     */
    readonly patch: Patch;

    /**
     * The version of the source datastore.
     */
    readonly version: number;
  }

  /**
   * @internal
   */
  export
  type Context = Readonly<Private.MutableContext>;

  /**
   * A factory function for generating a unique transaction id.
   */
  export
  type TransactionIdFactory = (version: number, storeId: number) => string;
}


namespace Private {
  /**
   * Validates all schemas, and throws an error if any are invalid.
   */
  export
  function validateSchemas(schemas: ReadonlyArray<Schema>) {
    const errors = [];
    for (let s of schemas) {
      const err = validateSchema(s);
      if (err.length) {
        errors.push(`Schema '${s.id}' validation failed: \n${err.join('\n')}`);
      }
    }
    if (errors.length) {
      throw new Error(errors.join('\n\n'));
    }
  }

  /**
   * A three-way record comparison function.
   */
  export
  function recordCmp<S extends Schema>(a: Table<S>, b: Table<S>): number {
    return StringExt.cmp(a.schema.id, b.schema.id);
  }

  /**
   * A three-way record id comparison function.
   */
  export
  function recordIdCmp<S extends Schema>(table: Table<S>, id: string): number {
    return StringExt.cmp(table.schema.id, id);
  }

  export
  type MutableContext = {
    /**
     * Whether the datastore currently in a transaction.
     */
    inTransaction: boolean;

    /**
     * The id of the current transaction.
     */
    transactionId: string;

    /**
     * The current version of the datastore.
     */
    version: number;

    /**
     * The unique id of the datastore.
     */
    storeId: number;

    /**
     * The current change object of the transaction.
     */
    change: Datastore.MutableChange;

    /**
     * The current patch object of the transaction.
     */
    patch: Datastore.MutablePatch;
  }

  /**
   * Checks if a patch is empty.
   */
  export
  function isPatchEmpty(patch: Datastore.Patch): boolean {
    return Object.keys(patch).length === 0;
  }

  /**
   * Checks if a change is empty.
   */
  export
  function isChangeEmpty(change: Datastore.Change): boolean {
    return Object.keys(change).length === 0;
  }
}
