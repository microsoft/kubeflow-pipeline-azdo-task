import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import * as rest from "typed-rest-client";
import * as HttpC from "typed-rest-client/HttpClient";
import{request, OutgoingHttpHeaders} from "http";
import FormData from "form-data";
import { IAllPipeline, IUploadPipeline, IAllPipelineVersion } from "../operations/interfaces";

export class UploadPipelineMock implements IUploadPipeline {
    public pipelineTask: string;
    public pipelineFilePath: string;
    // public newPipelineName: string;
    // public existingPipelineName: string;
    // public versionName: string;
    // public pipelineID: string;
    public maxFileSizeBytes: number;

    constructor(pipelineTask: string, pipelineFilePath: string) {
        this.pipelineTask = pipelineTask;
        this.pipelineFilePath = pipelineFilePath;
        // this.newPipelineName = newPipelineName;
        // this.existingPipelineName = existingPipelineName;
        // this.versionName = versionName;
        // this.pipelineID = '';
        this.maxFileSizeBytes = 32000000;
    }

    public async validatePipelineFilePath() {
        try {
            if(fs.statSync(this.pipelineFilePath).isFile()) {
                if(this.pipelineFilePath.substring(this.pipelineFilePath.length - 7, this.pipelineFilePath.length) == '.tar.gz') {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validatePipelineFileSizePass() {
        try {
            const stats = fs.statSync(this.pipelineFilePath);
            const fileSizeInBytes = stats.size;
            if(fileSizeInBytes > this.maxFileSizeBytes) {
                return false;
            }
            return true;
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validatePipelineFileSizeFail() {
        try {
            const stats = fs.statSync(this.pipelineFilePath);
            const fileSizeInBytes = stats.size;
            if(fileSizeInBytes > 32) {
                return false;
            }
            return true;
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async runValidations() {
        try {
            if(!await this.validatePipelineFilePath()) {return false;}
            if(!await this.validatePipelineFileSizePass()) {return false;}
            return true;
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }
}