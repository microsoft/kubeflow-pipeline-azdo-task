import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import * as rest from "typed-rest-client";
import * as HttpC from "typed-rest-client/HttpClient";
import{request, OutgoingHttpHeaders} from "http";
import FormData from "form-data";
import { IAllPipeline } from "./interfaces";
import { IUploadPipeline } from "./interfaces";
import { IRequestOptions } from "typed-rest-client/Interfaces";

export class UploadPipeline implements IUploadPipeline {
    public endpointUrl: string;
    public getAllPipelinesEndpoint: string;
    private bearerToken: string;
    public pipelineTask: string;
    public pipelineFilePath: string;
    public newPipelineName: string;
    public existingPipelineName: string;
    public versionName: string;
    public restAPIClient: rest.RestClient;
    public maxFileSizeBytes: number;

    constructor() {
        this.endpointUrl = task.getInput('kubeflowEndpoint', true)!;
        this.getAllPipelinesEndpoint = 'pipeline/apis/v1beta1/pipelines';
        this.bearerToken = task.getInput('bearerToken', false)!;
        this.pipelineTask = task.getInput('kubeflowPipelineTask', true)!;
        this.pipelineFilePath = task.getInput('pipelineFilePath', true)!;
        this.newPipelineName = task.getInput('newPipelineName', true)!;
        this.existingPipelineName = task.getInput('existingPipelineName', true)!;
        this.versionName = task.getInput('versionName', true)!;
        this.restAPIClient = new rest.RestClient('some-agent');
        this.maxFileSizeBytes = 32000000;
    }

    public async validateEndpointUrl() {
        try {
            if(this.bearerToken == undefined || this.bearerToken == null) {
                var req = await this.restAPIClient.get(this.endpointUrl);
            }
            else {
                var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
                var req = await this.restAPIClient.get(this.endpointUrl, options);
            }
            if(req.statusCode == 200) {
                return true;
            }
            return false;
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
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

    public async validatePipelineFileSize() {
        try {
            const stats = fs.statSync(this.pipelineFilePath);
            const fileSizeInBytes = stats.size;
            // console.log(`Chosen file's size is ${fileSizeInBytes} Bytes.`);
            if(fileSizeInBytes > this.maxFileSizeBytes) {
                return false
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
            if(this.bearerToken == undefined || this.bearerToken == null) {
                var webRequest = await this.restAPIClient.get<IAllPipeline>(url)!;
            }
            else {
                var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
                var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            }
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
            if(this.bearerToken == undefined || this.bearerToken == null) {
                var webRequest = await this.restAPIClient.get<IAllPipeline>(url)!;
            }
            else {
                var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
                var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            }
            if(webRequest.result != null) {
                if(webRequest.result.pipelines != undefined){
                    for(var PL of webRequest.result.pipelines!) {
                        if(PL.name == this.existingPipelineName) {
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

    public async runValidations() {
        try {
            if(!await this.validateEndpointUrl()) {
                throw new Error('Endpoint Url must be a valid url.');
            }
            if(!await this.validatePipelineFilePath()) {
                throw new Error('File path must be valid and end with the .gz extension.');
            }
            if(!await this.validatePipelineFileSize()) {
                throw new Error('File size cannot exceed 32MB.');
            }
            if(this.pipelineTask == 'uploadNew') {
                if(!await this.validateNewPipelineName()) {
                    throw new Error('Pipeline name already exists. You must choose an original pipeline name.');
                }
            }
            else if(this.pipelineTask == 'uploadNewVersion') {
                if(!await this.validateExistingPipelineName()) {
                    throw new Error('Pipeline name does not yet exist. You must enter an existing pipeline name or choose to upload a new pipeline.');
                }
            }
            return true;
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async uploadNewPipeline() {
        try {
            var uploadFile = fs.createReadStream(this.pipelineFilePath);
            var form: FormData = new FormData();
            form.append('uploadfile', uploadFile);
            var reqHost = this.endpointUrl.substring(7, this.endpointUrl.length - 1);

            if(this.bearerToken == undefined || this.bearerToken == null) {
                await this.newPLPostRequest(form.getHeaders(), reqHost, form);
            }
            else {
                var reqHeaders = {
                    'content-type': 'multipart/form-data',
                    'authorization': `Bearer ${this.bearerToken}`
                }
                await this.newPLPostRequest(reqHeaders, reqHost, form);
            }
        }
        catch(error) {
            console.log(error.message);
            task.setResult(task.TaskResult.Failed, 'Failed to upload pipeline with the above error.');
        }
    }

    public async newPLPostRequest(reqHeaders: OutgoingHttpHeaders, reqHost: string, form: FormData) {
        var req = request(
            {
                host: reqHost,
                path: `/${this.getAllPipelinesEndpoint}/upload?name=${this.newPipelineName}`,
                method: 'POST',
                headers: reqHeaders,
            },
            response => {
                try {
                    response.on('data', d => {
                        process.stdout.write(d);
                    })
                    console.log(`Response returned with status code ${response.statusCode}: ${response.statusMessage}`);
                }
                catch(error) {
                    task.setResult(task.TaskResult.Failed, error.message);
                }
            }
        );
        form.pipe(req);
    }

    public async uploadNewPipelineVersion() {
        try {
            var uploadFile = fs.createReadStream(this.pipelineFilePath);
            var form: FormData = new FormData();
            form.append('uploadfile', uploadFile);
            var reqHost = this.endpointUrl.substring(7, this.endpointUrl.length - 1);
            var existingPLID = await this.getPipelineID();
            if(existingPLID == 'Not a valid id.') {
                throw new Error('Existing pipeline not found. Check endpoint url. Either choose an existing pipeline or create a new pipeline.');
            }

            if(this.bearerToken == undefined || this.bearerToken == null) {
                await this.newVersionPostRequest(form.getHeaders(), reqHost, form, existingPLID);
            }
            else {
                var reqHeaders = {
                    'content-type': 'multipart/form-data',
                    'authorization': `Bearer ${this.bearerToken}`
                }
                await this.newVersionPostRequest(reqHeaders, reqHost, form, existingPLID);
            }
        }
        catch(error) {
            console.log(error.message);
            task.setResult(task.TaskResult.Failed, 'Failed to upload new pipeline version with the above error.');
        }
    }

    public async getPipelineID(): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.existingPipelineName}"}]}`;
            url = encodeURI(url);
            if(this.bearerToken == undefined || this.bearerToken == null) {
                var webRequest = await this.restAPIClient.get<IAllPipeline>(url)!;
            }
            else {
                var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
                var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            }
            if(webRequest.result != null) {
                if(webRequest.result.pipelines[0].id != undefined) {
                    return webRequest.result.pipelines[0].id;
                }
                return 'Not a valid id.';
            }
            return 'Not a valid id.';
        }
        catch(error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Not a valid id.';
        }
    }

    public async newVersionPostRequest(reqHeaders: OutgoingHttpHeaders, reqHost: string, form: FormData, existingPLID: string) {
        var req = request(
            {
                host: reqHost,
                path: `/${this.getAllPipelinesEndpoint}/upload_version?name=${this.versionName}&pipelineid=${existingPLID}`,
                method: 'POST',
                headers: reqHeaders,
            },
            response => {
                try {
                    response.on('data', d => {
                        process.stdout.write(d);
                    })
                    console.log(`Response returned with status code ${response.statusCode}: ${response.statusMessage}`);
                }
                catch(error) {
                    task.setResult(task.TaskResult.Failed, error.message);
                }
            }
        );
        form.pipe(req);
    }
}