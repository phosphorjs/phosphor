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

type RegisterValue = { value: string };

describe('@phosphor/datastore', () => {

  describe('RegisterField', () => {

    let field: RegisterField<RegisterValue>;

    beforeEach(() => {
        field = new RegisterField<RegisterValue>({
          value: { value: 'a' }
        });
    });

    describe('constructor()', () => {

      it('should accept options', () => {
        expect(field.value.value).to.equal('a');
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
        expect(value.value).to.equal('a');
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

    });

    describe('applyPatch', () => {

      it('should return the result of the patch', () => {
        let metadata = field.createMetadata();
        let update = field.applyUpdate({
          previous: field.value,
          metadata,
          update: { value: 'updated' },
          version: 1,
          storeId: 1
        });
        expect(update.value.value).to.equal('updated');
        metadata = field.createMetadata();
        let patch = field.applyPatch({
          previous: field.value,
          metadata,
          patch: update.patch
        });
        expect(patch.value.value).to.equal('updated');
        expect(patch.change.current.value).to.equal('updated');
        expect(patch.change.previous.value).to.equal('a');
      });

      it('should allow for out-of-order patches', () => {
        let metadata = field.createMetadata();
        // Apply updates to generate patches.
        let update1 = field.applyUpdate({
          previous: field.value,
          metadata,
          update: { value: 'updated' },
          version: 1,
          storeId: 1
        });
        let update2 = field.applyUpdate({
          previous: update1.value,
          metadata,
          update: { value: 'updated-later' },
          version: 2,
          storeId: 1
        });
        expect(update2.value.value).to.equal('updated-later');
        // Apply the patches out of order.
        metadata = field.createMetadata();
        let patch1 = field.applyPatch({
          previous: field.value,
          metadata,
          patch: update2.patch
        });
        let patch2 = field.applyPatch({
          previous: patch1.value,
          metadata,
          patch: update1.patch
        });
        expect(patch2.value.value).to.equal('updated-later');
        expect(patch2.change.current.value).to.equal('updated-later');
        expect(patch2.change.previous.value).to.equal('updated-later');
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
        expect(merged.previous.value).to.equal('a');
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
