/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  Datastore, Fields, IServerAdapter, ListField, RegisterField, TextField
} from '@phosphor/datastore';

import {
  ISignal, Signal
} from '@phosphor/signaling';


type CustomMetadata = { id: string };

type TestSchema = {
  id: string;
  fields: {
    content: TextField,
    count: RegisterField<number>,
    enabled: RegisterField<boolean>,
    links: ListField<string>,
    metadata: RegisterField<CustomMetadata>
  }
}

let schema1: TestSchema = {
  id: 'test-schema-1',
  fields: {
    content: Fields.Text(),
    count:Fields.Number(),
    enabled: Fields.Boolean(),
    links: Fields.List<string>(),
    metadata: Fields.Register<CustomMetadata>({ value: { id: 'identifier' }})
  }
};

let schema2: TestSchema = {
  id: 'test-schema-2',
  fields: {
    content: Fields.Text(),
    count:Fields.Number(),
    enabled: Fields.Boolean(),
    links: Fields.List<string>(),
    metadata: Fields.Register<CustomMetadata>({ value: { id: 'identifier' }})
  }
};

let state = {
  [schema1.id]: [
    {
      content: 'Lorem Ipsum',
      count: 42,
      enabled: true,
      links: ['www.example.com'],
      metadata: { id: 'myidentifier' }
    }
  ],
  [schema2.id]: [
    {
      content: 'Ipsum Lorem',
      count: 33,
      enabled: false,
      links: ['www.example.com', 'https://github.com/phosphor/phosphorjs'],
      metadata: null
    }
  ]
};

class InMemoryServerAdapter implements IServerAdapter {
  broadcast(transaction: Datastore.Transaction): void {
    this._transactions[transaction.id] = transaction;
  }

  undo(id: string): Promise<void> {
    this._received.emit({
      type: 'undo',
      transaction: this._transactions[id]
    });
    return Promise.resolve(undefined);
  }

  redo(id: string): Promise<void> {
    this._received.emit({
      type: 'redo',
      transaction: this._transactions[id]
    });
    return Promise.resolve(undefined);
  }

  get received(): ISignal<this, IServerAdapter.IReceivedArgs> {
    return this._received;
  }

