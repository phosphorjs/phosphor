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
  ConflatableMessage, IMessageHandler, IMessageHook, Message, MessageHook,
  MessageLoop
} from '@phosphor/messaging';


class Handler implements IMessageHandler {

  messages: string[] = [];

  processMessage(msg: Message): void {
    this.messages.push(msg.type);
  }
}


class BadHandler implements IMessageHandler {

  processMessage(msg: Message): void {
    throw new Error('process error');
  }
}


class GlobalHandler extends Handler {

  static messages: string[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    GlobalHandler.messages.push(msg.type);
  }
}


class LogHook implements IMessageHook {

  preventTypes: string[] = [];

  messages: string[] = [];

  handlers: IMessageHandler[] = [];

  messageHook(handler: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type);
    this.handlers.push(handler);
    return this.preventTypes.indexOf(msg.type) === -1;
  }
}


const defer = (() => {
  let ok = typeof requestAnimationFrame === 'function';
  return ok ? requestAnimationFrame : setImmediate;
})();


describe('@phosphor/messaging', () => {

  describe('Message', () => {

    describe('#constructor()', () => {

      it('should require a single message type argument', () => {
        let msg = new Message('test');
        expect(msg).to.be.an.instanceof(Message);
      });

    });

    describe('#type', () => {

      it('should return the message type', () => {
        let msg = new Message('test');
        expect(msg.type).to.equal('test');
      });

    });

    describe('#isConflatable', () => {

      it('should be `false` by default', () => {
        let msg = new Message('test');
        expect(msg.isConflatable).to.equal(false);
      });

    });

    describe('#conflate()', () => {

      it('should return `false` by default', () => {
        let msg = new Message('test');
        let other = new Message('test');
        expect(msg.conflate(other)).to.equal(false);
      });

    });

  });

  describe('ConflatableMessage', () => {

    describe('#constructor()', () => {

      it('should require a single message type argument', () => {
        let msg = new ConflatableMessage('test');
        expect(msg).to.be.an.instanceof(ConflatableMessage);
      });

      it('should extend the base `Message` class', () => {
        let msg = new ConflatableMessage('test');
        expect(msg).to.be.an.instanceof(Message);
      });

    });

    describe('#isConflatable', () => {

      it('should be `true` by default', () => {
        let msg = new ConflatableMessage('test');
        expect(msg.isConflatable).to.equal(true);
      });

    });

    describe('#conflate()', () => {

      it('should return `true` by default', () => {
        let msg = new ConflatableMessage('test');
        let other = new ConflatableMessage('test');
        expect(msg.conflate(other)).to.equal(true);
      });

    });

  });

  describe('IMessageHandler', () => {

    describe('#processMessage()', () => {

      it('should process the messages sent to the handler', () => {
        let handler = new Handler();
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.sendMessage(handler, new Message('three'));
        expect(handler.messages).to.deep.equal(['one', 'two', 'three']);
      });

    });

  });

  describe('IMessageHook', () => {

    describe('#messageHook()', () => {

      it('should be called for every message sent to a handler', () => {
        let handler = new Handler();
        let logHook = new LogHook();
        MessageLoop.installMessageHook(handler, logHook);
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.sendMessage(handler, new Message('three'));
        expect(handler.messages).to.deep.equal(['one', 'two', 'three']);
        expect(logHook.messages).to.deep.equal(['one', 'two', 'three']);
        expect(logHook.handlers.length).to.equal(3);
        for (let i of [0, 1, 2]) {
          expect(logHook.handlers[i]).to.equal(handler);
        }
      });

      it('should block messages which do not pass the hook', () => {
        let handler1 = new Handler();
        let handler2 = new Handler();
        let logHook = new LogHook();
        logHook.preventTypes = ['one', 'two'];
        MessageLoop.installMessageHook(handler1, logHook);
        MessageLoop.installMessageHook(handler2, logHook);
        MessageLoop.sendMessage(handler1, new Message('one'));
        MessageLoop.sendMessage(handler2, new Message('one'));
        MessageLoop.sendMessage(handler1, new Message('two'));
        MessageLoop.sendMessage(handler2, new Message('two'));
        MessageLoop.sendMessage(handler1, new Message('three'));
        MessageLoop.sendMessage(handler2, new Message('three'));
        expect(handler1.messages).to.deep.equal(['three']);
        expect(handler2.messages).to.deep.equal(['three']);
        expect(logHook.messages).to.deep.equal(['one', 'one', 'two', 'two', 'three', 'three']);
        expect(logHook.handlers.length).to.equal(6);
        for (let i of [0, 2, 4]) {
          expect(logHook.handlers[i]).to.equal(handler1);
          expect(logHook.handlers[i + 1]).to.equal(handler2);
        }
      });

    });

  });

  describe('MessageLoop', () => {

    describe('sendMessage()', () => {

      it('should send a message to the handler to process immediately', () => {
        let handler = new Handler();
        expect(handler.messages).to.deep.equal([]);
        MessageLoop.sendMessage(handler, new Message('one'));
        expect(handler.messages).to.deep.equal(['one']);
        MessageLoop.sendMessage(handler, new Message('two'));
        expect(handler.messages).to.deep.equal(['one', 'two']);
      });

      it('should not conflate the message', () => {
        let handler = new Handler();
        let msg = new ConflatableMessage('one');
        MessageLoop.sendMessage(handler, msg);
        MessageLoop.sendMessage(handler, msg);
        MessageLoop.sendMessage(handler, msg);
        expect(handler.messages).to.deep.equal(['one', 'one', 'one']);
      });

      it('should first run the message through the message hooks', () => {
        let handler = new Handler();
        let logHook1 = new LogHook();
        let logHook2 = new LogHook();
        logHook1.preventTypes = ['one'];
        logHook2.preventTypes = ['two'];
        MessageLoop.installMessageHook(handler, logHook1);
        MessageLoop.installMessageHook(handler, logHook2);
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.sendMessage(handler, new Message('three'));
        expect(handler.messages).to.deep.equal(['three']);
        expect(logHook1.messages).to.deep.equal(['one', 'three']);
        expect(logHook2.messages).to.deep.equal(['one', 'two', 'three']);
      });

      it('should stop dispatching on the first `false` hook result', () => {
        let handler = new Handler();
        let logHook1 = new LogHook();
        let logHook2 = new LogHook();
        let logHook3 = new LogHook();
        logHook1.preventTypes = ['one'];
        logHook2.preventTypes = ['one'];
        logHook3.preventTypes = ['one'];
        MessageLoop.installMessageHook(handler, logHook1);
        MessageLoop.installMessageHook(handler, logHook2);
        MessageLoop.installMessageHook(handler, logHook3);
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.sendMessage(handler, new Message('three'));
        expect(handler.messages).to.deep.equal(['two', 'three']);
        expect(logHook1.messages).to.deep.equal(['two', 'three']);
        expect(logHook2.messages).to.deep.equal(['two', 'three']);
        expect(logHook3.messages).to.deep.equal(['one', 'two', 'three']);
      });

      it('should ignore exceptions in handlers', () => {
        let handler = new BadHandler();
        let msg = new Message('one');
        expect(() => { MessageLoop.sendMessage(handler, msg); }).to.not.throw(Error);
      });

      it('should ignore exceptions in hooks', () => {
        let handler = new Handler();
        let msg = new Message('one');
        MessageLoop.installMessageHook(handler, (): boolean => { throw ''; });
        expect(() => { MessageLoop.sendMessage(handler, msg); }).to.not.throw(Error);
      });

    });

    describe('postMessage()', () => {

      it('should post a message to the handler in the future', (done) => {
        let handler = new Handler();
        expect(handler.messages).to.deep.equal([]);
        MessageLoop.postMessage(handler, new Message('one'));
        MessageLoop.postMessage(handler, new Message('two'));
        MessageLoop.postMessage(handler, new Message('three'));
        expect(handler.messages).to.deep.equal([]);
        defer(() => {
          expect(handler.messages).to.deep.equal(['one', 'two', 'three']);
          done();
        });
      });

      it('should conflate a conflatable message', (done) => {
        let handler = new Handler();
        let one = new Message('one');
        let two = new Message('two');
        let three = new ConflatableMessage('three');
        expect(handler.messages).to.deep.equal([]);
        MessageLoop.postMessage(handler, one);
        MessageLoop.postMessage(handler, two);
        MessageLoop.postMessage(handler, three);
        MessageLoop.postMessage(handler, three);
        MessageLoop.postMessage(handler, three);
        MessageLoop.postMessage(handler, three);
        expect(handler.messages).to.deep.equal([]);
        defer(() => {
          expect(handler.messages).to.deep.equal(['one', 'two', 'three']);
          done();
        });
      });

      it('should not conflate a non-conflatable message', (done) => {
        let handler = new Handler();
        let cf1 = new Message('one');
        let cf2 = new ConflatableMessage('one');
        expect(handler.messages).to.deep.equal([]);
        MessageLoop.postMessage(handler, cf1);
        MessageLoop.postMessage(handler, cf2);
        expect(handler.messages).to.deep.equal([]);
        defer(() => {
          expect(handler.messages).to.deep.equal(['one', 'one']);
          done();
        });
      });

      it('should not conflate messages for different handlers', (done) => {
        let h1 = new Handler();
        let h2 = new Handler();
        let msg = new ConflatableMessage('one');
        MessageLoop.postMessage(h1, msg);
        MessageLoop.postMessage(h2, msg);
        defer(() => {
          expect(h1.messages).to.deep.equal(['one']);
          expect(h2.messages).to.deep.equal(['one']);
          done();
        });
      });

      it('should obey global order of posted messages', (done) => {
        let handler1 = new GlobalHandler();
        let handler2 = new GlobalHandler();
        let handler3 = new GlobalHandler();
        MessageLoop.postMessage(handler3, new Message('one'));
        MessageLoop.postMessage(handler1, new Message('two'));
        MessageLoop.postMessage(handler2, new Message('three'));
        MessageLoop.postMessage(handler1, new Message('A'));
        MessageLoop.postMessage(handler2, new Message('B'));
        MessageLoop.postMessage(handler3, new Message('C'));
        expect(handler1.messages).to.deep.equal([]);
        expect(handler2.messages).to.deep.equal([]);
        expect(handler3.messages).to.deep.equal([]);
        expect(GlobalHandler.messages).to.deep.equal([]);
        defer(() => {
          expect(GlobalHandler.messages).to.deep.equal(['one', 'two', 'three', 'A', 'B', 'C']);
          expect(handler1.messages).to.deep.equal(['two', 'A']);
          expect(handler2.messages).to.deep.equal(['three', 'B']);
          expect(handler3.messages).to.deep.equal(['one', 'C']);
          done();
        });
      });

    });

    describe('installMessageHook()', () => {

      it('should install a hook for a handler', () => {
        let handler = new Handler();
        let logHook = new LogHook();
        logHook.preventTypes = ['one'];
        MessageLoop.installMessageHook(handler, logHook);
        expect(handler.messages).to.deep.equal([]);
        MessageLoop.sendMessage(handler, new Message('one'));
        expect(handler.messages).to.deep.equal([]);
      });

      it('should install a new hook in front of any others', () => {
        let handler = new Handler();
        let logHook1 = new LogHook();
        let logHook2 = new LogHook();
        logHook1.preventTypes = ['one'];
        logHook2.preventTypes = ['two'];
        MessageLoop.installMessageHook(handler, logHook1);
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.installMessageHook(handler, logHook2);
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.sendMessage(handler, new Message('three'));
        MessageLoop.sendMessage(handler, new Message('one'));
        expect(handler.messages).to.deep.equal(['two', 'three']);
        expect(logHook1.messages).to.deep.equal(['two', 'three', 'one']);
        expect(logHook2.messages).to.deep.equal(['two', 'two', 'three', 'one']);
      });

      it('should not allow a hook to be installed multiple times', () => {
        let handler = new Handler();
        let logHook1 = new LogHook();
        let logHook2 = new LogHook();
        MessageLoop.installMessageHook(handler, logHook1);
        MessageLoop.installMessageHook(handler, logHook2);
        MessageLoop.installMessageHook(handler, logHook1);
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        expect(handler.messages).to.deep.equal(['one', 'two']);
        expect(logHook1.messages).to.deep.equal(['one', 'two']);
        expect(logHook2.messages).to.deep.equal(['one', 'two']);
      });

    });

    describe('removeMessageHook()', () => {

      it('should remove a previously installed hook', () => {
        let handler = new Handler();
        let logHook1 = new LogHook();
        let logHook2 = new LogHook();
        logHook1.preventTypes = ['one'];
        logHook2.preventTypes = ['two'];
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.installMessageHook(handler, logHook1);
        MessageLoop.installMessageHook(handler, logHook2);
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.removeMessageHook(handler, logHook2);
        MessageLoop.removeMessageHook(handler, logHook1);
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        expect(handler.messages).to.deep.equal(['one', 'two', 'one', 'two']);
        expect(logHook1.messages).to.deep.equal(['one']);
        expect(logHook2.messages).to.deep.equal(['one', 'two']);
      });

      it('should be a no-op if the hook was not installed', () => {
        let handler = new Handler();
        let logHook = new LogHook();
        logHook.preventTypes = ['one'];
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.removeMessageHook(handler, logHook);
        MessageLoop.sendMessage(handler, new Message('one'));
        expect(handler.messages).to.deep.equal(['one', 'one']);
      });

      it('should be safe to remove a hook while dispatching', () => {
        let handler = new Handler();
        let logHook1 = new LogHook();
        let logHook2 = new LogHook();
        let logHook3 = new LogHook();
        let remHook: MessageHook = (handler: IMessageHandler, msg: Message) => {
          let result = logHook3.messageHook(handler, msg);
          MessageLoop.removeMessageHook(handler, remHook);
          return result;
        };
        MessageLoop.installMessageHook(handler, logHook1);
        MessageLoop.installMessageHook(handler, remHook);
        MessageLoop.installMessageHook(handler, logHook2);
        MessageLoop.sendMessage(handler, new Message('one'));
        MessageLoop.sendMessage(handler, new Message('two'));
        MessageLoop.sendMessage(handler, new Message('three'));
        expect(handler.messages).to.deep.equal(['one', 'two', 'three']);
        expect(logHook1.messages).to.deep.equal(['one', 'two', 'three']);
        expect(logHook3.messages).to.deep.equal(['one']);
        expect(logHook2.messages).to.deep.equal(['one', 'two', 'three']);
      });

    });

    describe('clearData()', () => {

      it('should remove all message data associated with a handler', (done) => {
        let h1 = new Handler();
        let h2 = new Handler();
        let logHook = new LogHook();
        MessageLoop.installMessageHook(h1, logHook);
        MessageLoop.postMessage(h1, new Message('one'));
        MessageLoop.postMessage(h2, new Message('one'));
        MessageLoop.postMessage(h1, new Message('two'));
        MessageLoop.postMessage(h2, new Message('two'));
        MessageLoop.postMessage(h1, new Message('three'));
        MessageLoop.postMessage(h2, new Message('three'));
        MessageLoop.clearData(h1);
        defer(() => {
          expect(h1.messages).to.deep.equal([]);
          expect(h2.messages).to.deep.equal(['one', 'two', 'three']);
          expect(logHook.messages).to.deep.equal([]);
          done();
        });
      });

    });

    describe('flush()', () => {

      it('should immediately process all posted messages', () => {
        let h1 = new Handler();
        let h2 = new Handler();
        MessageLoop.postMessage(h1, new Message('one'));
        MessageLoop.postMessage(h2, new Message('one'));
        MessageLoop.postMessage(h1, new Message('two'));
        MessageLoop.postMessage(h2, new Message('two'));
        MessageLoop.postMessage(h1, new Message('three'));
        MessageLoop.postMessage(h2, new Message('three'));
        MessageLoop.flush();
        expect(h1.messages).to.deep.equal(['one', 'two', 'three']);
        expect(h2.messages).to.deep.equal(['one', 'two', 'three']);
      });

      it('should ignore recursive calls', () => {
        let h1 = new Handler();
        let h2 = new Handler();

        MessageLoop.installMessageHook(h1, (h, m) => {
          if (m.type === 'two') {
            MessageLoop.postMessage(h, new Message('four'));
            MessageLoop.postMessage(h, new Message('five'));
            MessageLoop.postMessage(h, new Message('six'));
            MessageLoop.flush();
          }
          return true;
        });

        MessageLoop.postMessage(h1, new Message('one'));
        MessageLoop.postMessage(h2, new Message('one'));
        MessageLoop.postMessage(h1, new Message('two'));
        MessageLoop.postMessage(h2, new Message('two'));
        MessageLoop.postMessage(h1, new Message('three'));
        MessageLoop.postMessage(h2, new Message('three'));

        MessageLoop.flush();

        expect(h1.messages).to.deep.equal(['one', 'two', 'three']);
        expect(h2.messages).to.deep.equal(['one', 'two', 'three']);

        MessageLoop.flush();

        expect(h1.messages).to.deep.equal(['one', 'two', 'three', 'four', 'five', 'six']);
        expect(h2.messages).to.deep.equal(['one', 'two', 'three']);
      });

    });

  });

});
