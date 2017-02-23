/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  DisposableDelegate, DisposableSet, IDisposable
} from '@phosphor/disposable';


class TestDisposable implements IDisposable {

  count = 0;

  get isDisposed(): boolean {
    return this.count > 0;
  }

  dispose(): void {
    this.count++;
  }
}


describe('@phosphor/disposable', () => {

  describe('DisposableDelegate', () => {

    describe('#constructor()', () => {

      it('should accept a callback', () => {
        let delegate = new DisposableDelegate(() => { });
        expect(delegate).to.be.an.instanceof(DisposableDelegate);
      });

    });

    describe('#isDisposed', () => {

      it('should be `false` before object is disposed', () => {
        let delegate = new DisposableDelegate(() => { });
        expect(delegate.isDisposed).to.equal(false);
      });

      it('should be `true` after object is disposed', () => {
        let delegate = new DisposableDelegate(() => { });
        delegate.dispose();
        expect(delegate.isDisposed).to.equal(true);
      });

    });

    describe('#dispose()', () => {

      it('should invoke a callback when disposed', () => {
        let called = false;
        let delegate = new DisposableDelegate(() => called = true);
        expect(called).to.equal(false);
        delegate.dispose();
        expect(called).to.equal(true);
      });

      it('should ignore multiple calls to `dispose`', () => {
        let count = 0;
        let delegate = new DisposableDelegate(() => count++);
        expect(count).to.equal(0);
        delegate.dispose();
        delegate.dispose();
        delegate.dispose();
        expect(count).to.equal(1);
      });

    });

  });

  describe('DisposableSet', () => {

    describe('.from()', () => {

      it('should accept an iterable of disposable items', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = DisposableSet.from([item1, item2, item3]);
        expect(set).to.be.an.instanceof(DisposableSet);
      });

    });

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let set = new DisposableSet();
        expect(set).to.be.an.instanceof(DisposableSet);
      });

    });

    describe('#isDisposed', () => {

      it('should be `false` before object is disposed', () => {
        let set = new DisposableSet();
        expect(set.isDisposed).to.equal(false);
      });

      it('should be `true` after object is disposed', () => {
        let set = new DisposableSet();
        set.dispose();
        expect(set.isDisposed).to.equal(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose all items in the set', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = DisposableSet.from([item1, item2, item3]);
        expect(item1.count).to.equal(0);
        expect(item2.count).to.equal(0);
        expect(item3.count).to.equal(0);
        set.dispose();
        expect(item1.count).to.equal(1);
        expect(item2.count).to.equal(1);
        expect(item3.count).to.equal(1);
      });

      it('should dipose items in the order they were added', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = DisposableSet.from([item1, item2, item3]);
        expect(values).to.deep.equal([]);
        set.dispose();
        expect(values).to.deep.equal([0, 1, 2]);
      });

      it('should ignore multiple calls to `dispose`', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = DisposableSet.from([item1, item2, item3]);
        expect(item1.count).to.equal(0);
        expect(item2.count).to.equal(0);
        expect(item3.count).to.equal(0);
        set.dispose();
        set.dispose();
        set.dispose();
        expect(item1.count).to.equal(1);
        expect(item2.count).to.equal(1);
        expect(item3.count).to.equal(1);
      });

    });

    describe('#add()', () => {

      it('should add items to the set', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = new DisposableSet();
        set.add(item1);
        set.add(item2);
        set.add(item3);
        expect(item1.count).to.equal(0);
        expect(item2.count).to.equal(0);
        expect(item3.count).to.equal(0);
        set.dispose();
        expect(item1.count).to.equal(1);
        expect(item2.count).to.equal(1);
        expect(item3.count).to.equal(1);
      });

      it('should maintain insertion order', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = DisposableSet.from([item1]);
        set.add(item2);
        set.add(item3);
        expect(values).to.deep.equal([]);
        set.dispose();
        expect(values).to.deep.equal([0, 1, 2]);
      });

      it('should ignore duplicate items', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = DisposableSet.from([item1]);
        set.add(item2);
        set.add(item3);
        set.add(item3);
        set.add(item2);
        set.add(item1);
        expect(values).to.deep.equal([]);
        set.dispose();
        expect(values).to.deep.equal([0, 1, 2]);
      });

    });

    describe('#remove()', () => {

      it('should remove items from the set', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = DisposableSet.from([item1, item2, item3]);
        expect(item1.count).to.equal(0);
        expect(item2.count).to.equal(0);
        expect(item3.count).to.equal(0);
        set.remove(item2);
        set.dispose();
        expect(item1.count).to.equal(1);
        expect(item2.count).to.equal(0);
        expect(item3.count).to.equal(1);
      });

      it('should maintain insertion order', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = DisposableSet.from([item1, item2, item3]);
        expect(values).to.deep.equal([]);
        set.remove(item1);
        set.dispose();
        expect(values).to.deep.equal([1, 2]);
      });

      it('should ignore missing items', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = DisposableSet.from([item1, item2]);
        expect(values).to.deep.equal([]);
        set.remove(item3);
        set.dispose();
        expect(values).to.deep.equal([0, 1]);
      });

    });

    describe('#clear()', () => {

      it('remove all items from the set', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = DisposableSet.from([item1, item2, item3]);
        expect(item1.count).to.equal(0);
        expect(item2.count).to.equal(0);
        expect(item3.count).to.equal(0);
        set.clear();
        set.dispose();
        expect(item1.count).to.equal(0);
        expect(item2.count).to.equal(0);
        expect(item3.count).to.equal(0);
      });

    });

  });

});
