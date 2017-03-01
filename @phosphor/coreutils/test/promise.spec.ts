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
  PromiseDelegate
} from '@phosphor/coreutils';


describe('@phosphor/coreutils', () => {

  describe('PromiseDelegate', () => {

    describe('#constructor()', () => {

      it('should create a new promise delegate', () => {
        let delegate = new PromiseDelegate<number>();
        expect(delegate).to.be.an.instanceof(PromiseDelegate);
      });

    });

    describe('#promise', () => {

      it('should get the underlying promise', () => {
        let delegate = new PromiseDelegate<number>();
        expect(delegate.promise).to.be.an.instanceof(Promise);
      });

    });

    describe('#resolve()', () => {

      it('should resolve the underlying promise', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.then(value => {
          expect(value).to.equal(1);
          done();
        });
        delegate.resolve(1);
      });

      it('should accept a promise to the value', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.then(value => {
          expect(value).to.equal(4);
          done();
        });
        delegate.resolve(Promise.resolve(4));
      });

    });

    describe('#reject()', () => {

      it('should reject the underlying promise', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.catch(reason => {
          expect(reason).to.equal('foo');
          done();
        });
        delegate.reject('foo');
      });

    });

  });

});
