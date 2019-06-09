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
        const value = field.createValue();
        expect(value.value).to.equal('one');
      });

    });

    describe('createMetadata()', () => {

      it('should create an initial value for the field', () => {
        const metadata = field.createMetadata();
        expect(metadata.ids.length).to.equal(0);
        expect(metadata.values.length).to.equal(0);
      });

    });

    describe('applyUpdate', () => {

      it('should return the result of the update', () => {
        const newValue = {
            value: 'updated'
        };
        const update = {
          previous: field.value,
          metadata: field.createMetadata(),
          update: newValue,
          version: 2,
          storeId: 1
        };
        const result = field.applyUpdate(update);
        const { value, change, patch } = result;
        expect(value.value).to.equal(newValue.value);
        expect(change.previous).to.eql(field.value);
        expect(change.current).to.eql(value);
        expect(patch.id).to.not.equal('');
        expect(patch.value).to.eql(newValue);
      });

      it('should allow for out-of-order updates', () => {
        const metadata = field.createMetadata();
        const update1 = {
          previous: field.value,
          metadata,
          update: {
            value: 'latest-version'
          },
          version: 100,
          storeId: 2
        };
        const update2 = {
          previous: field.value,
          metadata,
          update: {
            value: 'later-version'
          },
          version: 10,
          storeId: 1
        };
        const update3 = {
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
        const result = field.applyUpdate(update3);
        const { value, change, patch } = result;
        expect(value.value).to.equal('latest-version');
        expect(change.current).to.eql(update1.update);
        expect(patch.id).to.not.equal('');
        expect(patch.value).to.eql(update3.update);
      });
    });
  });
});
