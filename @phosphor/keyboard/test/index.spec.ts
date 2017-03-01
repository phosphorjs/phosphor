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
  generate
} from 'simulate-event';

import {
  EN_US, KeycodeLayout, getKeyboardLayout, setKeyboardLayout
} from '@phosphor/keyboard';


describe('@phosphor/keyboard', () => {

  describe('getKeyboardLayout()', () => {

    it('should return the global keyboard layout', () => {
      expect(getKeyboardLayout()).to.equal(EN_US);
    });

  });

  describe('setKeyboardLayout()', () => {

    it('should set the global keyboard layout', () => {
      let layout = new KeycodeLayout('ab-cd', {});
      setKeyboardLayout(layout);
      expect(getKeyboardLayout()).to.equal(layout);
      setKeyboardLayout(EN_US);
      expect(getKeyboardLayout()).to.equal(EN_US);
    });

  });

  describe('KeycodeLayout', () => {

    describe('#constructor()', () => {

      it('should construct a new keycode layout', () => {
        let layout = new KeycodeLayout('ab-cd', {});
        expect(layout).to.be.an.instanceof(KeycodeLayout);
      });

    });

    describe('#name', () => {

      it('should be a human readable name of the layout', () => {
        let layout = new KeycodeLayout('ab-cd', {});
        expect(layout.name).to.equal('ab-cd');
      });

    });

    describe('#keys()', () => {

      it('should get an array of all key values supported by the layout', () => {
        let layout = new KeycodeLayout('ab-cd', { 100: 'F' });
        let keys = layout.keys();
        expect(keys.length).to.equal(1);
        expect(keys[0]).to.equal('F');
      });

    });

    describe('#isValidKey()', () => {

      it('should test whether the key is valid for the layout', () => {
        let layout = new KeycodeLayout('foo', { 100: 'F' });
        expect(layout.isValidKey('F')).to.equal(true);
        expect(layout.isValidKey('A')).to.equal(false);
      });

    });

    describe('#keyForKeydownEvent()', () => {

      it('should get the key for a `keydown` event', () => {
        let layout = new KeycodeLayout('foo', { 100: 'F' });
        let event = generate('keydown', { keyCode: 100 });
        let key = layout.keyForKeydownEvent(event as KeyboardEvent);
        expect(key).to.equal('F');
      });

      it('should return an empty string if the code is not valid', () => {
        let layout = new KeycodeLayout('foo', { 100: 'F' });
        let event = generate('keydown', { keyCode: 101 });
        let key = layout.keyForKeydownEvent(event as KeyboardEvent);
        expect(key).to.equal('');
      });

    });

    describe('.extractKeys()', () => {

      it('should extract the keys from a code map', () => {
        let keys: KeycodeLayout.CodeMap = { 70: 'F', 71: 'G', 72: 'H' };
        let goal: KeycodeLayout.KeySet = { 'F': true, 'G': true, 'H': true };
        expect(KeycodeLayout.extractKeys(keys)).to.deep.equal(goal);
      });

    });

  });

  describe('EN_US', () => {

    it('should be a keycode layout', () => {
      expect(EN_US).to.be.an.instanceof(KeycodeLayout);
    });

    it('should have standardized keys', () => {
      expect(EN_US.isValidKey('A')).to.equal(true);
      expect(EN_US.isValidKey('Z')).to.equal(true);
      expect(EN_US.isValidKey('0')).to.equal(true);
      expect(EN_US.isValidKey('a')).to.equal(false);
    });

  });

});
