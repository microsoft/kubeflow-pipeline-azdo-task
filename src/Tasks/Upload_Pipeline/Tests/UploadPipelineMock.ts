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
    public endpointUrl: string;
    public getAllPipelinesEndpoint: string;
    public getAllVersionsEndpoint: string;
    private bearerToken: string;
    public pipelineTask: string;
    public pipelineFilePath: string;
    public newPipelineName: string;
    public existingPipelineName: string;
    public versionName: string;
    public pipelineID: string;
    public restAPIClient: rest.RestClient;
    public maxFileSizeBytes: number;

    constructor(endpointUrl: string, pipelineTask: string, pipelineFilePath: string, 
        newPipelineName: string, existingPipelineName: string, versionName: string, bearerToken?: string) {
        this.endpointUrl = endpointUrl;
        this.getAllPipelinesEndpoint = 'pipeline/apis/v1beta1/pipelines';
        this.getAllVersionsEndpoint = 'pipeline/apis/v1beta1/pipeline_versions';
        this.pipelineTask = pipelineTask;
        this.pipelineFilePath = pipelineFilePath;
        this.newPipelineName = newPipelineName;
        this.existingPipelineName = existingPipelineName;
        this.versionName = versionName;
        this.pipelineID = '';
        this.bearerToken = bearerToken!;
        this.restAPIClient = new rest.RestClient('some-agent');
        this.maxFileSizeBytes = 32000000;
    }

    public async validateEndpointUrl() {
        try {
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var req = await this.restAPIClient.get(this.endpointUrl, options);
            if(req.statusCode == 200) {
                return true;
            }
            return false;
        }
        catch(error) {
            return false;
        }
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

    public async validateNewPipelineName() {
        try {
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}`;
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            if(webRequest.result != null) {
                if(webRequest.result.pipelines != undefined){
                    for(var PL of webRequest.result.pipelines) {
                        if(PL.name == this.newPipelineName) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return true;
                }
            }
            else {
                throw new Error('Request did not go through. Make sure your Url is valid, and that you have the correct bearer token, if needed.');
            }
        } 
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validateExistingPipelineName() {
        try {
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}`;
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            if(webRequest.result != null) {
                if(webRequest.result.pipelines != undefined){
                    for(var PL of webRequest.result.pipelines!) {
                        if(PL.name == this.existingPipelineName) {
                            this.pipelineID = PL.id;
                            return true;
                        }
                    }
                    return false;
                }
                else {
                    return false;
                }
            }
            else {
                throw new Error('Request did not go through. Make sure your Url is valid, and that you have the correct bearer token, if needed.');
            }
        } 
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validateNewVersionName() {
        try{
            var url = `${this.endpointUrl}${this.getAllVersionsEndpoint}?resource_key.type=PIPELINE&resource_key.id=${this.pipelineID}&filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.versionName}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var webRequest = await this.restAPIClient.get<IAllPipelineVersion>(url, options)!;
            if(webRequest.result != null) {
                var versions = webRequest.result.versions;
                if(versions != undefined) {
                    for(var i = 0; i < versions.length; i++) {
                        if(versions[i].name == this.versionName) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            }
            return false;
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async runValidations() {
        try {
            if(!await this.validateEndpointUrl()) {return false;}
            if(!await this.validatePipelineFilePath()) {return false;}
            if(!await this.validatePipelineFileSizePass()) {return false;}
            if(this.pipelineTask == 'uploadNew') {
                if(!await this.validateNewPipelineName()) {return false;}
            }
            else if(this.pipelineTask == 'uploadNewVersion') {
                if(!await this.validateExistingPipelineName()) {return false;}
            }
            return true;
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }
}