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
  MapField
} from '@phosphor/datastore';

type MapValue = string;

describe('@phosphor/datastore', () => {

  describe('MapField', () => {

    let field: MapField<MapValue>;

    beforeEach(() => {
        field = new MapField<MapValue>({
          description: 'A map field storing strings'
        });
    });

    describe('constructor()', () => {

      it('should create a map field', () => {
        expect(field).to.be.instanceof(MapField);
      });

    });

    describe('type', () => {

      it('should return the type of the field', () => {
        expect(field.type).to.equal('map');
      });

    });

    describe('createValue()', () => {

      it('should create an initial value for the field', () => {
        let value = field.createValue();
        expect(value).to.eql({});
      });

    });

    describe('createMetadata()', () => {

      it('should create initial metadata for the field', () => {
        let metadata = field.createMetadata();
        expect(metadata).to.eql({ ids: {}, values: {} });
      });

    });

    describe('applyUpdate', () => {

      it('should apply an update to a value', () => {
        let previous = {'zero': 'zeroth'};
        let metadata = field.createMetadata();
        let update = {
          'one': 'first',
          'two': 'second'
        };
        let { value, patch } = field.applyUpdate({
          previous,
          metadata,
          update,
          version: 1,
          storeId: 1
        });
        expect(value).to.eql({
          'zero': 'zeroth',
          'one': 'first',
          'two': 'second'
        });
        expect(patch.values).to.eql(update);
      });

      it('should indicate changed values in the change object', () => {
        let previous = {'zero': 'zeroth', 'one': 'first' };
        let metadata = field.createMetadata();
        let update = {
          'one': null, // remove this field.
          'two': 'second' // add this field.
        };
        let { value, change } = field.applyUpdate({
          previous,
          metadata,
          update,
          version: 1,
          storeId: 1
        });
        expect(value).to.eql({ 'zero': 'zeroth', 'two': 'second' });
        expect(change.previous).to.eql({ 'one': 'first', 'two': null });
        expect(change.current).to.eql({ 'one': null, 'two': 'second' });
      });

    });

    describe('applyPatch', () => {

      it('should apply a patch to a value', () => {
        let previous = {'zero': 'zeroth'};
        let metadata = field.createMetadata();
        let update = field.applyUpdate({
          previous,
          metadata,
          update: { 'one': 'first', 'two': 'second' },
          version: 1,
          storeId: 1
        });
        let { value } = field.applyPatch({
          previous,
          patch: update.patch,
          metadata
        });
        expect(value).to.eql({ 'zero': 'zeroth', 'one': 'first', 'two': 'second' });
      });

      it('should indicate changed values in the change object', () => {
        let previous = {'zero': 'zeroth', 'one': 'first' };
        let metadata = field.createMetadata();
        let update = field.applyUpdate({
          previous,
          metadata,
          update: {
            'one': null, // remove this field.
            'two': 'second' // add this field.
          },
          version: 1,
          storeId: 1
        });
        let { value, change } = field.applyPatch({
          previous,
          patch: update.patch,
          metadata
        });
        expect(value).to.eql({ 'zero': 'zeroth', 'two': 'second' });
        expect(change.previous).to.eql({ 'one': 'first', 'two': null });
        expect(change.current).to.eql({ 'one': null, 'two': 'second' });
      });

      it('should allow for out-of-order patches', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        // Generate some patches.
        let update1 = field.applyUpdate({
          previous,
          metadata,
          update: { 'a': 'a', 'b': 'b' },
          version: 1,
          storeId: 1
        });
        let update2 = field.applyUpdate({
          previous: update1.value,
          metadata,
          update: {'a': null, 'c': 'c' },
          version: 2,
          storeId: 1
        });
        expect(update2.value).to.eql({'b': 'b', 'c': 'c'});

        //Reset the metadata and apply the patches out of order.
        metadata = field.createMetadata();
        let patch1 = field.applyPatch({
          previous,
          metadata,
          patch: update2.patch
        });
        expect(patch1.value).to.eql({'c': 'c'})
        expect(patch1.change.previous).to.eql({'a': null, 'c': null });
        expect(patch1.change.current).to.eql({'a': null, 'c': 'c'});
        let patch2 = field.applyPatch({
          previous: patch1.value,
          metadata,
          patch: update1.patch
        });
        expect(patch2.value).to.eql({'b': 'b', 'c': 'c'});
        expect(patch2.change.previous).to.eql({'a': null, 'b': null});
        expect(patch2.change.current).to.eql({'a': null, 'b': 'b'});
      });

    });

    describe('mergeChange', () => {

      it('should merge two successive changes', () => {
        let change1 = {
          previous: {},
          current: { first: 'first-change' }
        };
        let change2 = {
          previous: {},
          current: { second: 'second-change' }
        };
        let result = field.mergeChange(change1, change2);
        expect(result.previous).to.eql({});
        expect(result.current).to.eql({
          first: 'first-change',
          second: 'second-change'
        });

      });

      it('should prefer the first change for the previous merged field', () => {
        let change1 = {
          previous: { value: 'value' },
          current: { value: 'value-changed' }
        };
        let change2 = {
          previous: { value: 'other'},
          current: { value: 'other-changed' }
        };
        let result = field.mergeChange(change1, change2);
        expect(result.previous).to.eql({ value: 'value' });
      });

      it('should prefer the second change for the current merged field', () => {
        let change1 = {
          previous: { value: 'value' },
          current: { value: 'value-changed' }
        };
        let change2 = {
          previous: { value: 'other'},
          current: { value: 'other-changed' }
        };
        let result = field.mergeChange(change1, change2);
        expect(result.current).to.eql({ value: 'other-changed' });
      });

    });

    describe('mergePatch', () => {

      it('should merge two patches into a single patch object', () => {
        let patch1 = {
          id: 'one',
          values: { first: 'first' }
        };
        let patch2 = {
          id: 'two',
          values: { second: 'second' }
        };
        let result = field.mergePatch(patch1, patch2);
        expect(result).to.eql({
          id: 'two',
          values: { first: 'first', second: 'second' }
        });
      });

      it('should prefer the second patch over the first', () => {
        let patch1 = {
          id: 'one',
          values: { first: 'first', second: 'second' }
        };
        let patch2 = {
          id: 'two',
          values: { first: 'other', second: 'next-other' }
        };
        let result = field.mergePatch(patch1, patch2);
        expect(result).to.eql(patch2);
      });

    });

  });

});
