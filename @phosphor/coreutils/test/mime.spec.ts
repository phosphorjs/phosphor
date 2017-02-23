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
  MimeData
} from '@phosphor/coreutils';


describe('@phosphor/coreutils', () => {

  describe('MimeData', () => {

    describe('#types()', () => {

      it('should get an array of the MIME types contained within the dataset', () => {
        let data = new MimeData();
        data.setData('foo', 1);
        data.setData('bar', '1');
        data.setData('baz', { foo: 1, bar: 2 });
        expect(data.types()).to.deep.equal(['foo', 'bar', 'baz']);
      });

      it('should be in order of insertion', () => {
        let data = new MimeData();
        data.setData('a', 1);
        data.setData('b', '1');
        data.setData('c', { foo: 1, bar: 2 });
        data.setData('a', 4);
        expect(data.types()).to.deep.equal(['b', 'c', 'a']);
        data.setData('d', null);
        expect(data.types()).to.deep.equal(['b', 'c', 'a', 'd']);
      });

    });

    describe('#hasData()', () => {

      it('should return `true` if the dataset contains the value', () => {
        let data = new MimeData();
        data.setData('foo', 1);
        expect(data.hasData('foo')).to.equal(true);
      });

      it('should return `false` if the dataset does not contain the value', () => {
        let data = new MimeData();
        data.setData('foo', 1);
        expect(data.hasData('bar')).to.equal(false);
      });

    });

    describe('#getData()', () => {

      it('should get the value for the given MIME type', () => {
        let data = new MimeData();
        let value = { foo: 1, bar: '10' };
        data.setData('baz', value);
        expect(data.getData('baz')).to.equal(value);
      });

      it('should return `undefined` if the dataset does not contain a value for the type', () => {
        let data = new MimeData();
        expect(data.getData('foo')).to.equal(undefined);
      });

    });

    describe('#setData()', () => {

      it('should set the data value for the given MIME type', () => {
        let data = new MimeData();
        let value = { foo: 1, bar: '10' };
        data.setData('baz', value);
        expect(data.getData('baz')).to.equal(value);
      });

      it('should overwrite any previous entry for the MIME type', () => {
        let data = new MimeData();
        data.setData('foo', 1);
        data.setData('foo', 2);
        expect(data.getData('foo')).to.equal(2);
      });

    });

    describe('#clearData()', () => {

      it('should remove the data entry for the given MIME type', () => {
        let data = new MimeData();
        data.setData('foo', 1);
        data.clearData('foo');
        expect(data.getData('foo')).to.equal(undefined);
      });

      it('should be a no-op if there is no entry for the given MIME type', () => {
        let data = new MimeData();
        data.clearData('foo');
        expect(data.getData('foo')).to.equal(undefined);
      });

    });

    describe('#clear()', () => {

      it('should remove all entries from the dataset', () => {
        let data = new MimeData();
        data.setData('foo', 1);
        data.setData('bar', '1');
        data.setData('baz', { foo: 1, bar: 2 });
        data.clear();
        expect(data.types()).to.deep.equal([]);
      });

    });

  });

});