  get transactions(): { [id: string]: Datastore.Transaction } {
    return this._transactions;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  private _isDisposed = false;
  private _received = new Signal<this, IServerAdapter.IReceivedArgs>(this);
  private _transactions: { [id: string]: Datastore.Transaction } = {};
}

describe('@phosphor/datastore', () => {

  describe('Datastore', () => {

    let datastore: Datastore;
    let adapter: InMemoryServerAdapter;
    const DATASTORE_ID = 1234;
    beforeEach(() => {
      adapter = new InMemoryServerAdapter();
      datastore = Datastore.create({
        id: DATASTORE_ID,
        schemas: [schema1, schema2],
        adapter
      });
    });

    describe('create()', () => {

      it('should create a new datastore', () => {
        let datastore = Datastore.create({ id: 1, schemas: [schema1] });
        expect(datastore).to.be.instanceof(Datastore);
      });

      it('should throw an error for an invalid schema', () => {
        let invalid1 = {
          id: 'invalid-schema',
          fields: {
            '@content': Fields.Text(),
          }
        };
        expect(() => {
          Datastore.create({ id: 1, schemas: [invalid1] });
        }).to.throw(/validation failed/);
        let invalid2 = {
          id: 'invalid-schema',
          fields: {
            '$content': Fields.Text(),
          }
        };
        expect(() => {
          Datastore.create({ id: 1, schemas: [invalid2] });
        }).to.throw(/validation failed/);
      });

      it('should restore valid state', () => {
        let datastore = Datastore.create({
          id: 1,
          schemas: [schema1, schema2],
          restoreState: JSON.stringify(state)
        });

        let reexport = datastore.toString();
        expect(JSON.parse(reexport)).to.eql(state);
      });

      it('should restore partial state', () => {
        let partialState = {[schema1.id]: state[schema1.id] };
        let datastore = Datastore.create({
          id: 1,
          schemas: [schema1, schema2],
          restoreState: JSON.stringify(partialState)
        });

        let reexport = datastore.toString();
        expect(JSON.parse(reexport)).to.eql(
          {
            ...partialState,
            [schema2.id]: []
          });
      });

    });

    describe('dispose()', () => {

      it('should dispose of the resources held by the datastore', () => {
        expect(datastore.adapter).to.not.be.null;
        datastore.dispose();
        expect(datastore.adapter).to.be.null;
      });

      it('should be safe to call more than once', () => {
        datastore.dispose();
        datastore.dispose();
      });

    });

    describe('isDisposed()', () => {

      it('should indicate whether the datastore is disposed', () => {
        expect(datastore.isDisposed).to.be.false;
        datastore.dispose();
        expect(datastore.isDisposed).to.be.true;
      });

    });

    describe('changed', () => {

      it('should should emit upon changes to the datastore', () => {
        let called = false;
        let id = '';
        datastore.changed.connect((_, change) => {
          called = true;
          expect(change.type).to.equal('transaction');
          expect(change.transactionId).to.equal(id);
          expect(change.storeId).to.equal(DATASTORE_ID);
          expect(change.change['test-schema-1']).to.not.be.undefined;
          expect(change.change['test-schema-2']).to.be.undefined;
        });
        let t1 = datastore.get(schema1);
        id = datastore.beginTransaction();
        t1.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        expect(called).to.be.true;
      });
    });

    describe('id', () => {

      it('should return the unique store id', () => {
        expect(datastore.id).to.equal(DATASTORE_ID);
      });

    });

    describe('inTransaction', () => {

      it('should indicate whether the datastore is in a transaction', () => {
        expect(datastore.inTransaction).to.be.false;
        datastore.beginTransaction();
        expect(datastore.inTransaction).to.be.true;
        datastore.endTransaction();
        expect(datastore.inTransaction).to.be.false;
      });

    });

    describe('adapter', () => {

      it('should be the adapter for the datastore', () => {
        expect(datastore.adapter).to.equal(adapter);
      });

      it('should recieve transactions from the datastore', () => {
        let t2 = datastore.get(schema2);
        datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        expect(Object.keys(adapter.transactions).length).to.equal(0);
        datastore.endTransaction();
        expect(Object.keys(adapter.transactions).length).to.equal(1);
      });

    });

    describe('version', () => {

      it('should increase with each transaction', () => {
        let version = datastore.version;
        let t1 = datastore.get(schema1);
        let t2 = datastore.get(schema2);

        datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();

        expect(datastore.version).to.be.above(version);
        version = datastore.version;

        datastore.beginTransaction();
        t1.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();

        expect(datastore.version).to.be.above(version);
      });

    });

    describe('iter()', () => {

      it('should return an iterator over the tables of the datastore', () => {
        let iterator = datastore.iter();
        let t1 = iterator.next();
        let t2 = iterator.next();
        expect(t1!.schema).to.equal(schema1);
        expect(t2!.schema).to.equal(schema2);
        expect(iterator.next()).to.be.undefined;
      });

    });

    describe('get()', () => {

      it('should return a table for a schema', () => {
        let t1 = datastore.get(schema1);
        let t2 = datastore.get(schema2);
        expect(t1.schema).to.equal(schema1);
        expect(t2.schema).to.equal(schema2);
      });

      it('should throw an error for a nonexistent schema', () => {
        let schema3 = { ...schema2, id: 'new-schema' };
        expect(() => { datastore.get(schema3); }).to.throw(/No table found/);
      });

    });

    describe('beginTransaction()', () => {

      it('should allow for mutations on the datastore', () => {
        let t1 = datastore.get(schema1);
        expect(datastore.inTransaction).to.be.false;
        expect(() => {
          t1.update({ 'my-record': { enabled: true } });
        }).to.throw(/A table can only be updated/);
        datastore.beginTransaction();
        t1.update({ 'my-record': { enabled: true } });
        expect(datastore.inTransaction).to.be.true;
        datastore.endTransaction();
        expect(datastore.inTransaction).to.be.false;
      });

      it('should return a transaction id', () => {
        expect(datastore.beginTransaction()).to.not.equal('');
        datastore.endTransaction();
      });

      it('should throw if called multiple times', () => {
        datastore.beginTransaction();
        expect(() => datastore.beginTransaction()).to.throw(/Already/);
        datastore.endTransaction();
      });

    });

    describe('endTransaction()', () => {

      it('should emit a changed signal with the user-facing changes', () => {
        let called = false;
        let id = '';
        datastore.changed.connect((_, change) => {
          called = true;
          expect(change.type).to.equal('transaction');
          expect(change.transactionId).to.equal(id);
          expect(change.storeId).to.equal(DATASTORE_ID);
          expect(change.change['test-schema-2']).to.not.be.undefined;
          expect(change.change['test-schema-1']).to.be.undefined;
        });
        let t2 = datastore.get(schema2);
        id = datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        expect(called).to.be.true;
      });

      it('should broadcast the transaction to the server adapter', () => {
        let t2 = datastore.get(schema2);
        datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        expect(Object.keys(adapter.transactions).length).to.equal(0);
        datastore.endTransaction();
        expect(Object.keys(adapter.transactions).length).to.equal(1);
      });

      it('should throw if there is not a transaction begun', () => {
        expect(() => datastore.endTransaction()).to.throw(/No transaction/);
      });

    });

    describe('undo()', () => {

      it('should be a no-op without a patch server', async () => {
        datastore = Datastore.create({
          id: DATASTORE_ID,
          schemas: [schema1, schema2],
          adapter
        });
        let t2 = datastore.get(schema2);
        let id = datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        let record = t2.get('my-record')!;
        expect(record.enabled).to.be.true;
        await datastore.redo(id);
        record = t2.get('my-record')!;
        expect(record.enabled).to.be.true;
      });

      it('should unapply a transaction by id', async () => {
        let t2 = datastore.get(schema2);
        let id = datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        await datastore.undo(id);
        let record = t2.get('my-record')!;
        expect(record.enabled).to.be.false;
      });

      it ('should allow for multiple undos', async () => {
        let t2 = datastore.get(schema2);
        let id = datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        await datastore.undo(id);
        await datastore.undo(id);
        await datastore.undo(id);
        let record = t2.get('my-record')!;
        expect(record.enabled).to.be.false;
      });

    });

    describe('redo()', () => {

      it('should be a no-op without a patch server', async () => {
        datastore = Datastore.create({
          id: DATASTORE_ID,
          schemas: [schema1, schema2],
          adapter
        });
        let t2 = datastore.get(schema2);
        let id = datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        let record = t2.get('my-record')!;
        expect(record.enabled).to.be.true;
        await datastore.redo(id);
        record = t2.get('my-record')!;
        expect(record.enabled).to.be.true;
      });

      it('should reapply a transaction by id', async () => {
        let t2 = datastore.get(schema2);
        let id = datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        let record = t2.get('my-record')!;
        expect(record.enabled).to.be.true;
        await datastore.undo(id);
        record = t2.get('my-record')!;
        expect(record.enabled).to.be.false;
        await datastore.redo(id);
        record = t2.get('my-record')!;
        expect(record.enabled).to.be.true;
      });

      it ('should have redos winning in a tie', async () => {
        let t2 = datastore.get(schema2);
        let id = datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        datastore.endTransaction();
        await datastore.undo(id);
        await datastore.undo(id);
        await datastore.undo(id);
        await datastore.redo(id);
        await datastore.redo(id);
        await datastore.redo(id);
        let record = t2.get('my-record')!;
        expect(record.enabled).to.be.true;
      });

    });

  });

});
