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
  Datastore, Fields, ListField, RegisterField, TextField
} from '@phosphor/datastore';

import {
  IMessageHandler, Message
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

class LoggingMessageHandler implements IMessageHandler {
  processMessage(msg: Message): void {
    switch(msg.type) {
    case 'datastore-transaction':
      this.transactions.push((msg as Datastore.TransactionMessage).transaction);
      break;
    default:
      throw Error('Unexpected message');
      break;
    }
  }
  transactions: Datastore.Transaction[] = [];
}

describe('@phosphor/datastore', () => {

  describe('Datastore', () => {

    let datastore: Datastore;
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
        }).to.throw;
        let invalid2 = {
          id: 'invalid-schema',
          fields: {
            '$content': Fields.Text(),
          }
        };
        expect(() => {
          Datastore.create({ id: 1, schemas: [invalid2] });
        }).to.throw;
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
        expect(() => { datastore.get(schema3); }).to.throw;
      });

    });

    describe('beginTransaction()', () => {

      it('should allow for mutations on the datastore', () => {
        let t1 = datastore.get(schema1);
        expect(datastore.inTransaction).to.be.false;
        expect(() => {
          t1.update({ 'my-record': { enabled: true } });
        }).to.throw;
        datastore.beginTransaction();
        t1.update({ 'my-record': { enabled: true } });
        expect(datastore.inTransaction).to.be.true;
        datastore.endTransaction();
        expect(datastore.inTransaction).to.be.false;
      });

      it('should return a transaction id', () => {
        expect(datastore.beginTransaction()).to.not.equal('');
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

    });

    describe('undo()', () => {

      it('should throw', () => {
        expect(() => { datastore.undo(''); }).to.throw;
      });

    });

    describe('redo()', () => {

      it('should throw', () => {
        expect(() => { datastore.redo(''); }).to.throw;
      });

    });

  });

});

