import { ExperimentMock } from "./ExperimentMock";
import 'mocha';
import { async } from "q";
var assert = require('assert');
var fs = require('fs');

var Exp = new ExperimentMock('http://52.149.62.186/', 'RandomUnusedName');

describe('Run all validations pass', async function() {
    it('should return true saying validations passed', async function() {
        assert.equal(await Exp.runValidations(), true);
        Promise.resolve();
    });
});

describe('Validate experiment name', async function() {
    it('should return true saying that the name is unique', async function() {
        assert.equal(await Exp.validateName(), true);
        Promise.resolve();
    });
    it('should return false saying that the name is not unique', async function() {
        Exp.name = 'testExperiment';
        assert.equal(await Exp.validateName(), false);
        Promise.resolve();
    });
});

describe('Validate endpoint url', async function() {
    it('should return true saying that the url exists', async function() {
        assert.equal(await Exp.validateEndpointUrl(), true);
        Promise.resolve();
    });
    it('should return false saying that the url does not exist', async function() {
        Exp.endpointUrl = 'not a valid endpoint';
        assert.equal(await Exp.validateEndpointUrl(), false);
        Promise.resolve();
    });
});

describe('Run all validations fail', async function() {
    it('should return false saying validations failed', async function() {
        assert.equal(await Exp.runValidations(), false);
        Promise.resolve();
    });
});
