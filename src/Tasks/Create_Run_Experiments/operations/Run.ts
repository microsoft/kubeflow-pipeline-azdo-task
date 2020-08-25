import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import * as rest from "typed-rest-client";
import { request, OutgoingHttpHeaders } from "http";
import { IAllRun, IAllPipeline, IAllExperiment, IAllPipelineVersion, ISingleRun } from "./interfaces"

export class Run {
    public endpointUrl: string;
    public runName: string;
    public pipeline: string;
    public useDefaultVersion: boolean;
    public pipelineVersion: string;
    public pipelineParams: string;
    public description: string;
    public waitForRunToFinish: boolean;
    public createNewRun: boolean;
    public experiment: string;
    public experimentName: string;
    public runType: string;
    public getAllRunsEndpoint: string;
    public getAllPipelinesEndpoint: string;
    public getAllVersionsEndpoint: string;
    public getAllExperimentsEndpoint: string;
    public pipelineID: string;
    public pipelineVersionID: string;
    public experimentID: string;
    public runID: string;
    public restAPIClient: rest.RestClient;
    private bearerToken: string;

    constructor() {
        this.endpointUrl = task.getInput('KubeflowEndpoint', true)!;
        // strip trailing backslash
        this.endpointUrl = this.endpointUrl.replace(/\/$/,"");
        this.runName = task.getInput('runName', false)!;
        this.pipeline = task.getInput('pipeline', false)!;
        this.useDefaultVersion = task.getBoolInput('useDefaultVersion', false)!;
        this.createNewRun = task.getBoolInput('createNewRun', true);
        if (this.useDefaultVersion == true) {
            this.pipelineVersion = this.pipeline;
        }
        else {
            this.pipelineVersion = task.getInput('pipelineVersion', false)!;
        }
        this.pipelineParams = task.getInput('pipelineParams', false)!;
        this.description = task.getInput('runDescription', false)!;
        this.waitForRunToFinish = task.getBoolInput('waitForRunToFinish', false);
        this.experiment = task.getInput('experiment', true)!;
        this.experimentName = task.getInput('experimentName', true)!;
        this.runType = 'One-Off';
        this.getAllRunsEndpoint = '/pipeline/apis/v1beta1/runs';
        this.getAllPipelinesEndpoint = '/pipeline/apis/v1beta1/pipelines';
        this.getAllVersionsEndpoint = '/pipeline/apis/v1beta1/pipeline_versions';
        this.getAllExperimentsEndpoint = '/pipeline/apis/v1beta1/experiments';
        this.pipelineID = '';
        this.pipelineVersionID = '';
        this.experimentID = '';
        this.runID = '';
        this.restAPIClient = new rest.RestClient('agent');
        this.bearerToken = task.getInput('bearerToken', false)!;
    }

