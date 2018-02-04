/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  AttachedProperty
} from '@phosphor/properties';


class Model {
  dummyValue = 42;
}


describe('@phosphor/properties', () => {

  describe('AttachedProperty', () => {

    describe('#constructor()', () => {

      it('should accept a single options argument', () => {
        let p = new AttachedProperty<Model, number>({
          name: 'p',
          create: (owner) => 42,
          coerce: (owner, value) => Math.max(0, value),
          compare: (oldValue, newValue) => oldValue === newValue,
          changed: (owner, oldValue, newValue) => { }
        });
        expect(p).to.be.an.instanceof(AttachedProperty);
      });

    });

    describe('#name', () => {

      it('should be the name provided to the constructor', () => {
        let create = () => 0;
        let p = new AttachedProperty<Model, number>({ name: 'p', create });
        expect(p.name).to.equal('p');
      });

    });

    describe('#get()', () => {

      it('should return the current value of the property', () => {
        let tick = 42;
        let create = () => tick++;
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create });
        let p3 = new AttachedProperty<Model, number>({ name: 'p3', create });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        expect(p1.get(m1)).to.equal(42);
        expect(p2.get(m1)).to.equal(43);
        expect(p3.get(m1)).to.equal(44);
        expect(p1.get(m2)).to.equal(45);
        expect(p2.get(m2)).to.equal(46);
        expect(p3.get(m2)).to.equal(47);
        expect(p1.get(m3)).to.equal(48);
        expect(p2.get(m3)).to.equal(49);
        expect(p3.get(m3)).to.equal(50);
      });

      it('should not invoke the coerce function', () => {
        let called = false;
        let create = () => 0;
        let coerce = (m: Model, v: number) => (called = true,  v);
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create, coerce });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create, coerce });
        let p3 = new AttachedProperty<Model, number>({ name: 'p3', create, coerce });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        p1.get(m1);
        p2.get(m1);
        p3.get(m1);
        p1.get(m2);
        p2.get(m2);
        p3.get(m2);
        p1.get(m3);
        p2.get(m3);
        p3.get(m3);
        expect(called).to.equal(false);
      });

      it('should not invoke the compare function', () => {
        let called = false;
        let create = () => 0;
        let compare = (v1: number, v2: number) => (called = true,  v1 === v2);
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create, compare });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create, compare });
        let p3 = new AttachedProperty<Model, number>({ name: 'p3', create, compare });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        p1.get(m1);
        p2.get(m1);
        p3.get(m1);
        p1.get(m2);
        p2.get(m2);
        p3.get(m2);
        p1.get(m3);
        p2.get(m3);
        p3.get(m3);
        expect(called).to.equal(false);
      });

      it('should not invoke the changed function', () => {
        let called = false;
        let create = () => 0;
        let changed = () => { called = true; };
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create, changed });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create, changed });
        let p3 = new AttachedProperty<Model, number>({ name: 'p3', create, changed });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        p1.get(m1);
        p2.get(m1);
        p3.get(m1);
        p1.get(m2);
        p2.get(m2);
        p3.get(m2);
        p1.get(m3);
        p2.get(m3);
        p3.get(m3);
        expect(called).to.equal(false);
      });

    });

    describe('#set()', () => {

      it('should set the current value of the property', () => {
        let create = () => 0;
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create });
        let p3 = new AttachedProperty<Model, number>({ name: 'p3', create });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(p1.get(m1)).to.equal(1);
        expect(p1.get(m2)).to.equal(2);
        expect(p1.get(m3)).to.equal(3);
        expect(p2.get(m1)).to.equal(4);
        expect(p2.get(m2)).to.equal(5);
        expect(p2.get(m3)).to.equal(6);
        expect(p3.get(m1)).to.equal(7);
        expect(p3.get(m2)).to.equal(8);
        expect(p3.get(m3)).to.equal(9);
      });

      it('should invoke the changed function if the value changes', () => {
        let oldvals: number[] = [];
        let newvals: number[] = [];
        let changed = (m: Model, o: number, n: number) => {
          oldvals.push(o);
          newvals.push(n);
        };
        let create = () => 0;
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create, changed });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create, changed });
        let p3 = new AttachedProperty<Model, number>({ name: 'p3', create, changed });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(oldvals).to.deep.equal([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(newvals).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should invoke the coerce function on the new value', () => {
        let create = () => 0;
        let coerce = (o: Model, v: number) => Math.max(0, v);
        let p = new AttachedProperty<Model, number>({ name: 'p', create, coerce });
        let m = new Model();
        p.set(m, -10);
        expect(p.get(m)).to.equal(0);
        p.set(m, 10);
        expect(p.get(m)).to.equal(10);
        p.set(m, -42);
        expect(p.get(m)).to.equal(0);
        p.set(m, 42);
        expect(p.get(m)).to.equal(42);
        p.set(m, 0);
        expect(p.get(m)).to.equal(0);
      });

      it('should not invoke the compare function if there is no changed function', () => {
        let called = false;
        let create = () => 0;
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new AttachedProperty<Model, number>({ name: 'p', create, compare });
        let m = new Model();
        p.set(m, 42);
        expect(called).to.equal(false);
      });

      it('should invoke the compare function if there is a changed function', () => {
        let called = false;
        let create = () => 0;
        let changed = () => { };
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new AttachedProperty<Model, number>({ name: 'p', create, compare, changed });
        let m = new Model();
        p.set(m, 42);
        expect(called).to.equal(true);
      });

      it('should not invoke the changed function if the value does not change', () => {
        let called = false;
        let create = () => 1;
        let changed = () => { called = true; };
        let compare = (v1: number, v2: number) => true;
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create, changed });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create, compare, changed });
        let m = new Model();
        p1.set(m, 1);
        p1.set(m, 1);
        p2.set(m, 1);
        p2.set(m, 2);
        p2.set(m, 3);
        p2.set(m, 4);
        expect(called).to.equal(false);
      });

    });

    describe('#coerce()', () => {

      it('should coerce the current value of the property', () => {
        let min = 20;
        let max = 50;
        let create = () => 0;
        let coerce = (m: Model, v: number) => Math.max(min, Math.min(v, max));
        let p = new AttachedProperty<Model, number>({ name: 'p', create, coerce });
        let m = new Model();
        p.set(m, 10);
        expect(p.get(m)).to.equal(20);
        min = 30;
        p.coerce(m);
        expect(p.get(m)).to.equal(30);
        min = 10;
        max = 20;
        p.coerce(m);
        expect(p.get(m)).to.equal(20);
      });

      it('should invoke the changed function if the value changes', () => {
        let called = false;
        let create = () => 0;
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let changed = () => { called = true };
        let p = new AttachedProperty<Model, number>({ name: 'p', create, coerce, changed });
        let m = new Model();
        p.coerce(m);
        expect(called).to.equal(true);
      });

      it('should use the default value as old value if value is not yet set', () => {
        let oldval = -1;
        let newval = -1;
        let create = () => 0;
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let changed = (m: Model, o: number, n: number) => { oldval = o; newval = n; };
        let p = new AttachedProperty<Model, number>({ name: 'p', create, coerce, changed });
        let m = new Model();
        p.coerce(m);
        expect(oldval).to.equal(0);
        expect(newval).to.equal(20);
      });

      it('should not invoke the compare function if there is no changed function', () => {
        let called = false;
        let create = () => 0;
        let compare = (v1: number, v2: number) => (called = true,  v1 === v2);
        let p = new AttachedProperty<Model, number>({ name: 'p', create, compare });
        let m = new Model();
        p.coerce(m);
        expect(called).to.equal(false);
      });

      it('should invoke the compare function if there is a changed function', () => {
        let called = false;
        let create = () => 0;
        let changed = () => { };
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new AttachedProperty<Model, number>({ name: 'p', create, compare, changed });
        let m = new Model();
        p.coerce(m);
        expect(called).to.equal(true);
      });

      it('should not invoke the changed function if the value does not change', () => {
        let called = false;
        let create = () => 0;
        let changed = () => { called = true; };
        let p = new AttachedProperty<Model, number>({ name: 'p', create, changed });
        let m = new Model();
        p.coerce(m);
        expect(called).to.equal(false);
      });

    });

    describe('.clearData()', () => {

      it('should clear all property data for a property owner', () => {
        let create = () => 42;
        let p1 = new AttachedProperty<Model, number>({ name: 'p1', create });
        let p2 = new AttachedProperty<Model, number>({ name: 'p2', create });
        let p3 = new AttachedProperty<Model, number>({ name: 'p3', create });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(p1.get(m1)).to.equal(1);
        expect(p1.get(m2)).to.equal(2);
        expect(p1.get(m3)).to.equal(3);
        expect(p2.get(m1)).to.equal(4);
        expect(p2.get(m2)).to.equal(5);
        expect(p2.get(m3)).to.equal(6);
        expect(p3.get(m1)).to.equal(7);
        expect(p3.get(m2)).to.equal(8);
        expect(p3.get(m3)).to.equal(9);
        AttachedProperty.clearData(m1);
        expect(p1.get(m1)).to.equal(42);
        expect(p1.get(m2)).to.equal(2);
        expect(p1.get(m3)).to.equal(3);
        expect(p2.get(m1)).to.equal(42);
        expect(p2.get(m2)).to.equal(5);
        expect(p2.get(m3)).to.equal(6);
        expect(p3.get(m1)).to.equal(42);
        expect(p3.get(m2)).to.equal(8);
        expect(p3.get(m3)).to.equal(9);
        AttachedProperty.clearData(m2);
        expect(p1.get(m1)).to.equal(42);
        expect(p1.get(m2)).to.equal(42);
        expect(p1.get(m3)).to.equal(3);
        expect(p2.get(m1)).to.equal(42);
        expect(p2.get(m2)).to.equal(42);
        expect(p2.get(m3)).to.equal(6);
        expect(p3.get(m1)).to.equal(42);
        expect(p3.get(m2)).to.equal(42);
        expect(p3.get(m3)).to.equal(9);
        AttachedProperty.clearData(m3);
        expect(p1.get(m1)).to.equal(42);
        expect(p1.get(m2)).to.equal(42);
        expect(p1.get(m3)).to.equal(42);
        expect(p2.get(m1)).to.equal(42);
        expect(p2.get(m2)).to.equal(42);
        expect(p2.get(m3)).to.equal(42);
        expect(p3.get(m1)).to.equal(42);
        expect(p3.get(m2)).to.equal(42);
        expect(p3.get(m3)).to.equal(42);
      });

    });

  });

});
