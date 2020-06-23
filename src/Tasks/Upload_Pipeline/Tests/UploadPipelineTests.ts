import { UploadPipelineMock } from "./UploadPipelineMock";
import 'mocha';
import { async } from "q";
var assert = require('assert');
var fs = require('fs');

var UP = new UploadPipelineMock('uploadNew', '/home/vsts/work/1/s/src/Tasks/Upload_Pipeline/Tests/pipeline.py.tar.gz');

describe('Run All Validations Pass', async function() {
    it('should return true saying that all validations have passed', async function() {
        assert.equal(await UP.runValidations(), true);
        Promise.resolve();
    });
});

describe('File Path Validations', async function() {
    it('should return true saying that the file path is valid', async function() {
        assert.equal(await UP.validatePipelineFilePath(), true);
        Promise.resolve();
    });
    it('should return false saying that the file path is not valid', async function() {
        UP.pipelineFilePath = '/home/vsts/work/1/s/src/Tasks/Upload_Pipeline/index.js';
        assert.equal(await UP.validatePipelineFilePath(), false);
        Promise.resolve();
    });
});

describe('File Size Validations', async function() {
    it('should return true saying that the file size is valid', async function() {
        UP.pipelineFilePath = '/home/vsts/work/1/s/src/Tasks/Upload_Pipeline/Tests/pipeline.py.tar.gz';
        assert.equal(await UP.validatePipelineFileSizePass(), true);
        Promise.resolve();
    });
    it('should return false saying that the file size is too large', async function() {
        assert.equal(await UP.validatePipelineFileSizeFail(), false);
        Promise.resolve();
    });
});

describe('Run All Validations Fail', async function() {
    it('should return false saying that the validations have failed', async function() {
        UP.pipelineFilePath = '/home/vsts/work/1/s/src/Tasks/Upload_Pipeline/index.js';
        assert.equal(await UP.runValidations(), false);
        Promise.resolve();
    });
});