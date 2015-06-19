/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module tests {

import Signal = phosphor.core.Signal;
import connect = phosphor.core.connect;
import disconnect = phosphor.core.disconnect;
import emit = phosphor.core.emit;


class TestObject {

  static one = new Signal<TestObject, void>();

  static two = new Signal<TestObject, boolean>();

  static three = new Signal<TestObject, string[]>();
}


class TestHandler {

  name = '';

  oneCount = 0;

  twoValue = false;

  onOne(sender: TestObject): void {
    this.oneCount++;
  }

  onTwo(sender: TestObject, args: boolean): void {
    this.twoValue = args;
  }

  onThree(sender: TestObject, args: string[]): void {
    args.push(this.name);
  }

  onThrow(sender: TestObject): void {
    throw new Error();
  }
}


describe('phosphor.core - signaling', () => {

  describe('connect()', () => {

    it('should return true on success', () => {
      var obj = new TestObject();
      var handler = new TestHandler();
      var c1 = connect(obj, TestObject.one, handler, handler.onOne);
      expect(c1).to.be(true);
    });

    it('should return false on failure', () => {
      var obj = new TestObject();
      var handler = new TestHandler();
      var c1 = connect(obj, TestObject.one, handler, handler.onOne);
      var c2 = connect(obj, TestObject.one, handler, handler.onOne);
      expect(c1).to.be(true);
      expect(c2).to.be(false);
    });

    it('should ignore null arguments', () => {
      var obj = new TestObject();
      var handler = new TestHandler();
      var c1 = connect(null, TestObject.one, handler, handler.onOne);
      var c2 = connect(obj, null, handler, handler.onOne);
      var c3 = connect(obj, TestObject.one, null, handler.onOne);
      var c4 = connect(obj, TestObject.one, handler, null);
      emit(obj, TestObject.one, void 0);
      expect(c1).to.be(false);
      expect(c2).to.be(false);
      expect(c3).to.be(false);
      expect(c4).to.be(false);
      expect(handler.oneCount).to.be(0);
    });

    it('should ignore duplicate connections', () => {
      var obj = new TestObject();
      var handler = new TestHandler();
      var c1 = connect(obj, TestObject.one, handler, handler.onOne);
      var c2 = connect(obj, TestObject.one, handler, handler.onOne);
      var c3 = connect(obj, TestObject.two, handler, handler.onTwo);
      var c4 = connect(obj, TestObject.two, handler, handler.onTwo);
      emit(obj, TestObject.one, void 0);
      emit(obj, TestObject.two, true);
      expect(c1).to.be(true);
      expect(c2).to.be(false);
      expect(c3).to.be(true);
      expect(c4).to.be(false);
      expect(handler.oneCount).to.be(1);
      expect(handler.twoValue).to.be(true);
    });

  });


  describe('disconnect()', () => {

    it('should return true on success', () => {
      var obj = new TestObject();
      var handler = new TestHandler();
      connect(obj, TestObject.one, handler, handler.onOne);
      var d1 = disconnect(obj, TestObject.one, handler, handler.onOne);
      expect(d1).to.be(true);
    });

    it('should return false on failure', () => {
      var obj = new TestObject();
      var handler = new TestHandler();
      var d1 = disconnect(obj, TestObject.one, handler, handler.onOne);
      expect(d1).to.be(false);
    });

    it('should disconnect a specific signal', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      connect(obj1, TestObject.one, handler1, handler1.onOne);
      connect(obj2, TestObject.one, handler2, handler2.onOne);
      var d1 = disconnect(obj1, TestObject.one, handler1, handler1.onOne);
      var d2 = disconnect(obj1, TestObject.one, handler1, handler1.onOne);
      emit(obj1, TestObject.one, void 0);
      emit(obj2, TestObject.one, void 0);
      expect(d1).to.be(true);
      expect(d2).to.be(false);
      expect(handler1.oneCount).to.be(0);
      expect(handler2.oneCount).to.be(1);
    });

    it('should disconnect all receivers from a specific sender', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      connect(obj1, TestObject.one, handler1, handler1.onOne);
      connect(obj1, TestObject.one, handler2, handler2.onOne);
      connect(obj2, TestObject.one, handler1, handler1.onOne);
      connect(obj2, TestObject.one, handler2, handler2.onOne);
      var d1 = disconnect(obj1, null, null, null);
      var d2 = disconnect(obj1, null, null, null);
      emit(obj1, TestObject.one, void 0);
      emit(obj2, TestObject.one, void 0);
      expect(d1).to.be(true);
      expect(d2).to.be(false);
      expect(handler1.oneCount).to.be(1);
      expect(handler2.oneCount).to.be(1);
    });

    it('should disconnect all receivers from a specific signal', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      var handler3 = new TestHandler();
      connect(obj1, TestObject.one, handler1, handler1.onOne);
      connect(obj1, TestObject.one, handler2, handler2.onOne);
      connect(obj2, TestObject.one, handler3, handler3.onOne);
      var d1 = disconnect(obj1, TestObject.one, null, null);
      var d2 = disconnect(obj1, TestObject.one, handler1, handler1.onOne);
      var d3 = disconnect(obj1, TestObject.one, handler2, handler2.onOne);
      var d4 = disconnect(obj1, TestObject.one, handler3, handler3.onOne);
      emit(obj1, TestObject.one, void 0);
      emit(obj2, TestObject.one, void 0);
      expect(d1).to.be(true);
      expect(d2).to.be(false);
      expect(d3).to.be(false);
      expect(d4).to.be(false);
      expect(handler1.oneCount).to.be(0);
      expect(handler2.oneCount).to.be(0);
      expect(handler3.oneCount).to.be(1);
    });

    it('should disconnect a specific receiver from all senders', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      connect(obj1, TestObject.one, handler1, handler1.onOne);
      connect(obj1, TestObject.one, handler2, handler2.onOne);
      connect(obj2, TestObject.one, handler1, handler1.onOne);
      connect(obj2, TestObject.one, handler2, handler2.onOne);
      connect(obj2, TestObject.two, handler1, handler1.onTwo);
      connect(obj2, TestObject.two, handler2, handler2.onTwo);
      var d1 = disconnect(null, null, handler1, null);
      var d2 = disconnect(null, null, handler1, null);
      emit(obj1, TestObject.one, void 0);
      emit(obj2, TestObject.one, void 0);
      emit(obj2, TestObject.two, true);
      expect(d1).to.be(true);
      expect(d2).to.be(false);
      expect(handler1.oneCount).to.be(0);
      expect(handler2.oneCount).to.be(2);
      expect(handler1.twoValue).to.be(false);
      expect(handler2.twoValue).to.be(true);
    });

    it('should disconnect a specific handler from all senders', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      connect(obj1, TestObject.one, handler1, handler1.onOne);
      connect(obj1, TestObject.one, handler2, handler2.onOne);
      connect(obj2, TestObject.one, handler1, handler1.onOne);
      connect(obj2, TestObject.one, handler2, handler2.onOne);
      connect(obj2, TestObject.two, handler1, handler1.onTwo);
      connect(obj2, TestObject.two, handler2, handler2.onTwo);
      var d1 = disconnect(null, null, handler1, handler1.onOne);
      var d2 = disconnect(null, null, handler1, handler1.onOne);
      emit(obj1, TestObject.one, void 0);
      emit(obj2, TestObject.one, void 0);
      emit(obj2, TestObject.two, true);
      expect(d1).to.be(true);
      expect(d2).to.be(false);
      expect(handler1.oneCount).to.be(0);
      expect(handler2.oneCount).to.be(2);
      expect(handler1.twoValue).to.be(true);
      expect(handler2.twoValue).to.be(true);
    });

  });


  describe('emit()', () => {

    it('should invoke handlers in connection order', () => {
      var obj1 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      var handler3 = new TestHandler();
      handler1.name = 'foo';
      handler2.name = 'bar';
      handler3.name = 'baz';
      connect(obj1, TestObject.three, handler1, handler1.onThree);
      connect(obj1, TestObject.one, handler1, handler1.onOne);
      connect(obj1, TestObject.three, handler2, handler2.onThree);
      connect(obj1, TestObject.three, handler3, handler3.onThree);
      var names: string[] = [];
      emit(obj1, TestObject.three, names);
      emit(obj1, TestObject.one, void 0);
      expect(names).to.eql(['foo', 'bar', 'baz']);
      expect(handler1.oneCount).to.be(1);
      expect(handler2.oneCount).to.be(0);
    });

    it('should immediately propagate a handler exception', () => {
      var obj1 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      var handler3 = new TestHandler();
      handler1.name = 'foo';
      handler2.name = 'bar';
      handler3.name = 'baz';
      connect(obj1, TestObject.three, handler1, handler1.onThree);
      connect(obj1, TestObject.three, handler2, handler2.onThrow);
      connect(obj1, TestObject.three, handler3, handler3.onThree);
      var threw = false;
      var names1: string[] = [];
      try {
        emit(obj1, TestObject.three, names1);
      } catch (e) {
        threw = true;
      }
      disconnect(obj1, TestObject.three, handler2, handler2.onThrow);
      var names2: string[] = [];
      emit(obj1, TestObject.three, names2);
      expect(threw).to.be(true);
      expect(names1).to.eql(['foo']);
      expect(names2).to.eql(['foo', 'baz']);
    });

    it('should not invoke signals added during emission', () =>  {
      var obj1 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      var handler3 = new TestHandler();
      handler1.name = 'foo';
      handler2.name = 'bar';
      handler3.name = 'baz';
      var adder = {
        add: () => {
          connect(obj1, TestObject.three, handler3, handler3.onThree);
        },
      };
      connect(obj1, TestObject.three, handler1, handler1.onThree);
      connect(obj1, TestObject.three, handler2, handler1.onThree);
      connect(obj1, TestObject.three, adder, adder.add);
      var names1: string[] = [];
      emit(obj1, TestObject.three, names1);
      disconnect(null, null, adder, adder.add);
      var names2: string[] = [];
      emit(obj1, TestObject.three, names2);
      expect(names1).to.eql(['foo', 'bar']);
      expect(names2).to.eql(['foo', 'bar', 'baz']);
    });

    it('should not invoke signals removed during emission', () => {
      var obj1 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      var handler3 = new TestHandler();
      handler1.name = 'foo';
      handler2.name = 'bar';
      handler3.name = 'baz';
      var remover = {
        remove: () => {
          disconnect(obj1, TestObject.three, handler3, handler3.onThree);
        },
      };
      connect(obj1, TestObject.three, handler1, handler1.onThree);
      connect(obj1, TestObject.three, handler2, handler1.onThree);
      connect(obj1, TestObject.three, remover, remover.remove);
      connect(obj1, TestObject.three, handler3, handler3.onThree);
      var names: string[] = [];
      emit(obj1, TestObject.three, names);
      expect(names).to.eql(['foo', 'bar']);
    });

  });

});

} // module tests
