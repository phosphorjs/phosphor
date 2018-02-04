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
  Token
} from '@phosphor/coreutils';


interface ITestInterface {
  foo: number;
  bar: string;
}


describe('@phosphor/coreutils', () => {

  describe('Token', () => {

    describe('#constructor', () => {

      it('should accept a name for the token', () => {
        let token = new Token<ITestInterface>('ITestInterface');
        expect(token).to.be.an.instanceof(Token);
      });

    });

    describe('#name', () => {

      it('should be the name for the token', () => {
        let token = new Token<ITestInterface>('ITestInterface');
        expect(token.name).to.equal('ITestInterface');
      });

    });

  });

});
