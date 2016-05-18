/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  DisposableDelegate, DisposableSet, IDisposable
} from '../../../lib/core/disposable';


class TestDisposable implements IDisposable {

  count = 0;

  get isDisposed(): boolean {
    return this.count > 0;
  }

  dispose(): void {
    this.count++;
  }
}


describe('core/disposable', () => {

  describe('DisposableDelegate', () => {

    describe('#constructor()', () => {

      it('should accept a callback', () => {
        let delegate = new DisposableDelegate(() => { });
        expect(delegate instanceof DisposableDelegate).to.be(true);
      });

    });

    describe('#isDisposed', () => {

      it('should be `false` before object is disposed', () => {
        let delegate = new DisposableDelegate(() => { });
        expect(delegate.isDisposed).to.be(false);
      });

      it('should be `true` after object is disposed', () => {
        let delegate = new DisposableDelegate(() => { });
        delegate.dispose();
        expect(delegate.isDisposed).to.be(true);
      });

      it('should be read-only', () => {
        let delegate = new DisposableDelegate(() => { });
        expect(() => delegate.isDisposed = true).to.throwException();
      });

    });

    describe('#dispose()', () => {

      it('should invoke a callback when disposed', () => {
        let called = false;
        let delegate = new DisposableDelegate(() => called = true);
        expect(called).to.be(false);
        delegate.dispose();
        expect(called).to.be(true);
      });

      it('should ignore multiple calls to `dispose`', () => {
        let count = 0;
        let delegate = new DisposableDelegate(() => count++);
        expect(count).to.be(0);
        delegate.dispose();
        delegate.dispose();
        delegate.dispose();
        expect(count).to.be(1);
      });

    });

  });

  describe('DisposableSet', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let set = new DisposableSet();
        expect(set instanceof DisposableSet).to.be(true);
      });

      it('should accept an iterable of disposable items', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = new DisposableSet([item1, item2, item3]);
        expect(set instanceof DisposableSet).to.be(true);
      });

    });

    describe('#isDisposed', () => {

      it('should be `false` before object is disposed', () => {
        let set = new DisposableSet();
        expect(set.isDisposed).to.be(false);
      });

      it('should be `true` after object is disposed', () => {
        let set = new DisposableSet();
        set.dispose();
        expect(set.isDisposed).to.be(true);
      });

      it('should be read-only', () => {
        let set = new DisposableSet();
        expect(() => set.isDisposed = true).to.throwException();
      });

    });

    describe('#dispose()', () => {

      it('should dispose all items in the set', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = new DisposableSet([item1, item2, item3]);
        expect(item1.count).to.be(0);
        expect(item2.count).to.be(0);
        expect(item3.count).to.be(0);
        set.dispose();
        expect(item1.count).to.be(1);
        expect(item2.count).to.be(1);
        expect(item3.count).to.be(1);
      });

      it('should dipose items in the order they were added', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = new DisposableSet([item1, item2, item3]);
        expect(values).to.eql([]);
        set.dispose();
        expect(values).to.eql([0, 1, 2]);
      });

      it('should ignore multiple calls to `dispose`', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = new DisposableSet([item1, item2, item3]);
        expect(item1.count).to.be(0);
        expect(item2.count).to.be(0);
        expect(item3.count).to.be(0);
        set.dispose();
        set.dispose();
        set.dispose();
        expect(item1.count).to.be(1);
        expect(item2.count).to.be(1);
        expect(item3.count).to.be(1);
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
        expect(item1.count).to.be(0);
        expect(item2.count).to.be(0);
        expect(item3.count).to.be(0);
        set.dispose();
        expect(item1.count).to.be(1);
        expect(item2.count).to.be(1);
        expect(item3.count).to.be(1);
      });

      it('should maintain insertion order', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = new DisposableSet([item1]);
        set.add(item2);
        set.add(item3);
        expect(values).to.eql([]);
        set.dispose();
        expect(values).to.eql([0, 1, 2]);
      });

      it('should ignore duplicate items', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = new DisposableSet([item1]);
        set.add(item2);
        set.add(item3);
        set.add(item3);
        set.add(item2);
        set.add(item1);
        expect(values).to.eql([]);
        set.dispose();
        expect(values).to.eql([0, 1, 2]);
      });

      it('should throw if the set is disposed', () => {
        let item = new TestDisposable();
        let set = new DisposableSet();
        set.dispose();
        expect(() => set.add(item)).to.throwException();
      });

    });

    describe('#remove()', () => {

      it('should remove items from the set', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = new DisposableSet([item1, item2, item3]);
        expect(item1.count).to.be(0);
        expect(item2.count).to.be(0);
        expect(item3.count).to.be(0);
        set.remove(item2);
        set.dispose();
        expect(item1.count).to.be(1);
        expect(item2.count).to.be(0);
        expect(item3.count).to.be(1);
      });

      it('should maintain insertion order', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = new DisposableSet([item1, item2, item3]);
        expect(values).to.eql([]);
        set.remove(item1);
        set.dispose();
        expect(values).to.eql([1, 2]);
      });

      it('should ignore missing items', () => {
        let values: number[] = [];
        let item1 = new DisposableDelegate(() => values.push(0));
        let item2 = new DisposableDelegate(() => values.push(1));
        let item3 = new DisposableDelegate(() => values.push(2));
        let set = new DisposableSet([item1, item2]);
        expect(values).to.eql([]);
        set.remove(item3);
        set.dispose();
        expect(values).to.eql([0, 1]);
      });

      it('should throw if the set is disposed', () => {
        let item = new TestDisposable();
        let set = new DisposableSet();
        set.dispose();
        expect(() => set.remove(item)).to.throwException();
      });

    });

    describe('#clear()', () => {

      it('remove all items from the set', () => {
        let item1 = new TestDisposable();
        let item2 = new TestDisposable();
        let item3 = new TestDisposable();
        let set = new DisposableSet([item1, item2, item3]);
        expect(item1.count).to.be(0);
        expect(item2.count).to.be(0);
        expect(item3.count).to.be(0);
        set.clear();
        set.dispose();
        expect(item1.count).to.be(0);
        expect(item2.count).to.be(0);
        expect(item3.count).to.be(0);
      });

      it('should throw if the set is disposed', () => {
        let set = new DisposableSet();
        set.dispose();
        expect(() => set.clear()).to.throwException();
      });

    });

  });

});