    public async validateEndpointUrl() {
        try {
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
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

    public async validatePipeline() {
        try {
            if(this.pipeline == undefined && this.createNewRun == false) {
                return true;
            }
            else {
                var pipelineID = await this.getPipelineID();
                if (pipelineID != 'Not a valid pipeline id.') {
                    this.pipelineID = pipelineID;
                    task.setVariable("kf_pipeline_id", this.pipelineID);
                    return true;
                }
                else {
                    return false;
                }
            }  
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validatePipelineVersion() {
        try {
            if(this.pipelineVersion == undefined && this.createNewRun == false) {
                return true;
            }
            else {
                var versionID = await this.getPipelineVersionID();
                if (versionID != 'Not a valid version id.') {
                    this.pipelineVersionID = versionID;
                    task.setVariable("kf_pipeline_version_id", this.pipelineVersionID);
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validateExperimentName() {
        try {
            if (this.experiment == 'createNewExperiment') {
                this.experimentID = await this.getExperimentID();
                return true;
            }
            else {
                var experimentID = await this.getExperimentID();
                if (experimentID != 'Not a valid experiment id.') {
                    this.experimentID = experimentID;
                    task.setVariable("kf_experiment_id", this.experimentID);
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async validatePipelineParams() {
        try {
            if (this.pipelineParams == '' || this.pipelineParams == undefined) {
                return true;
            }
            JSON.parse(`[${this.pipelineParams}]`);
            return true;
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, `Pipeline Params is not a valid json object array. ${error.message}`);
        }
    }

    public async runValidations() {
        try {
            if (!await this.validateEndpointUrl) {
                throw new Error('Endpoint Url must be a valid Url.');
            }
            if (!await this.validatePipeline()) {
                throw new Error('Pipeline not found. Please make sure you are using an existing pipeline from your Kubeflow workspace.');
            }
            if (!await this.validatePipelineVersion()) {
                throw new Error('Pipeline version not found. Please make sure you are using an existing pipeline version from your Kubeflow workspace.');
            }
            if (!await this.validateExperimentName()) {
                throw new Error('Experiment not found. Please make sure you are using an existing experiment from your Kubeflow workspace.');
            }
            if(this.createNewRun) {
                if(!await this.validatePipelineParams()) {
                    throw new Error('Pipeline Params must be a valid json object array.');
                }
            }
            return true;
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    // The payload that posting a new run takes follows this format as a string: {name: string, description: string,
    // pipeline_spec: {parameters: [{}]}, resource_references: [{key: {id: string, type: EXPERIMENT}, relationship: OWNER},
    // {key: {id: string, type: PIPELINE_VERSION}, relationship: CREATOR}]}
    public async createRun() {
        try {
            if (this.pipelineParams == '' || this.pipelineParams == undefined) {
                var form = `{"name": "${this.runName}", "description": "${this.description}",
                "pipeline_spec": {"parameters": []},
                "resource_references": [{"key": {"id": "${this.experimentID}", "type": "EXPERIMENT"}, "relationship": "OWNER"},
                {"key": {"id": "${this.pipelineVersionID}", "type": "PIPELINE_VERSION"}, "relationship": "CREATOR"}]}`;
            }
            else {
                var form = `{"name": "${this.runName}", "description": "${this.description}", 
                "pipeline_spec": {"parameters": [${this.pipelineParams}]},
                "resource_references": [{"key": {"id": "${this.experimentID}", "type": "EXPERIMENT"}, "relationship": "OWNER"},
                {"key": {"id": "${this.pipelineVersionID}", "type": "PIPELINE_VERSION"}, "relationship": "CREATOR"}]}`;
            }

            var reqHost = new URL(this.endpointUrl).host;
            var reqHeaders = {
                'authorization': `Bearer ${this.bearerToken}`,
                'content-type': 'application/json'
            }
            await this.postRequest(reqHost, form, reqHeaders);
            await this.wait(10000);
            var runID = await this.getRunID();
            if (runID != 'Not a valid run id.') {
                this.runID = runID;
                task.setVariable("kf_run_id", this.runID);
                console.log(`The new run can be viewed at: ${this.endpointUrl}/_/pipeline/#/runs/details/${this.runID}`);
                console.log(`The new Runs ID is: ${this.runID}`);
            }
            else {
                throw new Error('Failed to retrieve ID of new run. Make sure you are using the correct endpoint, and that you are using the correct bearer token, if necessary.');
            }
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async postRequest(reqHost: string, form: string, reqHeaders: OutgoingHttpHeaders) {
        try {
            task.debug(`Posting run request to ${this.endpointUrl}${this.getAllRunsEndpoint}`);
            var req = request(
                {
                    host: reqHost,
                    path: `${this.getAllRunsEndpoint}`,
                    method: 'POST',
                    headers: reqHeaders,
                },
                response => {
                    try {
                        response.on('data', d => {
                            process.stdout.write(d);
                        });
                        console.log(`Response returned with status code ${response.statusCode}: ${response.statusMessage}`);
                    }
                    catch (error) {
                        task.setResult(task.TaskResult.Failed, `${error.message} Make sure that your endpoint is correct, and that you are using the correct bearer token, if neccessary.`);
                    }
                }
            );
            req.write(form);
            req.end();
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async monitorRun() {
        try {
            var status = '';
            while (true) {
                status = await this.getRunStatus();
                var date = new Date();
                console.log(`Time: ${date.toTimeString().split(' ')[0]}   Status: ${status}`);
                if (status == 'Succeeded') {
                    console.log('Succeeded');
                    task.setVariable('kf_run_status', status);
                    return;
                }
                else if (status == 'Failed') {
                    task.setVariable('kf_run_status', status);
                    throw new Error('Run has failed.');
                }
                await this.wait(15000);
            }
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async wait(ms: number) {
        await new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    public async getRunID() {
        try {
            var url = `${this.endpointUrl}${this.getAllRunsEndpoint}?resource_key.type=PIPELINE_VERSION&resource_key.id=${this.pipelineVersionID}&filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.runName}"}]}&sort_by=created_at desc`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Getting run id from ${url}`);
            var webRequest = await this.restAPIClient.get<IAllRun>(url, options)!;
            if (webRequest.result != null) {
                if (webRequest.result.runs[0].id != undefined) {
                    return webRequest.result.runs[0].id;
                }
                console.log('Run not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid run id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid run id.';
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Could not determine run id.';
        }
    }

    public async getRunStatus() {
        try {
            var url = `${this.endpointUrl}${this.getAllRunsEndpoint}/${this.runID}`;
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Getting run status from ${url}`);
            var webRequest = await this.restAPIClient.get<ISingleRun>(url, options)!;
            if (webRequest.result != null) {
                if (webRequest.result.run.status != undefined) {
                    return webRequest.result.run.status;
                }
                return 'Not a valid status.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Could not determine run status.';
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Could not determine run status.';
        }
    }

    public async getPipelineID(): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.pipeline}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Getting pipeline id from ${url}`);
            var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            if (webRequest.result != null) {
                if (webRequest.result.pipelines[0].id != undefined) {
                    return webRequest.result.pipelines[0].id;
                }
                console.log('Pipeline not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid pipeline id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid pipeline id.';
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Could not determine pipeline id.';
        }
    }

    public async getPipelineVersionID(): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllVersionsEndpoint}?page_size=100&resource_key.type=PIPELINE_VERSION&resource_key.id=${this.pipelineID}&filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.pipelineVersion}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Getting pipeline version id from ${url}`);
            var webRequest = await this.restAPIClient.get<IAllPipelineVersion>(url, options)!;
            if (webRequest.result != null) {
                var versions = webRequest.result.versions;
                if (versions != undefined) {
                    for (var i = 0; i < versions.length; i++) {
                        if (versions[i].name == this.pipelineVersion) {
                            return versions[i].id;
                        }
                    }
                    console.log('Pipeline version not found. Make sure your endpoint and/or bearer token are correct.');
                    return 'Not a valid version id.';
                }
                console.log('Pipeline version not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid version id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Could not determine version id.';
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Could not determine version id.';
        }
    }

    public async getExperimentID(): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllExperimentsEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.experimentName}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            task.debug(`Getting experiment id from ${url}`);
            var webRequest = await this.restAPIClient.get<IAllExperiment>(url, options)!;
            if (webRequest.result != null) {
                var experiments = webRequest.result.experiments;
                if (experiments[0].id != undefined) {
                    return experiments[0].id;
                }
                console.log('Experiment not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid experiment id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Could not determine experiment id.';
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
            return 'Could not determine experiment id.';
        }
    }
}