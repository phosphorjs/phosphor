/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  ConflatableMessage, IMessageHandler, Message, MessageHook, clearMessageData,
  installMessageHook, postMessage, removeMessageHook, sendMessage
} from '../../../lib/core/messaging';


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


class LogHook {

  preventTypes: string[] = [];

  messages: string[] = [];

  handlers: IMessageHandler[] = [];

  hook: MessageHook = (handler: IMessageHandler, msg: Message) => {
    this.messages.push(msg.type);
    this.handlers.push(handler);
    return this.preventTypes.indexOf(msg.type) === -1;
  };
}


const defer = (() => {
  let ok = typeof requestAnimationFrame === 'function';
  return ok ? requestAnimationFrame : setImmediate;
})();


describe('core/messaging', () => {

  describe('Message', () => {

    describe('#constructor()', () => {

      it('should require a single message type argument', () => {
        let msg = new Message('test');
        expect(msg instanceof Message).to.be(true);
      });

    });

    describe('#type', () => {

      it('should return the message type', () => {
        let msg = new Message('test');
        expect(msg.type).to.be('test');
      });

    });

    describe('#isConflatable', () => {

      it('should be `false` by default', () => {
        let msg = new Message('test');
        expect(msg.isConflatable).to.be(false);
      });

    });

    describe('#conflate()', () => {

      it('should return `false` by default', () => {
        let msg = new Message('test');
        let other = new Message('test');
        expect(msg.conflate(other)).to.be(false);
      });

    });

  });

  describe('ConflatableMessage', () => {

    describe('#constructor()', () => {

      it('should require a single message type argument', () => {
        let msg = new ConflatableMessage('test');
        expect(msg instanceof ConflatableMessage).to.be(true);
      });

      it('should extend the base `Message` class', () => {
        let msg = new ConflatableMessage('test');
        expect(msg instanceof Message).to.be(true);
      });

    });

    describe('#isConflatable', () => {

      it('should be `true` by default', () => {
        let msg = new ConflatableMessage('test');
        expect(msg.isConflatable).to.be(true);
      });

    });

    describe('#conflate()', () => {

      it('should return `true` by default', () => {
        let msg = new ConflatableMessage('test');
        let other = new ConflatableMessage('test');
        expect(msg.conflate(other)).to.be(true);
      });

    });

  });

  describe('IMessageHandler', () => {

    describe('#processMessage()', () => {

      it('should process the messages sent to the handler', () => {
        let handler = new Handler();
        sendMessage(handler, new Message('one'));
        sendMessage(handler, new Message('two'));
        sendMessage(handler, new Message('three'));
        expect(handler.messages).to.eql(['one', 'two', 'three']);
      });

    });

  });

  describe('IMessageHook', () => {

    describe('#hookMessage()', () => {

      it('should be called for every message sent to a handler', () => {
        let handler = new Handler();
        let logHook = new LogHook();
        installMessageHook(handler, logHook.hook);
        sendMessage(handler, new Message('one'));
        sendMessage(handler, new Message('two'));
        sendMessage(handler, new Message('three'));
        expect(handler.messages).to.eql(['one', 'two', 'three']);
        expect(logHook.messages).to.eql(['one', 'two', 'three']);
        expect(logHook.handlers.length).to.be(3);
        for (let i of [0, 1, 2]) {
          expect(logHook.handlers[i]).to.be(handler);
        }
      });

      it('should block messages which do not pass the hook', () => {
        let handler1 = new Handler();
        let handler2 = new Handler();
        let logHook = new LogHook();
        logHook.preventTypes = ['one', 'two'];
        installMessageHook(handler1, logHook.hook);
        installMessageHook(handler2, logHook.hook);
        sendMessage(handler1, new Message('one'));
        sendMessage(handler2, new Message('one'));
        sendMessage(handler1, new Message('two'));
        sendMessage(handler2, new Message('two'));
        sendMessage(handler1, new Message('three'));
        sendMessage(handler2, new Message('three'));
        expect(handler1.messages).to.eql(['three']);
        expect(handler2.messages).to.eql(['three']);
        expect(logHook.messages).to.eql(['one', 'one', 'two', 'two', 'three', 'three']);
        expect(logHook.handlers.length).to.be(6);
        for (let i of [0, 2, 4]) {
          expect(logHook.handlers[i]).to.be(handler1);
          expect(logHook.handlers[i + 1]).to.be(handler2);
        }
      });

    });

  });

  describe('sendMessage()', () => {

    it('should send a message to the handler to process immediately', () => {
      let handler = new Handler();
      expect(handler.messages).to.eql([]);
      sendMessage(handler, new Message('one'));
      expect(handler.messages).to.eql(['one']);
      sendMessage(handler, new Message('two'));
      expect(handler.messages).to.eql(['one', 'two']);
    });

    it('should not conflate the message', () => {
      let handler = new Handler();
      let msg = new ConflatableMessage('one');
      sendMessage(handler, msg);
      sendMessage(handler, msg);
      sendMessage(handler, msg);
      expect(handler.messages).to.eql(['one', 'one', 'one']);
    });

    it('should first run the message through the message hooks', () => {
      let handler = new Handler();
      let logHook1 = new LogHook();
      let logHook2 = new LogHook();
      logHook1.preventTypes = ['one'];
      logHook2.preventTypes = ['two'];
      installMessageHook(handler, logHook1.hook);
      installMessageHook(handler, logHook2.hook);
      sendMessage(handler, new Message('one'));
      sendMessage(handler, new Message('two'));
      sendMessage(handler, new Message('three'));
      expect(handler.messages).to.eql(['three']);
      expect(logHook1.messages).to.eql(['one', 'three']);
      expect(logHook2.messages).to.eql(['one', 'two', 'three']);
    });

    it('should stop dispatching on the first `false` hook result', () => {
      let handler = new Handler();
      let logHook1 = new LogHook();
      let logHook2 = new LogHook();
      let logHook3 = new LogHook();
      logHook1.preventTypes = ['one'];
      logHook2.preventTypes = ['one'];
      logHook3.preventTypes = ['one'];
      installMessageHook(handler, logHook1.hook);
      installMessageHook(handler, logHook2.hook);
      installMessageHook(handler, logHook3.hook);
      sendMessage(handler, new Message('one'));
      sendMessage(handler, new Message('two'));
      sendMessage(handler, new Message('three'));
      expect(handler.messages).to.eql(['two', 'three']);
      expect(logHook1.messages).to.eql(['two', 'three']);
      expect(logHook2.messages).to.eql(['two', 'three']);
      expect(logHook3.messages).to.eql(['one', 'two', 'three']);
    });

    it('should ignore exceptions in handlers', () => {
      let handler = new BadHandler();
      let msg = new Message('one');
      expect(() => { sendMessage(handler, msg); }).to.not.throwError();
    });

    it('should ignore exceptions in hooks', () => {
      let handler = new Handler();
      let msg = new Message('one');
      installMessageHook(handler, (): boolean => { throw ''; });
      expect(() => { sendMessage(handler, msg); }).to.not.throwError();
    });

  });

  describe('postMessage()', () => {

    it('should post a message to the handler in the future', (done) => {
      let handler = new Handler();
      expect(handler.messages).to.eql([]);
      postMessage(handler, new Message('one'));
      postMessage(handler, new Message('two'));
      postMessage(handler, new Message('three'));
      expect(handler.messages).to.eql([]);
      defer(() => {
        expect(handler.messages).to.eql(['one', 'two', 'three']);
        done();
      });
    });

    it('should conflate a conflatable message', (done) => {
      let handler = new Handler();
      let one = new Message('one');
      let two = new Message('two');
      let three = new ConflatableMessage('three');
      expect(handler.messages).to.eql([]);
      postMessage(handler, one);
      postMessage(handler, two);
      postMessage(handler, three);
      postMessage(handler, three);
      postMessage(handler, three);
      postMessage(handler, three);
      expect(handler.messages).to.eql([]);
      defer(() => {
        expect(handler.messages).to.eql(['one', 'two', 'three']);
        done();
      });
    });

    it('should not conflate a non-conflatable message', (done) => {
      let handler = new Handler();
      let cf1 = new Message('one');
      let cf2 = new ConflatableMessage('one');
      expect(handler.messages).to.eql([]);
      postMessage(handler, cf1);
      postMessage(handler, cf2);
      expect(handler.messages).to.eql([]);
      defer(() => {
        expect(handler.messages).to.eql(['one', 'one']);
        done();
      });
    });

    it('should not conflate messages for different handlers', (done) => {
      let h1 = new Handler();
      let h2 = new Handler();
      let msg = new ConflatableMessage('one');
      postMessage(h1, msg);
      postMessage(h2, msg);
      defer(() => {
        expect(h1.messages).to.eql(['one']);
        expect(h2.messages).to.eql(['one']);
        done();
      });
    });
    it('should obey global order of posted messages', (done) => {
      let handler1 = new GlobalHandler();
      let handler2 = new GlobalHandler();
      let handler3 = new GlobalHandler();
      postMessage(handler3, new Message('one'));
      postMessage(handler1, new Message('two'));
      postMessage(handler2, new Message('three'));
      postMessage(handler1, new Message('A'));
      postMessage(handler2, new Message('B'));
      postMessage(handler3, new Message('C'));
      expect(handler1.messages).to.eql([]);
      expect(handler2.messages).to.eql([]);
      expect(handler3.messages).to.eql([]);
      expect(GlobalHandler.messages).to.eql([]);
      defer(() => {
        expect(GlobalHandler.messages).to.eql(['one', 'two', 'three', 'A', 'B', 'C']);
        expect(handler1.messages).to.eql(['two', 'A']);
        expect(handler2.messages).to.eql(['three', 'B']);
        expect(handler3.messages).to.eql(['one', 'C']);
        done();
      });
    });

  });

  describe('installMessageHook()', () => {

    it('should install a hook for a handler', () => {
      let handler = new Handler();
      let logHook = new LogHook();
      logHook.preventTypes = ['one'];
      installMessageHook(handler, logHook.hook);
      expect(handler.messages).to.eql([]);
      sendMessage(handler, new Message('one'));
      expect(handler.messages).to.eql([]);
    });

    it('should install a new hook in front of any others', () => {
      let handler = new Handler();
      let logHook1 = new LogHook();
      let logHook2 = new LogHook();
      logHook1.preventTypes = ['one'];
      logHook2.preventTypes = ['two'];
      installMessageHook(handler, logHook1.hook);
      sendMessage(handler, new Message('two'));
      installMessageHook(handler, logHook2.hook);
      sendMessage(handler, new Message('two'));
      sendMessage(handler, new Message('two'));
      sendMessage(handler, new Message('three'));
      sendMessage(handler, new Message('one'));
      expect(handler.messages).to.eql(['two', 'three']);
      expect(logHook1.messages).to.eql(['two', 'three', 'one']);
      expect(logHook2.messages).to.eql(['two', 'two', 'three', 'one']);
    });

    it('should not allow a hook to be installed multiple times', () => {
      let handler = new Handler();
      let logHook1 = new LogHook();
      let logHook2 = new LogHook();
      installMessageHook(handler, logHook1.hook);
      installMessageHook(handler, logHook2.hook);
      installMessageHook(handler, logHook1.hook);
      sendMessage(handler, new Message('one'));
      sendMessage(handler, new Message('two'));
      expect(handler.messages).to.eql(['one', 'two']);
      expect(logHook1.messages).to.eql(['one', 'two']);
      expect(logHook2.messages).to.eql(['one', 'two']);
    });

  });

  describe('removeMessageHook()', () => {

    it('should remove a previously installed hook', () => {
      let handler = new Handler();
      let logHook1 = new LogHook();
      let logHook2 = new LogHook();
      logHook1.preventTypes = ['one'];
      logHook2.preventTypes = ['two'];
      sendMessage(handler, new Message('one'));
      sendMessage(handler, new Message('two'));
      installMessageHook(handler, logHook1.hook);
      installMessageHook(handler, logHook2.hook);
      sendMessage(handler, new Message('one'));
      sendMessage(handler, new Message('two'));
      removeMessageHook(handler, logHook2.hook);
      removeMessageHook(handler, logHook1.hook);
      sendMessage(handler, new Message('one'));
      sendMessage(handler, new Message('two'));
      expect(handler.messages).to.eql(['one', 'two', 'one', 'two']);
      expect(logHook1.messages).to.eql(['one']);
      expect(logHook2.messages).to.eql(['one', 'two']);
    });

    it('should be a no-op if the hook was not installed', () => {
      let handler = new Handler();
      let logHook = new LogHook();
      logHook.preventTypes = ['one'];
      sendMessage(handler, new Message('one'));
      removeMessageHook(handler, logHook.hook);
      sendMessage(handler, new Message('one'));
      expect(handler.messages).to.eql(['one', 'one']);
    });

    it('should be safe to remove a hook while dispatching', () => {
      let handler = new Handler();
      let logHook1 = new LogHook();
      let logHook2 = new LogHook();
      let logHook3 = new LogHook();
      let remHook: MessageHook = (handler: IMessageHandler, msg: Message) => {
        let result = logHook3.hook(handler, msg);
        removeMessageHook(handler, remHook);
        return result;
      };
      installMessageHook(handler, logHook1.hook);
      installMessageHook(handler, remHook);
      installMessageHook(handler, logHook2.hook);
      sendMessage(handler, new Message('one'));
      sendMessage(handler, new Message('two'));
      sendMessage(handler, new Message('three'));
      expect(handler.messages).to.eql(['one', 'two', 'three']);
      expect(logHook1.messages).to.eql(['one', 'two', 'three']);
      expect(logHook3.messages).to.eql(['one']);
      expect(logHook2.messages).to.eql(['one', 'two', 'three']);
    });

  });

  describe('clearMessageData()', () => {

    it('should remove all message data associated with a handler', (done) => {
      let h1 = new Handler();
      let h2 = new Handler();
      let logHook = new LogHook();
      installMessageHook(h1, logHook.hook);
      postMessage(h1, new Message('one'));
      postMessage(h2, new Message('one'));
      postMessage(h1, new Message('two'));
      postMessage(h2, new Message('two'));
      postMessage(h1, new Message('three'));
      postMessage(h2, new Message('three'));
      clearMessageData(h1);
      defer(() => {
        expect(h1.messages).to.eql([]);
        expect(h2.messages).to.eql(['one', 'two', 'three']);
        expect(logHook.messages).to.eql([]);
        done();
      });
    });

  });

});
