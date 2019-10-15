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
  ListField
} from '@phosphor/datastore';

type ListValue = number;

/**
 * Return a shuffled copy of an array
 */
function shuffle<T>(array: ReadonlyArray<T>): T[] {
  let ret = array.slice();
  for (let i = ret.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [ret[i], ret[j]] = [ret[j], ret[i]]; // swap elements
  }
  return ret;
}

describe('@phosphor/datastore', () => {

  describe('ListField', () => {

    let field: ListField<ListValue>;

    beforeEach(() => {
        field = new ListField<ListValue>({
          description: 'A list field storing numbers'
        });
    });

    describe('constructor()', () => {

      it('should create a list field', () => {
        expect(field).to.be.instanceof(ListField);
      });

    });

    describe('type', () => {

      it('should return the type of the field', () => {
        expect(field.type).to.equal('list');
      });

    });

    describe('createValue()', () => {

      it('should create an initial value for the field', () => {
        let value = field.createValue();
        expect(value).to.eql([]);
      });

    });

    describe('createMetadata()', () => {

      it('should create initial metadata for the field', () => {
        let metadata = field.createMetadata();
        expect(metadata.ids).to.eql([]);
        expect(metadata.cemetery).to.eql({});
      });

    });

    describe('applyUpdate', () => {

      it('should return the result of the update', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        let splice = {
          index: 0,
          remove: 0,
          values: [1, 2, 3]
        };
        let { value, change, patch } = field.applyUpdate({
          previous,
          update: splice,
          metadata,
          version: 1,
          storeId: 1
        });
        expect(value).to.eql([1, 2, 3]);
        expect(change[0]).to.eql({ index: 0, removed: [], inserted: [1, 2, 3]});
        expect(patch.length).to.equal(1);
        expect(patch[0].removedValues.length).to.equal(splice.remove);
        expect(patch[0].insertedValues).to.eql(splice.values);
        expect(patch[0].removedIds.length).to.equal(splice.remove);
        expect(patch[0].insertedIds.length).to.equal(splice.values.length);
      });

      it('should accept multiple splices', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        let splice1 = {
          index: 0,
          remove: 0,
          values: [1, 2, 3]
        };
        let splice2 = {
          index: 1,
          remove: 1,
          values: [4, 5]
        };
        let { value, change, patch } = field.applyUpdate({
          previous,
          update: [splice1, splice2],
          metadata,
          version: 1,
          storeId: 1
        });
        expect(value).to.eql([1, 4, 5, 3]);
        expect(change.length).to.eql(2);
        expect(change[0]).to.eql({ index: 0, removed: [], inserted: [1, 2, 3]});
        expect(change[1]).to.eql({ index: 1, removed: [2], inserted: [4, 5]});
        expect(patch.length).to.equal(2);
        expect(patch[0].removedValues.length).to.equal(splice1.remove);
        expect(patch[0].insertedValues).to.eql(splice1.values);
        expect(patch[0].removedIds.length).to.equal(splice1.remove);
        expect(patch[0].insertedIds.length).to.equal(splice1.values.length);
        expect(patch[1].removedValues.length).to.equal(splice2.remove);
        expect(patch[1].insertedValues).to.eql(splice2.values);
        expect(patch[1].removedIds.length).to.equal(splice2.remove);
        expect(patch[1].insertedIds.length).to.equal(splice2.values.length);
      });

      it('should accept long splices', () => {
        let previous = field.createValue();
        let values: number[] = [];
        values.fill(0, 0, 1000000);
        let metadata = field.createMetadata();
        let splice = {
          index: 0,
          remove: 0,
          values
        };
        let { value } = field.applyUpdate({
          previous,
          update: [splice],
          metadata,
          version: 1,
          storeId: 1
        });
        expect(value).to.eql(values);
      });

    });

    describe('applyPatch', () => {

      it('should return the result of the patch', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        // Create a patch
        let { patch } = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, values: [1, 2, 3] },
          metadata,
          version: 1,
          storeId: 1
        });
        // Reset the metadata
        metadata = field.createMetadata();
        // Apply the patch
        let patched = field.applyPatch({
          previous,
          metadata,
          patch
        });
        expect(patched.value).to.eql([1, 2, 3]);
        expect(patched.change[0]).to.eql({
          index: 0,
          removed: [],
          inserted: [1, 2, 3]
        });
      });

      it('should allow for out-of-order patches', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();

        let firstUpdate = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, values: [1, 8, 9, 4] },
          metadata,
          version: 1,
          storeId: 1
        });
        let secondUpdate = field.applyUpdate({
          previous: firstUpdate.value,
          update: { index: 1, remove: 2, values: [2, 3] },
          metadata,
          version: 2,
          storeId: 1
        });
        let thirdUpdate = field.applyUpdate({
          previous: secondUpdate.value,
          update: { index: 4, remove: 0, values: [5, 6, 7] },
          metadata,
          version: 3,
          storeId: 1
        });
        expect(thirdUpdate.value).to.eql([1, 2, 3, 4, 5, 6, 7]);

        // Now if we apply these patches on another client in 
        // a different order, they should give the same result.
        metadata = field.createMetadata();
        let firstPatch = field.applyPatch({
          previous,
          metadata,
          patch: thirdUpdate.patch
        });
        expect(firstPatch.change[0]).to.eql({
          index: 0,
          removed: [],
          inserted: [5, 6, 7]
        });
        let secondPatch = field.applyPatch({
          previous: firstPatch.value,
          metadata,
          patch: secondUpdate.patch
        });
        expect(secondPatch.change[0]).to.eql({
          index: 0,
          removed: [],
          inserted: [2, 3]
        });
        let thirdPatch = field.applyPatch({
          previous: secondPatch.value,
          metadata,
          patch: firstUpdate.patch
        });
        expect(thirdPatch.change[0]).to.eql({
          index: 2,
          removed: [],
          inserted: [4]
        });
        expect(thirdPatch.change[1]).to.eql({
          index: 0,
          removed: [],
          inserted: [1]
        });
        expect(thirdPatch.value).to.eql([1, 2, 3, 4, 5, 6, 7]);
      });

      it('should allow for racing patches', () => {
        let current = field.createValue();
        let metadata = field.createMetadata();
        let values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let patches: ListField.Patch<ListValue>[] = [];
        // Recreate the values array one update at a time,
        // capturing the patches.
        for (let i = 0, version = 0; i < values.length; i++) {
          let u1 = field.applyUpdate({
            previous: current,
            metadata,
            update: {
              index: i,
              remove: 0,
              values: [values[i], values[i], values[i]]
            },
            version: version,
            storeId: 1
          });
          version++;
          current = u1.value;
          patches.push(u1.patch);
          let u2 = field.applyUpdate({
            previous: current,
            metadata,
            update: {
              index: i+1,
              remove: 2,
              values: []
            },
            version: version,
            storeId: 1
          });
          version++;
          current = u2.value;
          patches.push(u2.patch);
        };
        expect(current).to.eql(values);
        // Shuffle the patches and apply them in a random order to
        // a new ListField. We try this multiple times to ensure we
        // don't accidentally get it right.
        for (let i = 0; i < 10; ++i) {
          let shuffled = shuffle(patches);
          current = field.createValue();
          metadata = field.createMetadata();
          shuffled.forEach(patch => {
            let { value } = field.applyPatch({
              previous: current,
              metadata,
              patch
            });
            current = value;
          });
          expect(current).to.eql(values);
        }
      });

      it('should handle concurrently deleted values', () => {
        let initial = field.createValue();
        let metadata = field.createMetadata();
        // First insert some values.
        let commonUpdate = field.applyUpdate({
          previous: initial,
          metadata,
          update: { index: 0, remove: 0, values: [1, 2, 3, 4] },
          version: 1,
          storeId: 1
        });
        // Two collaborators concurrently remove the same value.
        let metadataA = field.createMetadata();
        let patchA = field.applyPatch({
          previous: initial,
          metadata: metadataA,
          patch: commonUpdate.patch
        });
        let updateA = field.applyUpdate({
          previous: patchA.value,
          metadata: metadataA,
          update: { index: 1, remove: 2, values: [] },
          version: 2,
          storeId: 2
        });
        expect(updateA.value).to.eql([1, 4]);
        let metadataB = field.createMetadata();
        let patchB = field.applyPatch({
          previous: initial,
          metadata: metadataB,
          patch: commonUpdate.patch
        });
        let updateB = field.applyUpdate({
          previous: patchB.value,
          metadata: metadataB,
          update: { index: 0, remove: 2, values: [] },
          version: 2,
          storeId: 3
        });
        expect(updateB.value).to.eql([3, 4]);

        // Apply the A patch to the B collaborator
        let patchB2 = field.applyPatch({
          previous: updateB.value,
          metadata: metadataB,
          patch: updateA.patch
        });
        expect(patchB2.value).to.eql([4]);

        // Apply the B patch to the A collaborator
        let patchA2 = field.applyPatch({
          previous: updateA.value,
          metadata: metadataA,
          patch: updateB.patch
        });
        expect(patchA2.value).to.eql([4]);

        // Apply the patches to a third collaborator out-of-order.
        let metadataC = field.createMetadata();
        let patchC1 = field.applyPatch({
          previous: initial,
          metadata: metadataC,
          patch: updateB.patch
        });
        let patchC2 = field.applyPatch({
          previous: patchC1.value,
          metadata: metadataC,
          patch: updateA.patch
        });
        let patchC3 = field.applyPatch({
          previous: patchC2.value,
          metadata: metadataC,
          patch: commonUpdate.patch
        });

        // Check the final value.
        expect(patchC3.value).to.eql([4]);
      });

    });

    describe('unapplyPatch', () => {

      it('should remove a patch from the history', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        // Create a patch
        let updated1 = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, values: [1, 2, 3, 9] },
          metadata,
          version: 1,
          storeId: 1
        });
        let updated2 = field.applyUpdate({
          previous: updated1.value,
          update: { index: 3, remove: 1, values: [4, 5, 6] },
          metadata,
          version: 1,
          storeId: 1
        });
        expect(updated2.value).to.eql([1, 2, 3, 4, 5, 6]);
        // Reset the metadata and apply the patches
        metadata = field.createMetadata();
        let patched1 = field.applyPatch({
          previous,
          metadata,
          patch: updated1.patch
        });
        let patched2 = field.applyPatch({
          previous: patched1.value,
          metadata,
          patch: updated2.patch
        });
        expect(patched2.value).to.eql([1, 2, 3, 4, 5, 6]);
        // Unapply the patches out of order.
        let unpatched1 = field.unapplyPatch({
          previous: patched2.value,
          metadata,
          patch: updated1.patch
        });
        expect(unpatched1.value).to.eql([4, 5, 6]);
        expect(unpatched1.change[0]).to.eql({
          index: 0,
          removed: [1, 2, 3],
          inserted: []
        });
        let unpatched2 = field.unapplyPatch({
          previous: unpatched1.value,
          metadata,
          patch: updated2.patch
        });
        expect(unpatched2.value).to.eql([]);
        expect(unpatched2.change[0]).to.eql({
          index: 0,
          removed: [4, 5, 6],
          inserted: []
        });
      });

      it('should handle concurrently deleted text', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        // Create a patch
        let { patch } = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, values: [1, 2, 3] },
          metadata,
          version: 1,
          storeId: 1
        });
        // Reset the metadata and unnaply the patch before applying it.
        metadata = field.createMetadata();
        let unpatched = field.unapplyPatch({
          previous,
          metadata,
          patch
        });
        expect(unpatched.value).to.eql([]);
        expect(unpatched.change.length).to.equal(0);
        let patched = field.applyPatch({
          previous: unpatched.value,
          metadata,
          patch
        });
        expect(patched.value).to.eql([]);
        expect(patched.change.length).to.equal(0);
      });

    });


    describe('mergeChange', () => {

      it('should merge two successive changes', () => {
        let change1 = [
          {
            index: 0,
            removed: [],
            inserted: [0, 1]
          }
        ];
        let change2 = [
          {
            index: 1,
            removed: [1],
            inserted: [2, 3]
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
            removedValues: [],
            insertedIds: ['id-1', 'id-2'],
            insertedValues: [0, 1]
          }
        ];
        let patch2 = [
          {
            removedIds: ['id-1'],
            removedValues: [0],
            insertedIds: ['id-3', 'id-4'],
            insertedValues: [2, 3]
          }
        ];
        let result = field.mergePatch(patch1, patch2);
        expect(result).to.eql([...patch1, ...patch2]);
      });

    });

  });

});
