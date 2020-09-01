import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import * as rest from "typed-rest-client";
import * as HttpC from "typed-rest-client/HttpClient";
import { request, OutgoingHttpHeaders } from "http";
import FormData from "form-data";
import { IAllPipeline } from "./interfaces";
import { IUploadPipeline, IAllPipelineVersion } from "./interfaces";
import { IRequestOptions } from "typed-rest-client/Interfaces";
import { pipeline } from "stream";

export class UploadPipeline implements IUploadPipeline {
    public endpointUrl: string;
    public getAllPipelinesEndpoint: string;
    public getAllVersionsEndpoint: string;
    private bearerToken: string;
    public pipelineTask: string;
    public pipelineFilePath: string;
    public newPipelineName: string | undefined;
    public newPipelineDescription: string | undefined;
    public existingPipelineName: string | undefined;
    public versionName: string | undefined;
    public pipelineID: string;
    public restAPIClient: rest.RestClient;
    public maxFileSizeBytes: number;

    constructor() {
        this.endpointUrl = task.getInput('kubeflowEndpoint', true)!;
        // strip trailing backslash
        this.endpointUrl = this.endpointUrl.replace(/\/$/,"");
        this.getAllPipelinesEndpoint = '/pipeline/apis/v1beta1/pipelines';
        this.getAllVersionsEndpoint = '/pipeline/apis/v1beta1/pipeline_versions';
        this.bearerToken = task.getInput('bearerToken', false)!;
        this.pipelineTask = task.getInput('kubeflowPipelineTask', true)!;
        this.pipelineFilePath = task.getInput('pipelineFilePath', true)!;
        this.newPipelineName = task.getInput('newPipelineName', false)!;
        this.newPipelineDescription = task.getInput('newPipelineDescription', false)!;
        this.existingPipelineName = task.getInput('existingPipelineName', false)!;
        this.versionName = task.getInput('versionName', false)!;
        this.pipelineID = '';
        this.restAPIClient = new rest.RestClient('agent');
        this.maxFileSizeBytes = 32000000;
    }

