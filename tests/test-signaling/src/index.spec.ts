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
  Signal
} from '@phosphor/signaling';


class TestObject {

  readonly one = new Signal<this, void>(this);

  readonly two = new Signal<this, number>(this);

  readonly three = new Signal<this, string[]>(this);
}


class ExtendedObject extends TestObject {

  notifyCount = 0;

  onNotify(): void {
    this.notifyCount++;
  }
}


class TestHandler {

  name = '';

  oneCount = 0;

  twoValue = 0;

  twoSender: TestObject | null = null;

  onOne(): void {
    this.oneCount++;
  }

  onTwo(sender: TestObject, args: number): void {
    this.twoSender = sender;
    this.twoValue = args;
  }

  onThree(sender: TestObject, args: string[]): void {
    args.push(this.name);
  }

  onThrow(): void {
    throw new Error();
  }
}


describe('@phosphor/signaling', () => {

  describe('Signal', () => {

    describe('#sender', () => {

      it('should be the sender of the signal', () => {
        let obj = new TestObject();
        expect(obj.one.sender).to.equal(obj);
        expect(obj.two.sender).to.equal(obj);
        expect(obj.three.sender).to.equal(obj);
      });

    });

    describe('#connect()', () => {

      it('should return true on success', () => {
        let obj = new TestObject();
        let handler = new TestHandler();
        let c1 = obj.one.connect(handler.onOne, handler);
        expect(c1).to.equal(true);
      });

      it('should return false on failure', () => {
        let obj = new TestObject();
        let handler = new TestHandler();
        let c1 = obj.one.connect(handler.onOne, handler);
        let c2 = obj.one.connect(handler.onOne, handler);
        expect(c1).to.equal(true);
        expect(c2).to.equal(false);
      });

      it('should connect plain functions', () => {
        let obj = new TestObject();
        let handler = new TestHandler();
        let c1 = obj.one.connect(handler.onThrow);
        expect(c1).to.equal(true);
      });

      it('should ignore duplicate connections', () => {
        let obj = new TestObject();
        let handler = new TestHandler();
        let c1 = obj.one.connect(handler.onOne, handler);
        let c2 = obj.one.connect(handler.onOne, handler);
        let c3 = obj.two.connect(handler.onTwo, handler);
        let c4 = obj.two.connect(handler.onTwo, handler);
        obj.one.emit(undefined);
        obj.two.emit(42);
        expect(c1).to.equal(true);
        expect(c2).to.equal(false);
        expect(c3).to.equal(true);
        expect(c4).to.equal(false);
        expect(handler.oneCount).to.equal(1);
        expect(handler.twoValue).to.equal(42);
      });

    });

    describe('#disconnect()', () => {

      it('should return true on success', () => {
        let obj = new TestObject();
        let handler = new TestHandler();
        obj.one.connect(handler.onOne, handler);
        let d1 = obj.one.disconnect(handler.onOne, handler);
        expect(d1).to.equal(true);
      });

      it('should return false on failure', () => {
        let obj = new TestObject();
        let handler = new TestHandler();
        let d1 = obj.one.disconnect(handler.onOne, handler);
        expect(d1).to.equal(false);
      });

      it('should disconnect plain functions', () => {
        let obj = new TestObject();
        let handler = new TestHandler();
        obj.one.connect(handler.onThrow);
        expect(obj.one.disconnect(handler.onThrow)).to.equal(true);
        expect(() => obj.one.emit(undefined)).to.not.throw(Error);
      });

      it('should disconnect a specific signal', () => {
        let obj1 = new TestObject();
        let obj2 = new TestObject();
        let obj3 = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        let handler3 = new TestHandler();
        obj1.one.connect(handler1.onOne, handler1);
        obj2.one.connect(handler2.onOne, handler2);
        obj1.one.connect(handler3.onOne, handler3);
        obj2.one.connect(handler3.onOne, handler3);
        obj3.one.connect(handler3.onOne, handler3);
        let d1 = obj1.one.disconnect(handler1.onOne, handler1);
        let d2 = obj1.one.disconnect(handler1.onOne, handler1);
        let d3 = obj2.one.disconnect(handler3.onOne, handler3);
        obj1.one.emit(undefined);
        obj2.one.emit(undefined);
        obj3.one.emit(undefined);
        expect(d1).to.equal(true);
        expect(d2).to.equal(false);
        expect(d3).to.equal(true);
        expect(handler1.oneCount).to.equal(0);
        expect(handler2.oneCount).to.equal(1);
        expect(handler3.oneCount).to.equal(2);
      });

    });

    describe('#emit()', () => {

      it('should be a no-op if there are no connection', () => {
        let obj = new TestObject();
        expect(() => { obj.one.emit(undefined); }).to.not.throw(Error);
      });

      it('should pass the sender and args to the handlers', () => {
        let obj = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        obj.two.connect(handler1.onTwo, handler1);
        obj.two.connect(handler2.onTwo, handler2);
        obj.two.emit(15);
        expect(handler1.twoSender).to.equal(obj);
        expect(handler2.twoSender).to.equal(obj);
        expect(handler1.twoValue).to.equal(15);
        expect(handler2.twoValue).to.equal(15);
      });

      it('should invoke handlers in connection order', () => {
        let obj = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        let handler3 = new TestHandler();
        handler1.name = 'foo';
        handler2.name = 'bar';
        handler3.name = 'baz';
        obj.three.connect(handler1.onThree, handler1);
        obj.one.connect(handler1.onOne, handler1);
        obj.three.connect(handler2.onThree, handler2);
        obj.three.connect(handler3.onThree, handler3);
        let names: string[] = [];
        obj.three.emit(names);
        obj.one.emit(undefined);
        expect(names).to.deep.equal(['foo', 'bar', 'baz']);
        expect(handler1.oneCount).to.equal(1);
        expect(handler2.oneCount).to.equal(0);
      });

      it('should catch any exceptions in handlers', () => {
        let obj = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        let handler3 = new TestHandler();
        handler1.name = 'foo';
        handler2.name = 'bar';
        handler3.name = 'baz';
        obj.three.connect(handler1.onThree, handler1);
        obj.three.connect(handler2.onThrow, handler2);
        obj.three.connect(handler3.onThree, handler3);
        let threw = false;
        let names1: string[] = [];
        try {
          obj.three.emit(names1);
        } catch (e) {
          threw = true;
        }
        expect(threw).to.equal(false);
        expect(names1).to.deep.equal(['foo', 'baz']);
      });

      it('should not invoke signals added during emission', () =>  {
        let obj = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        let handler3 = new TestHandler();
        handler1.name = 'foo';
        handler2.name = 'bar';
        handler3.name = 'baz';
        let adder = {
          add: () => {
            obj.three.connect(handler3.onThree, handler3);
          },
        };
        obj.three.connect(handler1.onThree, handler1);
        obj.three.connect(handler2.onThree, handler2);
        obj.three.connect(adder.add, adder);
        let names1: string[] = [];
        obj.three.emit(names1);
        obj.three.disconnect(adder.add, adder);
        let names2: string[] = [];
        obj.three.emit(names2);
        expect(names1).to.deep.equal(['foo', 'bar']);
        expect(names2).to.deep.equal(['foo', 'bar', 'baz']);
      });

      it('should not invoke signals removed during emission', () => {
        let obj = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        let handler3 = new TestHandler();
        handler1.name = 'foo';
        handler2.name = 'bar';
        handler3.name = 'baz';
        let remover = {
          remove: () => {
            obj.three.disconnect(handler3.onThree, handler3);
          },
        };
        obj.three.connect(handler1.onThree, handler1);
        obj.three.connect(handler2.onThree, handler2);
        obj.three.connect(remover.remove, remover);
        obj.three.connect(handler3.onThree, handler3);
        let names: string[] = [];
        obj.three.emit(names);
        expect(names).to.deep.equal(['foo', 'bar']);
      });

    });

    describe('.disconnectSender()', () => {

      it('should disconnect all signals from a specific sender', () => {
        let obj1 = new TestObject();
        let obj2 = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        obj1.one.connect(handler1.onOne, handler1);
        obj1.one.connect(handler2.onOne, handler2);
        obj2.one.connect(handler1.onOne, handler1);
        obj2.one.connect(handler2.onOne, handler2);
        Signal.disconnectSender(obj1);
        obj1.one.emit(undefined);
        obj2.one.emit(undefined);
        expect(handler1.oneCount).to.equal(1);
        expect(handler2.oneCount).to.equal(1);
      });

      it('should be a no-op if the sender is not connected', () => {
        expect(() => Signal.disconnectSender({})).to.not.throw(Error);
      });

    });

    describe('.disconnectReceiver()', () => {

      it('should disconnect all signals from a specific receiver', () => {
        let obj1 = new TestObject();
        let obj2 = new TestObject();
        let handler1 = new TestHandler();
        let handler2 = new TestHandler();
        obj1.one.connect(handler1.onOne, handler1);
        obj1.one.connect(handler2.onOne, handler2);
        obj2.one.connect(handler1.onOne, handler1);
        obj2.one.connect(handler2.onOne, handler2);
        obj2.two.connect(handler1.onTwo, handler1);
        obj2.two.connect(handler2.onTwo, handler2);
        Signal.disconnectReceiver(handler1);
        obj1.one.emit(undefined);
        obj2.one.emit(undefined);
        obj2.two.emit(42);
        expect(handler1.oneCount).to.equal(0);
        expect(handler2.oneCount).to.equal(2);
        expect(handler1.twoValue).to.equal(0);
        expect(handler2.twoValue).to.equal(42);
      });

      it('should be a no-op if the receiver is not connected', () => {
        expect(() => Signal.disconnectReceiver({})).to.not.throw(Error);
      });

    });

    describe('.clearData()', () => {

      it('should clear all signal data associated with an object', () => {
        let counter = 0;
        let onCount = () => { counter++ };
        let ext1 = new ExtendedObject();
        let ext2 = new ExtendedObject();
        ext1.one.connect(ext1.onNotify, ext1);
        ext1.one.connect(ext2.onNotify, ext2);
        ext1.one.connect(onCount);
        ext2.one.connect(ext1.onNotify, ext1);
        ext2.one.connect(ext2.onNotify, ext2);
        ext2.one.connect(onCount);
        Signal.clearData(ext1);
        ext1.one.emit(undefined);
        ext2.one.emit(undefined);
        expect(ext1.notifyCount).to.equal(0);
        expect(ext2.notifyCount).to.equal(1);
        expect(counter).to.equal(1);
      });

    });

  });

  context('https://github.com/phosphorjs/phosphor-signaling/issues/5', () => {

    it('should handle connect after disconnect and emit', () => {
      let obj = new TestObject();
      let handler = new TestHandler();
      let c1 = obj.one.connect(handler.onOne, handler);
      expect(c1).to.equal(true);
      obj.one.disconnect(handler.onOne, handler);
      obj.one.emit(undefined);
      let c2 = obj.one.connect(handler.onOne, handler);
      expect(c2).to.equal(true);
    });

  });

  context('https://github.com/phosphorjs/phosphor-signaling/issues/8', () => {

    it('should handle disconnecting sender after receiver', () => {
      let obj = new TestObject();
      let handler = new TestHandler();
      obj.one.connect(handler.onOne, handler);
      Signal.disconnectReceiver(handler);
      Signal.disconnectSender(obj);
      obj.one.emit(undefined);
      expect(handler.oneCount).to.equal(0);
    });

    it('should handle disconnecting receiver after sender', () => {
      let obj = new TestObject();
      let handler = new TestHandler();
      obj.one.connect(handler.onOne, handler);
      Signal.disconnectSender(obj);
      Signal.disconnectReceiver(handler);
      obj.one.emit(undefined);
      expect(handler.oneCount).to.equal(0);
    });

  });

});
