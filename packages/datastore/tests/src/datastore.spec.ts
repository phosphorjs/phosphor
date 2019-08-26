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
  Datastore, Fields, ListField, RegisterField, TextField, Schema
} from '@phosphor/datastore';

import {
  IMessageHandler, Message, MessageLoop
} from '@phosphor/messaging';


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

class LoggingMessageHandler implements IMessageHandler {
  processMessage(msg: Message): void {
    switch(msg.type) {
    case 'datastore-transaction':
      this.transactions.push((msg as Datastore.TransactionMessage<Schema>).transaction);
      break;
    default:
      throw Error('Unexpected message');
      break;
    }
  }
  transactions: Datastore.Transaction<Schema>[] = [];
}

describe('@phosphor/datastore', () => {

  describe('Datastore', () => {

    let datastore: Datastore<[typeof schema1, typeof schema2]>;
    let broadcastHandler: LoggingMessageHandler;
    const DATASTORE_ID = 1234;
    beforeEach(() => {
      broadcastHandler = new LoggingMessageHandler();
      datastore = Datastore.create({
        id: DATASTORE_ID,
        schemas: [schema1, schema2],
        broadcastHandler
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
        expect(datastore.broadcastHandler).to.not.be.null;
        datastore.dispose();
        expect(datastore.broadcastHandler).to.be.null;
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

    describe('broadcastHandler', () => {

      it('should be the broadcastHandler for the datastore', () => {
        expect(datastore.broadcastHandler).to.equal(broadcastHandler);
      });

      it('should recieve transactions from the datastore', () => {
        let t2 = datastore.get(schema2);
        datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        expect(broadcastHandler.transactions.length).to.equal(0);
        datastore.endTransaction();
        expect(broadcastHandler.transactions.length).to.equal(1);
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

      it('should send a transaction to the broadcast handler', () => {
        let t2 = datastore.get(schema2);
        datastore.beginTransaction();
        t2.update({ 'my-record': { enabled: true } });
        expect(broadcastHandler.transactions.length).to.equal(0);
        datastore.endTransaction();
        expect(broadcastHandler.transactions.length).to.equal(1);
      });

      it('should throw if there is not a transaction begun', () => {
        expect(() => datastore.endTransaction()).to.throw(/No transaction/);
      });

    });

    describe('processMessage()', () => {

      it('should accept transaction messages from other stores', () => {
        let t2 = datastore.get(schema2);
        datastore.beginTransaction();
        t2.update({ 'my-record': { count: 123, enabled: true } });
        datastore.endTransaction();
        datastore.beginTransaction();
        t2.update({ 'my-other-record': { count: 456, enabled: true } });
        datastore.endTransaction();
        let newDatastore = Datastore.create({
          id: DATASTORE_ID + 1,
          schemas: [schema1, schema2]
        });
        MessageLoop.sendMessage(
          newDatastore,
          new Datastore.TransactionMessage(broadcastHandler.transactions[0])
        );
        MessageLoop.sendMessage(
          newDatastore,
          new Datastore.TransactionMessage(broadcastHandler.transactions[1])
        );
        t2 = newDatastore.get(schema2);
        expect(t2.get('my-record')!.enabled).to.be.true;
        expect(t2.get('my-record')!.count).to.equal(123);
        expect(t2.get('my-other-record')!.enabled).to.be.true;
        expect(t2.get('my-other-record')!.count).to.equal(456);
      });

    });

    describe('undo()', () => {

      it('should throw', () => {
        expect(() => { datastore.undo(''); }).to.throw(/not implemented/);
      });

    });

    describe('redo()', () => {

      it('should throw', () => {
        expect(() => { datastore.redo(''); }).to.throw(/not implemented/);
      });

    });

  });

});