    public async validateEndpointUrl() {
        try {
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Validating endpoint url ${this.endpointUrl}`);
            var req = await this.restAPIClient.get(this.endpointUrl, options);
            if (req.statusCode == 200) {
                return true;
            }
            return false;
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public validatePipelineFilePath() {
        try {
            if (fs.statSync(this.pipelineFilePath).isFile()) {
                if (this.pipelineFilePath.substring(this.pipelineFilePath.length - 7, this.pipelineFilePath.length) == '.tar.gz') {
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
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public validatePipelineFileSize() {
        try {
            const stats = fs.statSync(this.pipelineFilePath);
            const fileSizeInBytes = stats.size;
            task.debug(`file size is ${fileSizeInBytes} bytes`);
            if (fileSizeInBytes > this.maxFileSizeBytes) {
                return false
            }
            return true;
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validateNewPipelineName() {
        try {
            if (this.newPipelineName == undefined || this.newPipelineName == '') {
                return false;
            }
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.newPipelineName}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Validating pipeline name from ${url}`);
            var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            if (webRequest.result != null) {
                if (webRequest.result.pipelines != undefined) {
                    for (var PL of webRequest.result.pipelines) {
                        if (PL.name == this.newPipelineName) {
                            task.error("Pipeline name already exists. You must choose an original pipeline name.");
                            return false;
                        }
                    }
                    task.setVariable('kf_pipeline_name', this.newPipelineName);
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
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validateExistingPipelineName() {
        try {
            if (this.existingPipelineName == undefined || this.existingPipelineName == '') {
                return false;
            }
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.existingPipelineName}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Validating pipeline name from ${url}`);
            var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            if (webRequest.result != null) {
                if (webRequest.result.pipelines != undefined) {
                    for (var PL of webRequest.result.pipelines!) {
                        if (PL.name == this.existingPipelineName) {
                            this.pipelineID = PL.id;
                            task.setVariable('kf_pipeline_name', PL.name);
                            task.setVariable('kf_pipeline_id', PL.id);
                            return true;
                        }
                    }
                    task.error("Pipeline name does not exist. To upload a new version of the existing pipeline, please provide existing pipeline name");
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
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async runValidations() {
        try {
            if (!await this.validateEndpointUrl()) {
                throw new Error('Endpoint Url must be a valid url.');
            }
            if (!this.validatePipelineFilePath()) {
                throw new Error('File path must be valid and end with the .tar.gz extension.');
            }
            if (!this.validatePipelineFileSize()) {
                throw new Error('File size cannot exceed 32MB.');
            }
            if (this.pipelineTask == 'uploadNew') {
                if (!await this.validateNewPipelineName()) {
                    throw new Error('Error validating pipeline name.');
                }
            }
            else if (this.pipelineTask == 'uploadNewVersion') {
                if (!await this.validateExistingPipelineName()) {
                    throw new Error('Error validating existing pipeline name.');
                }
            }
            return true;
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    // To post a new pipeline you have to pipe a file payload as form data and add the name onto the url as a string
    public async uploadNewPipeline() {
        try {
            var uploadFile = fs.createReadStream(this.pipelineFilePath);
            var form: FormData = new FormData();
            form.append('uploadfile', uploadFile);
            var reqHost = new URL(this.endpointUrl).host;

            var reqHeaders = form.getHeaders({ 'authorization': `Bearer ${this.bearerToken}` });
            await this.newPLPostRequest(reqHeaders, reqHost, form);
            await this.wait(5000);
            var pipelineID = await this.getPipelineID(this.newPipelineName);
            if (pipelineID == 'Not a valid pipeline id.') {
                throw new Error('Existing pipeline not found. Check endpoint url. Either choose an new pipeline name or create a new version.');
            }
            console.log(`\nThe new pipeline's ID is: ${pipelineID}`);
            console.log(`New pipeline can be viewed at: ${this.endpointUrl}_/pipeline/#/pipelines/details/${pipelineID}`);
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async newPLPostRequest(reqHeaders: OutgoingHttpHeaders, reqHost: string, form: FormData) {
        var path = encodeURI(`${this.getAllPipelinesEndpoint}/upload?name=${this.newPipelineName}&description=${this.newPipelineDescription}`)
        task.debug(`Posting pipeline request to ${this.endpointUrl}${path}`);
        var req = request(
            {
                host: reqHost,
                path: path,
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
                catch (error) {
                    task.setResult(task.TaskResult.Failed, `${error.message} Make sure that your endpoint is correct, and that you are using the correct bearer token, if neccessary.`);
                }
            }
        );
        form.pipe(req);
    }

    // To post a new version you have to pipe a file payload as form data and add the name and pipeline id onto the url as a string
    public async uploadNewPipelineVersion() {
        try {
            var uploadFile = fs.createReadStream(this.pipelineFilePath);
            var form: FormData = new FormData();
            form.append('uploadfile', uploadFile);
            var reqHost = new URL(this.endpointUrl).host;
            var existingPLID = await this.getPipelineID(this.existingPipelineName);
            if (existingPLID == 'Not a valid pipeline id.') {
                throw new Error('Existing pipeline not found. Check endpoint url. Either choose an existing pipeline or create a new pipeline.');
            }

            var reqHeaders = form.getHeaders({ 'authorization': `Bearer ${this.bearerToken}` });
            await this.newVersionPostRequest(reqHeaders, reqHost, form, existingPLID);
            await this.wait(5000);
            var versionID = await this.getPipelineVersionID(existingPLID);
            if (versionID == 'Not a valid version id.') {
                throw new Error('Existing version not found. Check endpoint url and bearer token.');
            }
            console.log(`\nThe new pipeline version's ID is: ${versionID}`);
            console.log(`New pipeline version can be viewed at: ${this.endpointUrl}_/pipeline/#/pipelines/details/${this.pipelineID}/version/${versionID}`);
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async getPipelineID(pipelineName: string | undefined): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${pipelineName}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            if (webRequest.result != null) {
                var pipelines = webRequest.result.pipelines;
                if (pipelines[0].id != undefined) {
                    task.setVariable('kf_pipeline_id', pipelines[0].id);
                    return pipelines[0].id;
                }
                console.log('Pipeline not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid pipeline id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid pipeline id.';
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Not a valid pipeline id.';
        }
    }

    public async newVersionPostRequest(reqHeaders: OutgoingHttpHeaders, reqHost: string, form: FormData, existingPLID: string) {
        var path = encodeURI(`${this.getAllPipelinesEndpoint}/upload_version?name=${this.versionName}&pipelineid=${existingPLID}`);
        task.debug(`Posting pipeline version request to ${this.endpointUrl}${path}`);
        var req = request(
            {
                host: reqHost,
                path: path,
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
                catch (error) {
                    task.setResult(task.TaskResult.Failed, `${error.message} Make sure that your endpoint is correct, and that you are using the correct bearer token, if neccessary.`);
                }
            }
        );
        form.pipe(req);
    }

    public async getPipelineVersionID(pipelineID: string): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllVersionsEndpoint}?resource_key.type=PIPELINE&resource_key.id=${pipelineID}&filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.versionName}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get<IAllPipelineVersion>(url, options)!;
            if (webRequest.result != null) {
                var versions = webRequest.result.versions;
                if (versions != undefined) {
                    for (var i = 0; i < versions.length; i++) {
                        if (versions[i].name == this.versionName) {
                            task.setVariable('kf_pipeline_version_id', versions[i].id);
                            return versions[i].id;
                        }
                    }
                    return webRequest.result.versions[0].id;
                }
                console.log('Version not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid version id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid version id.';
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Not a valid version id.';
        }
    }

    public async wait(ms: number) {
        await new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}