import { UploadPipelineMock } from "./UploadPipelineMock";
import 'mocha';
import { async } from "q";
var assert = require('assert');
var fs = require('fs');

var UP = new UploadPipelineMock('http://52.149.62.186/', 'uploadNew', 
                                '/home/vsts/work/1/s/src/Tasks/Upload_Pipeline/Tests/pipeline.py.tar.gz', //Azure DevOps Tests
                                // 'C:/users/v-ryzube/source/repos/kubeflow_azdo_task/src/Tasks/Upload_Pipeline/Tests/pipeline.py.tar.gz', //Local Tests
                                'newPLName', 'testPipeline', '12345');

describe('Run All Validations Pass', async function() {
    it('should return true saying that all validations have passed', async function() {
        assert.equal(await UP.runValidations(), true);
        Promise.resolve();
    });
});

describe('Endpoint Url Validations', async function() {
    it('should return true saying that the endpoint url is a valid url', async function() {
        assert.equal(await UP.validateEndpointUrl(), true);
        Promise.resolve();
    });
});

describe('File Path Validations', async function() {
    it('should return true saying that the file path is valid', async function() {
        assert.equal(await UP.validatePipelineFilePath(), true);
        Promise.resolve();
    });
    it('should return false saying that the file path is not valid', async function() {
        UP.pipelineFilePath = '/home/vsts/work/1/s/src/Tasks/Upload_Pipeline/index.js'; //Azure DevOps Tests
        // UP.pipelineFilePath = 'C:/users/v-ryzube/source/repos/kubeflow_azdo_task/src/Tasks/Upload_Pipeline/index.js'; //Local Tests
        assert.equal(await UP.validatePipelineFilePath(), false);
        Promise.resolve();
    });
});

describe('File Size Validations', async function() {
    it('should return true saying that the file size is valid', async function() {
        UP.pipelineFilePath = '/home/vsts/work/1/s/src/Tasks/Upload_Pipeline/Tests/pipeline.py.tar.gz'; //Azure DevOps Tests
        // UP.pipelineFilePath = 'C:/users/v-ryzube/source/repos/kubeflow_azdo_task/src/Tasks/Upload_Pipeline/Tests/pipeline.py.tar.gz'; //Local Tests
        assert.equal(await UP.validatePipelineFileSizePass(), true);
        Promise.resolve();
    });
    it('should return false saying that the file size is too large', async function() {
        assert.equal(await UP.validatePipelineFileSizeFail(), false);
        Promise.resolve();
    });
});

describe('New Pipeline Name Validations', async function() {
    it('should return true saying that the new pipeline name is not yet taken', async function() {
        assert.equal(await UP.validateNewPipelineName(), true);
        Promise.resolve();
    });
    it('should return false saying that the new pipleine name is already taken', async function() {
        UP.newPipelineName = 'testPipeline';
        assert.equal(await UP.validateNewPipelineName(), false);
        Promise.resolve();
    });
});

describe('Existing Pipeline Name Validations', async function() {
    it('should return true saying that the existing pipeline name is valid', async function() {
        assert.equal(await UP.validateExistingPipelineName(), true);
        Promise.resolve();
    });
    it('should return false saying that the existing pipleine name does not exist', async function() {
        UP.existingPipelineName = 'notYetExistingPL';
        assert.equal(await UP.validateExistingPipelineName(), false);
        Promise.resolve();
    });
});

describe('Run All Validations Fail', async function() {
    it('should return false saying that the validations have failed', async function() {
        assert.equal(await UP.runValidations(), false);
        Promise.resolve();
    });
});