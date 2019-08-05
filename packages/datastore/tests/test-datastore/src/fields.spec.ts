/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  Fields, ListField, MapField, RegisterField, TextField
} from '@phosphor/datastore';

type FieldType = number;
let value: FieldType = 11;

describe('@phosphor/datastore', () => {

  describe('Fields', () => {

    describe('Boolean', () => {

      it('should create a boolean register field', () => {
        let field = Fields.Boolean();
        expect(field).to.be.instanceof(RegisterField);
        expect(typeof(field.value)).to.equal("boolean");
      });

      it('should default to false', () => {
        let field = Fields.Boolean();
        expect(field.value).to.be.false;
      });

    });

    describe('Number', () => {

      it('should create a number register field', () => {
        let field = Fields.Number();
        expect(field).to.be.instanceof(RegisterField);
        expect(typeof(field.value)).to.equal("number");
      });

      it('should default to zero', () => {
        let field = Fields.Number();
        expect(field.value).to.equal(0);
      });

    });

    describe('String', () => {

      it('should create a string register field', () => {
        let field = Fields.String();
        expect(field).to.be.instanceof(RegisterField);
        expect(typeof(field.value)).to.equal("string");
      });

      it('should default to an empty string', () => {
        let field = Fields.String();
        expect(field.value).to.equal('');
      });

    });

    describe('List', () => {

      it('should create a list field', () => {
        let field = Fields.List<FieldType>();
        expect(field).to.be.instanceof(ListField);
      });

    });

    describe('Map', () => {

      it('should create a map field', () => {
        let field = Fields.Map<FieldType>();
        expect(field).to.be.instanceof(MapField);
      });

    });

    describe('Register', () => {

      it('should create a register field', () => {
        let field = Fields.Register<FieldType>({ value });
        expect(field).to.be.instanceof(RegisterField);
        expect(typeof(field.value)).to.equal(typeof(value));
      });

      it('should default to the provided initial value', () => {
        let field = Fields.Register<FieldType>({ value });
        expect(field.value).to.equal(value);
      });

    });

    describe('Text', () => {

      it('should create a text field', () => {
        let field = Fields.Text();
        expect(field).to.be.instanceof(TextField);
      });

    });

  });

});
