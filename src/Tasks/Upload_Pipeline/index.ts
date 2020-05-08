import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import { UploadPipeline } from "./operations/UploadPipeline"

async function run() {
    try {
        var UP = new UploadPipeline();
        if(await UP.runValidations() == true) {
            if(UP.pipelineTask == 'uploadNew') {
                await UP.uploadNewPipeline();
            }
            else {
                await UP.uploadNewPipelineVersion();
            }
        }
        else {
            throw new Error('Validations failed.');
        }
    }
    catch(error) {
        task.setResult(task.TaskResult.Failed, error.message);
    }
}

run();