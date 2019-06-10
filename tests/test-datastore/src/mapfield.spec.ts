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
        const value = field.createValue();
        expect(value).to.eql({});
      });

    });

    describe('createMetadata()', () => {

      it('should create initial metadata for the field', () => {
        const metadata = field.createMetadata();
        expect(metadata).to.eql({ ids: {}, values: {} });
      });

    });

    describe('applyUpdate', () => {
    });

    describe('applyPatch', () => {
    });

    describe('mergeChange', () => {

      it('should merge two successive changes', () => {
        const change1 = {
          previous: {},
          current: { first: 'first-change' }
        };
        const change2 = {
          previous: {},
          current: { second: 'second-change' }
        };
        const result = field.mergeChange(change1, change2);
        expect(result.previous).to.eql({});
        expect(result.current).to.eql({
          first: 'first-change',
          second: 'second-change'
        });

      });

      it('should prefer the first change for the previous merged field', () => {
        const change1 = {
          previous: { value: 'value' },
          current: { value: 'value-changed' }
        };
        const change2 = {
          previous: { value: 'other'},
          current: { value: 'other-changed' }
        };
        const result = field.mergeChange(change1, change2);
        expect(result.previous).to.eql({ value: 'value' });
      });

      it('should prefer the second change for the current merged field', () => {
        const change1 = {
          previous: { value: 'value' },
          current: { value: 'value-changed' }
        };
        const change2 = {
          previous: { value: 'other'},
          current: { value: 'other-changed' }
        };
        const result = field.mergeChange(change1, change2);
        expect(result.current).to.eql({ value: 'other-changed' });
      });

    });

    describe('mergePatch', () => {

      it('should merge two patches into a single patch object', () => {
        const patch1 = {
          id: 'one',
          values: { first: 'first' }
        };
        const patch2 = {
          id: 'two',
          values: { second: 'second' }
        };
        const result = field.mergePatch(patch1, patch2);
        expect(result).to.eql({
          id: 'two',
          values: { first: 'first', second: 'second' }
        });
      });

      it('should prefer the second patch over the first', () => {
        const patch1 = {
          id: 'one',
          values: { first: 'first', second: 'second' }
        };
        const patch2 = {
          id: 'two',
          values: { first: 'other', second: 'next-other' }
        };
        const result = field.mergePatch(patch1, patch2);
        expect(result).to.eql(patch2);
      });

    });

  });

});
