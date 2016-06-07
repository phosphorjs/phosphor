/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  JSONObject
} from '../../../lib/algorithm/json';

import {
  commands
} from '../../../lib/ui/commands';

import {
  keymap, KeymapManager
} from '../../../lib/ui/keymap';

import {
  EN_US, KeycodeLayout
} from '../../../lib/ui/keyboard';

import {
  Vector
} from '../../../lib/collections/vector';


/**
 * Helper function to generate keyboard events for unit-tests.
 */
function genKeyboardEvent(options: any): KeyboardEvent {
  let event = document.createEvent('Events') as KeyboardEvent;
  let bubbles = options.bubbles || true;
  let cancelable = options.cancelable || true;
  event.initEvent(options.type || 'keydown', bubbles, cancelable);
  event.keyCode = options.keyCode || 0;
  event.key = options.key || '';
  event.which = event.keyCode;
  event.ctrlKey = options.ctrlKey || false;
  event.altKey = options.altKey || false;
  event.shiftKey = options.shiftKey || false;
  event.metaKey = options.metaKey || false;
  event.view = options.view || window;
  return event;
}

let id = 0;


/**
 * A flag indicating whether the platform is Mac.
 */
var IS_MAC = !!navigator.platform.match(/Mac/i);


/**
 * Create an element with a unique id and add to the document.
 */
function createElement(): HTMLElement {
  let el = document.createElement('div');
  (el as any).id = `test${id++}`;
  document.body.appendChild(el);
  return el;
}


describe('ui/keymap', () => {

  describe('KeymapManager', () => {

    describe('static instance', () => {

      it('should be a keymap manager', () => {
        expect(keymap).to.be.a(KeymapManager);
      })

    });

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let keymap = new KeymapManager();
        expect(keymap).to.be.a(KeymapManager);
      })

    });

    describe('#layout', () => {

      it('should be a keycode layout', () => {
        expect(keymap.layout instanceof KeycodeLayout).to.be(true);
      });

      it('should default to `EN_US` layout', () => {
        expect(keymap.layout).to.be(EN_US);
      });

      it('should emit a layout changed signal', () => {
        let called = 0;
        let handler = () => { called++; };
        keymap.layoutChanged.connect(handler);
        keymap.layout = new KeycodeLayout('ab-cd', {});
        expect(called).to.be(1);
        keymap.layout = null;
        expect(called).to.be(2);
        keymap.layoutChanged.disconnect(handler);
      });

      it('should reset to `EN_US` if set to `null`', () => {
        keymap.layout = null;
        expect(keymap.layout).to.be(EN_US);
      });

    });

    describe('#bindings', () => {

      it('should be a vector', () => {
        expect(keymap.bindings instanceof Vector).to.be(true);
      });

      it('should be read only', () => {
        expect(() => { keymap.bindings = null }).to.throwError();
      });

    });

    describe('#addBinding()', () => {

      it('should add key bindings to the keymap manager', () => {
        let node = createElement();
        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let keyEvent = genKeyboardEvent({ keyCode: 59, ctrlKey: true });
        node.dispatchEvent(keyEvent);
        expect(called).to.be(true);
        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should remove a binding when disposed', () => {
        let node = createElement();
        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        binding.dispose();
        expect(called).to.be(false);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should emit a binding changed signal when added and removed', () => {
        let node = createElement();
        let added = false;
        let command = commands.addCommand('test', { execute: () => { } });
        let handler = (sender: any, args: any) => {
          added = (args as KeymapManager.IBindingChangedArgs).type === 'added';
        };
        keymap.bindingChanged.connect(handler);
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        expect(added).to.be(true);
        binding.dispose();
        expect(added).to.be(false);
        keymap.bindingChanged.disconnect(handler);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should throw an error if binding has an invalid selector', () => {
        let command = commands.addCommand('test', { execute: () => {  } });
        let options = { keys: ['Ctrl ;'], selector: '..', command: 'test' };
        expect(() => { keymap.addBinding(options); }).to.throwError();
        command.dispose();
      });

    });

    describe('#findBinding()', () => {

      it('should find a key binding based on command and args', () => {
        let c1 = commands.addCommand('c1', { execute: () => { } });
        let c2 = commands.addCommand('c2', { execute: () => { } });
        let a1: JSONObject = { 'foo': 'bar' };
        let a2: JSONObject = { 'bar': 'baz' };
        let a3: JSONObject = { 'baz': 'qux' };
        let a4: JSONObject = null;
        let b1 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b1',
          command: 'c1',
          args: a1
        });
        let b2 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b2',
          command: 'c1',
          args: a2
        });
        let b3 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b3',
          command: 'c1',
          args: a3
        });
        let b4 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b4',
          command: 'c2',
          args: a4
        });
        expect(keymap.findKeyBinding('c1', a1).selector).to.be('.b1');
        expect(keymap.findKeyBinding('c1', a2).selector).to.be('.b2');
        expect(keymap.findKeyBinding('c1', a3).selector).to.be('.b3');
        expect(keymap.findKeyBinding('c2', a4).selector).to.be('.b4');
        b1.dispose();
        b2.dispose();
        b3.dispose();
        b4.dispose();
        c1.dispose();
        c2.dispose();
      });

      it('should remove a binding when disposed', () => {
        let node = createElement();
        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        binding.dispose();
        expect(called).to.be(false);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should emit a binding changed signal when added and removed', () => {
        let node = createElement();
        let added = false;
        let command = commands.addCommand('test', { execute: () => { } });
        let handler = (sender: any, args: any) => {
          added = (args as KeymapManager.IBindingChangedArgs).type === 'added';
        };
        keymap.bindingChanged.connect(handler);
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        expect(added).to.be(true);
        binding.dispose();
        expect(added).to.be(false);
        keymap.bindingChanged.disconnect(handler);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should throw an error if binding has an invalid selector', () => {
        let command = commands.addCommand('test', { execute: () => { } });
        let options = { keys: ['Ctrl ;'], selector: '..', command: 'test' };
        expect(() => { keymap.addBinding(options); }).to.throwError();
        command.dispose();
      });

    });

  });

});
