/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module tests {

import ISignal = phosphor.core.ISignal;
import disconnectReceiver = phosphor.core.disconnectReceiver;
import disconnectSender = phosphor.core.disconnectSender;
import sender = phosphor.core.sender;
import signal = phosphor.core.signal;


class TestObject {

  @signal
  one: ISignal<void>;

  @signal
  two: ISignal<boolean>;

  @signal
  three: ISignal<string[]>;
}


class TestHandler {

  name = '';

  oneCount = 0;

  twoValue = false;

  onOne(): void {
    this.oneCount++;
  }

  onTwo(args: boolean): void {
    this.twoValue = args;
  }

  onThree(args: string[]): void {
    args.push(this.name);
  }

  onThrow(): void {
    throw new Error();
  }
}


describe('phosphor.core - signaling', () => {

  describe('ISignal', () => {

    describe('#connect()', () => {

      it('should return true on success', () => {
        var obj = new TestObject();
        var handler = new TestHandler();
        var c1 = obj.one.connect(handler.onOne, handler);
        expect(c1).to.be(true);
      });

      it('should return false on failure', () => {
        var obj = new TestObject();
        var handler = new TestHandler();
        var c1 = obj.one.connect(handler.onOne, handler);
        var c2 = obj.one.connect(handler.onOne, handler);
        expect(c1).to.be(true);
        expect(c2).to.be(false);
      });

      it('should connect plain functions', () => {
        var obj = new TestObject();
        var handler = new TestHandler();
        var c1 = obj.one.connect(handler.onThrow);
        expect(c1).to.be(true);
      });

      it('should ignore duplicate connections', () => {
        var obj = new TestObject();
        var handler = new TestHandler();
        var c1 = obj.one.connect(handler.onOne, handler);
        var c2 = obj.one.connect(handler.onOne, handler);
        var c3 = obj.two.connect(handler.onTwo, handler);
        var c4 = obj.two.connect(handler.onTwo, handler);
        obj.one.emit(void 0);
        obj.two.emit(true);
        expect(c1).to.be(true);
        expect(c2).to.be(false);
        expect(c3).to.be(true);
        expect(c4).to.be(false);
        expect(handler.oneCount).to.be(1);
        expect(handler.twoValue).to.be(true);
      });

    });


    describe('#disconnect()', () => {

      it('should return true on success', () => {
        var obj = new TestObject();
        var handler = new TestHandler();
        obj.one.connect(handler.onOne, handler);
        var d1 = obj.one.disconnect(handler.onOne, handler);
        expect(d1).to.be(true);
      });

      it('should return false on failure', () => {
        var obj = new TestObject();
        var handler = new TestHandler();
        var d1 = obj.one.disconnect(handler.onOne, handler);
        expect(d1).to.be(false);
      });

      it('should disconnect a specific signal', () => {
        var obj1 = new TestObject();
        var obj2 = new TestObject();
        var handler1 = new TestHandler();
        var handler2 = new TestHandler();
        obj1.one.connect(handler1.onOne, handler1);
        obj2.one.connect(handler2.onOne, handler2);
        var d1 = obj1.one.disconnect(handler1.onOne, handler1);
        var d2 = obj1.one.disconnect(handler1.onOne, handler1);
        obj1.one.emit(void 0);
        obj2.one.emit(void 0);
        expect(d1).to.be(true);
        expect(d2).to.be(false);
        expect(handler1.oneCount).to.be(0);
        expect(handler2.oneCount).to.be(1);
      });

    });


    describe('#emit()', () => {

      it('should invoke handlers in connection order', () => {
        var obj1 = new TestObject();
        var handler1 = new TestHandler();
        var handler2 = new TestHandler();
        var handler3 = new TestHandler();
        handler1.name = 'foo';
        handler2.name = 'bar';
        handler3.name = 'baz';
        obj1.three.connect(handler1.onThree, handler1);
        obj1.one.connect(handler1.onOne, handler1);
        obj1.three.connect(handler2.onThree, handler2);
        obj1.three.connect(handler3.onThree, handler3);
        var names: string[] = [];
        obj1.three.emit(names);
        obj1.one.emit(void 0);
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
        obj1.three.connect(handler1.onThree, handler1);
        obj1.three.connect(handler2.onThrow, handler2);
        obj1.three.connect(handler3.onThree, handler3);
        var threw = false;
        var names1: string[] = [];
        try {
          obj1.three.emit(names1);
        } catch (e) {
          threw = true;
        }
        obj1.three.disconnect(handler2.onThrow, handler2);
        var names2: string[] = [];
        obj1.three.emit(names2);
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
            obj1.three.connect(handler3.onThree, handler3);
          },
        };
        obj1.three.connect(handler1.onThree, handler1);
        obj1.three.connect(handler2.onThree, handler2);
        obj1.three.connect(adder.add, adder);
        var names1: string[] = [];
        obj1.three.emit(names1);
        obj1.three.disconnect(adder.add, adder);
        var names2: string[] = [];
        obj1.three.emit(names2);
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
            obj1.three.disconnect(handler3.onThree, handler3);
          },
        };
        obj1.three.connect(handler1.onThree, handler1);
        obj1.three.connect(handler2.onThree, handler2);
        obj1.three.connect(remover.remove, remover);
        obj1.three.connect(handler3.onThree, handler3);
        var names: string[] = [];
        obj1.three.emit(names);
        expect(names).to.eql(['foo', 'bar']);
      });

    });

  });


  describe('sender()', () => {

    it('should return the current signal emitter', () => {
      var obj1 = new TestObject();
      var target: any = null;
      var handler = () => { target = sender(); };
      obj1.one.connect(handler);
      obj1.one.emit(void 0);
      expect(target).to.be(obj1);
    });

    it('should handle nested dispatch', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var targets: any[] = [];
      var func1 = () => { targets.push(sender()); };
      var func2 = () =>  {
        targets.push(sender());
        obj1.one.emit(void 0);
        targets.push(sender());
      };
      obj1.one.connect(func1);
      obj2.one.connect(func2);
      obj2.one.emit(void 0);
      expect(targets).to.eql([obj1, obj2, obj1]);
    });

  });


  describe('disconnectSender()', () => {

    it('should disconnect all signals from a specific sender', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      obj1.one.connect(handler1.onOne, handler1);
      obj1.one.connect(handler2.onOne, handler2);
      obj2.one.connect(handler1.onOne, handler1);
      obj2.one.connect(handler2.onOne, handler2);
      disconnectSender(obj1);
      obj1.one.emit(void 0);
      obj2.one.emit(void 0);
      expect(handler1.oneCount).to.be(1);
      expect(handler2.oneCount).to.be(1);
    });

  });


  describe('disconnectReceiver()', () => {

    it('should disconnect all signals from a specific receiver', () => {
      var obj1 = new TestObject();
      var obj2 = new TestObject();
      var handler1 = new TestHandler();
      var handler2 = new TestHandler();
      obj1.one.connect(handler1.onOne, handler1);
      obj1.one.connect(handler2.onOne, handler2);
      obj2.one.connect(handler1.onOne, handler1);
      obj2.one.connect(handler2.onOne, handler2);
      obj2.two.connect(handler1.onTwo, handler1);
      obj2.two.connect(handler2.onTwo, handler2);
      disconnectReceiver(handler1);
      obj1.one.emit(void 0);
      obj2.one.emit(void 0);
      obj2.two.emit(true);
      expect(handler1.oneCount).to.be(0);
      expect(handler2.oneCount).to.be(2);
      expect(handler1.twoValue).to.be(false);
      expect(handler2.twoValue).to.be(true);
    });

  });

});

} // module tests
