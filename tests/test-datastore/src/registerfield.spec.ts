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
  RegisterField
} from '@phosphor/datastore';

import {
  createDuplexId
} from '@phosphor/datastore/lib/utilities';

type RegisterValue = { value: string };

describe('@phosphor/datastore', () => {

  describe('RegisterField', () => {

    let field: RegisterField<RegisterValue>;

    beforeEach(() => {
        field = new RegisterField<RegisterValue>({
          value: { value: 'one' }
        });
    });

    describe('constructor()', () => {

      it('should accept options', () => {
        expect(field.value.value).to.equal('one');
      });

    });

    describe('type', () => {

      it('should return the type of the field', () => {
        expect(field.type).to.equal('register');
      });

    });

    describe('createValue()', () => {

      it('should create an initial value for the field', () => {
        let value = field.createValue();
        expect(value.value).to.equal('one');
      });

    });

    describe('createMetadata()', () => {

      it('should create initial metadata for the field', () => {
        let metadata = field.createMetadata();
        expect(metadata.ids.length).to.equal(0);
        expect(metadata.values.length).to.equal(0);
      });

    });

    describe('applyUpdate', () => {

      it('should return the result of the update', () => {
        let newValue = {
            value: 'updated'
        };
        let update = {
          previous: field.value,
          metadata: field.createMetadata(),
          update: newValue,
          version: 2,
          storeId: 1
        };
        let result = field.applyUpdate(update);
        let { value, change, patch } = result;
        expect(value.value).to.equal(newValue.value);
        expect(change.previous).to.eql(field.value);
        expect(change.current).to.eql(value);
        expect(patch.id).to.not.equal('');
        expect(patch.value).to.eql(newValue);
      });

      it('should allow for out-of-order updates', () => {
        let metadata = field.createMetadata();
        let update1 = {
          previous: field.value,
          metadata,
          update: {
            value: 'latest-version'
          },
          version: 100,
          storeId: 2
        };
        let update2 = {
          previous: field.value,
          metadata,
          update: {
            value: 'later-version'
          },
          version: 10,
          storeId: 1
        };
        let update3 = {
          previous: field.value,
          metadata,
          update: {
            value: 'earlier-version'
          },
          version: 1,
          storeId: 2
        };
        field.applyUpdate(update1);
        field.applyUpdate(update2);
        let result = field.applyUpdate(update3);
        let { value, change, patch } = result;
        expect(value.value).to.equal('latest-version');
        expect(change.current).to.eql(update1.update);
        expect(patch.id).to.not.equal('');
        expect(patch.value).to.eql(update3.update);
      });

      it('should update the metadata with the patch ordering', () => {
        let metadata = field.createMetadata();
        let update1 = {
          previous: field.value,
          metadata,
          update: {
            value: 'later-version'
          },
          version: 10,
          storeId: 1
        };
        let update2 = {
          previous: field.value,
          metadata,
          update: {
            value: 'earlier-version'
          },
          version: 1,
          storeId: 2
        };
        field.applyUpdate(update1);
        field.applyUpdate(update2);
        expect(metadata.values.length).to.equal(2);
        expect(metadata.values[0]).to.equal(update2.update);
        expect(metadata.values[1]).to.equal(update1.update);
      });

    });

    describe('applyPatch', () => {

      it('should return the result of the patch', () => {
        let metadata = field.createMetadata();
        let previous = field.value;
        let update = {
            value: 'updated'
        };
        let id = createDuplexId(2, 1);
        let patch = { id, value: update };
        let result = field.applyPatch({ previous, patch, metadata });
        expect(result.value.value).to.equal('updated');
        expect(result.change.current.value).to.equal('updated');
        expect(result.change.previous.value).to.equal('one');
      });

      it('should allow for out-of-order patches', () => {
        let metadata = field.createMetadata();
        let previous = field.value;
        let update1 = {
            value: 'updated-later'
        };
        let update2 = {
            value: 'updated'
        };
        let id1 = createDuplexId(10 /* later version */, 2);
        let id2 = createDuplexId(1 /* earlier version */, 1);
        let patch1 = { id: id1, value: update1 };
        let patch2 = { id: id2, value: update2 };
        field.applyPatch({ previous, patch: patch1, metadata });
        let result = field.applyPatch({ previous, patch: patch2, metadata });
        expect(result.value.value).to.equal('updated-later');
        expect(result.change.current.value).to.equal('updated-later');
        expect(result.change.previous.value).to.equal('one');
      });

      it('should update the metadata with the patch ordering', () => {
        let metadata = field.createMetadata();
        let previous = field.value;
        let update1 = {
            value: 'updated-later'
        };
        let update2 = {
            value: 'updated'
        };
        let id1 = createDuplexId(10 /* later version */, 2);
        let id2 = createDuplexId(1 /* earlier version */, 1);
        let patch1 = { id: id1, value: update1 };
        let patch2 = { id: id2, value: update2 };
        field.applyPatch({ previous, patch: patch1, metadata });
        field.applyPatch({ previous, patch: patch2, metadata });
        expect(metadata.values.length).to.equal(2);
        expect(metadata.values[0]).to.equal(update2);
        expect(metadata.values[1]).to.equal(update1);
      });

    });

    describe('mergeChange', () => {

      it('should merge two successive changes', () => {
        let change1 = {
          previous: field.value,
          current: { value: 'first-change' }
        };
        let change2 = {
          previous: { value: 'first-change' },
          current: { value: 'second-change' }
        };
        let merged = field.mergeChange(change1, change2);
        expect(merged.previous.value).to.equal('one');
        expect(merged.current.value).to.equal('second-change');
      });

    });

    describe('mergePatch', () => {

      it('should merge two successive patches by choosing the second', () => {
        let patch1 = { id: 'first', value: { value: 'first' } };
        let patch2 = { id: 'second', value: { value: 'second' } };
        let merged = field.mergePatch(patch1, patch2);
        expect(merged).to.eql(patch2);
      });

    });

  });

});
