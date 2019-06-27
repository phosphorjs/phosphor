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
  toArray
} from '@phosphor/algorithm';

import {
  Datastore, Fields, ListField, RegisterField, Table, TextField
} from '@phosphor/datastore';


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

const schema: TestSchema = {
  id: 'test-schema',
  fields: {
    content: Fields.Text(),
    count:Fields.Number(),
    enabled: Fields.Boolean(),
    links: Fields.List<string>(),
    metadata: Fields.Register<CustomMetadata>({ value: { id: 'identifier' }})
  }
};

/**
 * Remove readonly guards from Context for testing purposes.
 */
type MutableContext = { -readonly [K in keyof Datastore.Context]: Datastore.Context[K] };

describe('@phosphor/datastore', () => {

  describe('Table', () => {

    let table: Table<TestSchema>;
    let context: MutableContext;

    beforeEach(() => {
      context = {
        inTransaction: false,
        transactionId: '',
        version: 1,
        storeId: 1,
        change: {},
        patch: {}
      };
      table = Table.create(schema, context);
    });

    describe('create()', () => {

      it('should create a new table', () => {
        const table = Table.create(schema, context); 
        expect(table).to.be.instanceof(Table);
      });

    });

    describe('schema', () => {

      it('should be the schema for the table', () => {
        expect(table.schema).to.equal(schema);
      });

    });

    describe('isEmpty', () => {

      it('should return whether the table is empty', () => {
        expect(table.isEmpty).to.be.true;
        context.inTransaction = true;
        table.update({
          'my-record': { enabled: true, count: 1 }
        });
        context.inTransaction = false;
        expect(table.isEmpty).to.be.false;

      });

    });

    describe('size', () => {

      it('should return the size of the table', () => {
        expect(table.size).to.equal(0);
        context.inTransaction = true;
        table.update({
          'my-record': { enabled: true, count: 1 },
          'my-other-record': { enabled: false, count: 2 },
          'my-other-other-record': { enabled: false, count: 3 }
        });
        context.inTransaction = false;
        expect(table.size).to.equal(3);
      });

    });

    describe('iter()', () => {

      it('should return an iterator over the records in the table', () => {
        context.inTransaction = true;
        table.update({
          'my-record': { },
          'my-other-record': { },
          'my-other-other-record': { }
        });
        context.inTransaction = false;
        const arr = toArray(table.iter());
        expect(arr.length).to.equal(3);

      });

    });

    describe('has()', () => {

      it('should return whether the table has a given record', () => {
        expect(table.has('my-record')).to.be.false;
        context.inTransaction = true;
        table.update({
          'my-record': { enabled: true, count: 1 }
        });
        context.inTransaction = false;
        expect(table.has('my-record')).to.be.true;

      });

    });

    describe('get()', () => {

      it('should return undefined if the record does not exist', () => {
        expect(table.get('my-record')).to.be.undefined;
      })
      
      it('should get an existing record from a table', () => {
        context.inTransaction = true;
        table.update({
          'my-record': { enabled: true, count: 1 }
        });
        context.inTransaction = false;
        const record = table.get('my-record')!;
        expect(record.$id).to.equal('my-record');
        expect(record.enabled).to.be.true;
        expect(record.count).to.equal(1);
      });

    });

    describe('update()', () => {

      it('should raise if the table is not in a transaction', () => {
        expect(() => {
          table.update({
            'my-record': { enabled: true, count: 1 }
          });
        }).to.throw('A table can only be updated during a transaction');

      });

      it('should create a record if it does not exist', () => {
        context.inTransaction = true;
        table.update({
          'my-record': { enabled: true, count: 1 }
        });
        context.inTransaction = false;
        const record = table.get('my-record')!;
        expect(record.$id).to.equal('my-record');
        expect(record['@@metadata']).to.not.equal(undefined);

      });

      it('should initialize values appropriately', () => {
        context.inTransaction = true;
        table.update({
          'my-record': { }
        });
        context.inTransaction = false;
        const record = table.get('my-record')!;
        expect(record.content).to.equal('');
        expect(record.enabled).to.be.false;
        expect(record.count).to.equal(0);
        expect(record.links).to.eql([]);
        expect(record.metadata).to.eql({ id: 'identifier' });

      });

      it('should update the records in the table', () => {
        context.inTransaction = true;
        table.update({
          'my-record': {}
        });
        context.inTransaction = false;
        let record = table.get('my-record')!;
        expect(record.content).to.equal('');
        context.inTransaction = true;
        table.update({
          'my-record': {
            content: { index: 0, remove: 0, text: 'text' },
            links: { index: 0, remove: 0, values: ['a', 'b', 'c'] }, 
            enabled: true,
            count: 10,
            metadata: { id: 'new-identifier' }
          }
        });
        context.inTransaction = false;
        record = table.get('my-record')!;
        expect(record.content).to.equal('text');
        expect(record.enabled).to.be.true;
        expect(record.count).to.equal(10);
        expect(record.links).to.eql(['a', 'b', 'c']);
        expect(record.metadata).to.eql({ id: 'new-identifier' });
      });

    });

    describe('patch()', () => {

      it('should create a record if it does not exist', () => {
        expect(table.get('my-record')).to.be.undefined;
        const patch = { 'my-record': { count: { id: 'unique-id', value: 2 } } };
        Table.patch(table, patch);
        expect(table.get('my-record')).to.not.be.undefined;
      });

      it('should patch an existing record', () => {
        context.inTransaction = true;
        table.update({ 'my-record': { count: 1 } });
        context.inTransaction = false;
        expect(table.get('my-record')!.count).to.equal(1);
        const patch = { 'my-record': { count: { id: 'unique-id', value: 2 } } };
        Table.patch(table, patch);
        expect(table.get('my-record')!.count).to.equal(2);
      });

      it('should return a user-facing change for the patch', () => {
        const patch = {
          'my-record': { enabled: { id: 'unique-id', value: true } }
        };
        const change = Table.patch(table, patch);
        expect(change['my-record']!.enabled!.previous).to.be.false;
        expect(change['my-record']!.enabled!.current).to.be.true;
      });

    });

  });

});
