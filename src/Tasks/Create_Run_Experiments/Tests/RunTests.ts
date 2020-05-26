import { RunMock } from "./RunMock";
import 'mocha';
import { async } from "q";
var assert = require('assert');
var fs = require('fs');

var Run = new RunMock('http://52.149.62.186/', 'newRun', 'testPipeline', 'testPipeline', 
    '[{"name":"resource_group", "value":"kubeflow-integration-rg"}, {"name":"workspace", "value":"kubeflow-integration-aml"}]', 
    'useExistingExperiment', 'testExperiment');

describe('All validations pass', async function() {
    it('should return true saying that validations have passed', async function() {
        assert.equal(await Run.runValidations(), true);
        Promise.resolve();
    });
});

describe('Validate existing pipeline name', async function() {
    it('should fail saying that the pipeline name does not exist', async function() {
        Run.pipeline = 'not an existing pipeline';
        assert.equal(await Run.validatePipeline(), false);
        Promise.resolve();
    });
    it('should pass saying that the pipeline name exists', async function() {
        Run.pipeline = 'testPipeline';
        assert.equal(await Run.validatePipeline(), true);
        Promise.resolve();
    });
});

describe('Validate existing pipeline version name', async function() {
    it('should pass saying that the pipeline version name exists', async function() {
        assert.equal(await Run.validatePipelineVersion(), true);
        Promise.resolve();
    });
    it('should fail saying that the pipeline version name does not exist', async function() {
        Run.pipelineVersion = 'versionDoesNotExist';
        assert.equal(await Run.validatePipelineVersion(), false);
        Promise.resolve();
    });
});

describe('Validate existing experiment name', async function() {
    it('should pass saying that the experiment name exists', async function() {
        assert.equal(await Run.validateExperimentName(), true);
        Promise.resolve();
    });
    it('should fail saying that the experiment name does not exist', async function() {
        Run.experimentName = 'not an existing experiment';
        assert.equal(await Run.validateExperimentName(), false);
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
        Run.pipelineParams = 'these are not valid pipeline parameters at all, but they are of proper length';
        assert.equal(await Run.validatePipelineParams(), false);
        Promise.resolve();
    });
});

describe('Validate endoint url', async function() {
    it('should pass saying that the endpoint url is valid', async function() {
        assert.equal(await Run.validateEndpointUrl(), true);
        Promise.resolve();
    });
    it('should fail saying that the endpoint url is not valid', async function() {
        Run.endpointUrl = 'not a valid endpoint';
        assert.equal(await Run.validateEndpointUrl(), false);
        Promise.resolve();
    });
});

describe('All validations fail', async function() {
    it('should return false saying that validations have failed', async function() {
        assert.equal(await Run.runValidations(), false);
        Promise.resolve();
    });
});