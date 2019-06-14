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
      });

      it('should allow for out-of-order patches', () => {
      });


      it('should update the metadata with the patch ordering', () => {
      });

    });

    describe('applyPatch', () => {

      it('should return the result of the patch', () => {
      });

      it('should update the metadata with the patch ordering', () => {
      });

    });

    describe('mergeChange', () => {

      it('should merge two successive changes', () => {
        const change1 = [
          {
            index: 0,
            removed: '',
            inserted: 'ab'
          }
        ];
        const change2 = [
          {
            index: 1,
            removed: 'b',
            inserted: 'cd'
          }
        ];
        const result = field.mergeChange(change1, change2);
        expect(result).to.eql([...change1, ...change2]);
      });

    });

    describe('mergePatch', () => {

      it('should merge two successive patches', () => {
        const patch1 = [
          {
            removedIds: [],
            removedText: '' ,
            insertedIds: ['id-1', 'id-2'],
            insertedText: 'ab'
          }
        ];
        const patch2 = [
          {
            removedIds: ['id-2'],
            removedText: 'b',
            insertedIds: ['id-3', 'id-4'],
            insertedText: 'cd'
          }
        ];
        const result = field.mergePatch(patch1, patch2);
        expect(result).to.eql([...patch1, ...patch2]);
      });

    });

  });

});
