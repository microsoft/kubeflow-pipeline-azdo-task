import { RunMock } from "./RunMock";
import 'mocha';
import { async } from "q";
var assert = require('assert');
var fs = require('fs');

var Run = new RunMock('[{"name":"resource_group", "value":"kubeflow-integration-rg"}, {"name":"workspace", "value":"kubeflow-integration-aml"}]');

describe('All validations pass', async function() {
    it('should return true saying that validations have passed', async function() {
        assert.equal(await Run.runValidations(), true);
        Promise.resolve();
    });
});

describe('Validate pipeline parameters', async function() {
    it('should pass saying that the pipeline parameters are valid', async function() {
        assert.equal(await Run.validatePipelineParams(), true);
        Promise.resolve();
    });
    it('should pass saying that the empty pipeline parameters are valid', async function() {
        Run.pipelineParams = '';
        assert.equal(await Run.validatePipelineParams(), true);
        Promise.resolve();
    });
    it('should fail saying that the pipeline parameters are not valid', async function() {
        Run.pipelineParams = 'these are not valid pipeline parameters at all';
        assert.equal(await Run.validatePipelineParams(), false);
        Promise.resolve();
    });
});

describe('All validations fail', async function() {
    it('should return false saying that validations have failed', async function() {
        assert.equal(await Run.runValidations(), false);
        Promise.resolve();
    });
});