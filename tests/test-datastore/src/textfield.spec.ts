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
  TextField
} from '@phosphor/datastore';

describe('@phosphor/datastore', () => {

  describe('TextField', () => {

    let field: TextField;

    beforeEach(() => {
        field = new TextField({
          description: 'A text field storing strings'
        });
    });

    describe('constructor()', () => {

      it('should create a list field', () => {
        expect(field).to.be.instanceof(TextField);
      });

    });

    describe('type', () => {

      it('should return the type of the field', () => {
        expect(field.type).to.equal('text');
      });

    });

    describe('createValue()', () => {

      it('should create an initial value for the field', () => {
        expect(field.createValue()).to.equal('');
      });

    });

    describe('createMetadata()', () => {

      it('should create initial metadata for the field', () => {
        expect(field.createMetadata()).to.eql({ ids: [], cemetery: {} });
      });

    });

    describe('applyUpdate', () => {

      it('should return the result of the update', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        let splice = {
          index: 0,
          remove: 0,
          text: 'abc'
        };
        let { value, change, patch } = field.applyUpdate({
          previous,
          update: splice,
          metadata,
          version: 1,
          storeId: 1
        });
        expect(value).to.equal('abc');
        expect(change[0]).to.eql({ index: 0, removed: '', inserted: 'abc'});
        expect(patch.length).to.equal(1);
        expect(patch[0].removedText.length).to.equal(splice.remove);
        expect(patch[0].insertedText).to.equal(splice.text);
        expect(patch[0].removedIds.length).to.equal(splice.remove);
        expect(patch[0].insertedIds.length).to.equal(splice.text.length);
      });

      it('should accept multiple splices', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        let splice1 = {
          index: 0,
          remove: 0,
          text: 'abc'
        };
        let splice2 = {
          index: 1,
          remove: 1,
          text: 'de'
        };
        let { value, change, patch } = field.applyUpdate({
          previous,
          update: [splice1, splice2],
          metadata,
          version: 1,
          storeId: 1
        });
        expect(value).to.equal('adec');
        expect(change.length).to.eql(2);
        expect(change[0]).to.eql({ index: 0, removed: '', inserted: 'abc'});
        expect(change[1]).to.eql({ index: 1, removed: 'b', inserted: 'de'});
        expect(patch.length).to.equal(2);
        expect(patch[0].removedText.length).to.equal(splice1.remove);
        expect(patch[0].insertedText).to.eql(splice1.text);
        expect(patch[0].removedIds.length).to.equal(splice1.remove);
        expect(patch[0].insertedIds.length).to.equal(splice1.text.length);
        expect(patch[1].removedText.length).to.equal(splice2.remove);
        expect(patch[1].insertedText).to.equal(splice2.text);
        expect(patch[1].removedIds.length).to.equal(splice2.remove);
        expect(patch[1].insertedIds.length).to.equal(splice2.text.length);
      });

    });

    describe('applyPatch', () => {

      it('should return the result of the patch', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        // Create a patch
        let { patch } = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, text: 'abc' },
          metadata,
          version: 1,
          storeId: 1
        });
        // Reset the metadata
        metadata = field.createMetadata();
        let patched = field.applyPatch({
          previous,
          metadata,
          patch
        });
        expect(patched.value).to.equal('abc');
        expect(patched.change[0]).to.eql({index: 0, removed: '', inserted: 'abc'});
      });

      it('should allow for out-of-order patches', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();

        // Generate some patches.
        let firstUpdate = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, text: 'agc' },
          metadata,
          version: 1,
          storeId: 1
        });
        let secondUpdate = field.applyUpdate({
          previous: firstUpdate.value,
          update: { index: 1, remove: 1, text: 'b' },
          metadata,
          version: 2,
          storeId: 1
        });
        expect(secondUpdate.value).to.equal('abc');

        // Now apply the patches on another client in a different order.
        // They should have the same resulting value.
        metadata = field.createMetadata();
        let firstPatch = field.applyPatch({
          previous,
          metadata,
          patch: secondUpdate.patch
        });
        let secondPatch = field.applyPatch({
          previous: firstPatch.value,
          metadata,
          patch: firstUpdate.patch
        });
        expect(secondPatch.value).to.equal('abc');
      });

    });

    describe('mergeChange', () => {

      it('should merge two successive changes', () => {
        let change1 = [
          {
            index: 0,
            removed: '',
            inserted: 'ab'
          }
        ];
        let change2 = [
          {
            index: 1,
            removed: 'b',
            inserted: 'cd'
          }
        ];
        let result = field.mergeChange(change1, change2);
        expect(result).to.eql([...change1, ...change2]);
      });

    });

    describe('mergePatch', () => {

      it('should merge two successive patches', () => {
        let patch1 = [
          {
            removedIds: [],
            removedText: '' ,
            insertedIds: ['id-1', 'id-2'],
            insertedText: 'ab'
          }
        ];
        let patch2 = [
          {
            removedIds: ['id-2'],
            removedText: 'b',
            insertedIds: ['id-3', 'id-4'],
            insertedText: 'cd'
          }
        ];
        let result = field.mergePatch(patch1, patch2);
        expect(result).to.eql([...patch1, ...patch2]);
      });

    });

  });

});
