import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import * as rest from "typed-rest-client";
import * as HttpC from "typed-rest-client/HttpClient";
import{request, OutgoingHttpHeaders} from "http";
import FormData from "form-data";
import { IAllPipeline, IAllPipelineVersion, IAllExperiment } from "../operations/interfaces";

export class RunMock {
    public endpointUrl: string;
    public runName: string;
    public pipeline: string;
    public pipelineVersion: string;
    public pipelineParams: string;
    public description: string;
    // public waitForRunToFinish: boolean;
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

    constructor(endpointUrl: string, runName: string, pipeline: string, pipelineVersion: string, pipelineParams: string,
        experiment: string, experimentName: string, description?: string, bearerToken?: string) {
            this.endpointUrl = endpointUrl;
            this.runName = runName;
            this.pipeline = pipeline;
            this.pipelineVersion = pipelineVersion;
            this.pipelineParams = pipelineParams;
            this.experiment = experiment;
            this.experimentName = experimentName;
            this.description = description!;
            this.bearerToken = bearerToken!;
            this.runType = 'One-Off';
            this.getAllRunsEndpoint = 'pipeline/apis/v1beta1/runs';
            this.getAllPipelinesEndpoint = 'pipeline/apis/v1beta1/pipelines';
            this.getAllVersionsEndpoint = 'pipeline/apis/v1beta1/pipeline_versions';
            this.getAllExperimentsEndpoint = 'pipeline/apis/v1beta1/experiments';
            this.pipelineID = '';
            this.pipelineVersionID = '';
            this.experimentID = '';
            this.runID = '';
            this.restAPIClient = new rest.RestClient('agent');
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

    public async validatePipeline() {
        try {
            var pipelineID = await this.getPipelineID();
            if(pipelineID != 'Not a valid id.' && pipelineID != '') {
                this.pipelineID = pipelineID;
                return true;
            }
            else{
                return false;
            }
        }
        catch(error) {
            return false;
        }
    }

    public async validatePipelineVersion() {
        try {
            var versionID = await this.getPipelineVersionID();
            console.log(versionID);
            if(versionID != 'Not a valid id.' && versionID != '') {
                this.pipelineVersionID = versionID;
                return true;
            }
            else {
                return false;
            }
        }
        catch(error) {
            return false;
        }
    }

    public async validateExperimentName() {
        try {
            if(this.experiment == 'createNewExperiment') {
                this.experimentID = await this.getExperimentID();
                return true;
            }
            else {
                var experimentID = await this.getExperimentID();
                if(experimentID != 'Not a valid id.' && experimentID != '') {
                    this.experimentID = experimentID;
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        catch(error) {
            return false;
        }
    }

    public async validatePipelineParams() {
        try {
            if(this.pipelineParams == '') {
                return true;
            }
            JSON.parse(this.pipelineParams);
            return true;
        }
        catch(error) {
            return false;
        }
    }

    public async runValidations() {
        try {
            if(!await this.validateEndpointUrl) {
                return false;
            }
            if(!await this.validatePipeline()) {
                return false;            
            }
            if(!await this.validatePipelineVersion()) {
                return false;           
            }
            if(!await this.validateExperimentName()) {
                return false;           
            }
            if(!await this.validatePipelineParams()) {
                return false;            
            }
            return true;
        }
        catch(error) {
            return false;
        }
    }

    public async getPipelineID(): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.pipeline}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var webRequest = await this.restAPIClient.get<IAllPipeline>(url, options)!;
            if(webRequest.result != null) {
                if(webRequest.result.pipelines[0].id != undefined) {
                    return webRequest.result.pipelines[0].id;
                }
                return 'Not a valid id.';
            }
            return 'Not a valid id.';
        }
        catch(error) {
            return 'Not a valid id.';
        }
    }

    public async getPipelineVersionID(): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllVersionsEndpoint}?resource_key.type=PIPELINE&resource_key.id=${this.pipelineID}&filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.pipelineVersion}"}]}`;
            console.log(url);
            url = encodeURI(url);
            console.log(url);
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var webRequest = await this.restAPIClient.get<IAllPipelineVersion>(url, options)!;
            if(webRequest.result != null) {
                var versions = webRequest.result.versions;
                if(versions != undefined) {
                    for(var i = 0; i < versions.length; i++) {
                        if(versions[i].name == this.pipelineVersion) {
                            console.log(versions[i].name);
                            console.log(this.pipelineVersion);
                            return versions[i].id;
                        }
                    }
                    return 'Not a valid id.';
                }
                return 'Not a valid id.';
            }
            return 'Not a valid id.';
        }
        catch(error) {
            return 'Not a valid id.';
        }
    }

    public async getExperimentID(): Promise<string> {
        try {
            var url = `${this.endpointUrl}${this.getAllExperimentsEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.experimentName}"}]}`;
            url = encodeURI(url);
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var webRequest = await this.restAPIClient.get<IAllExperiment>(url, options)!;
            if(webRequest.result != null) {
                var experiments = webRequest.result.experiments;
                if(experiments[0].id != undefined) {
                    return experiments[0].id;
                }
                return 'Not a valid id.';
            }
            return 'Not a valid id.';
        }
        catch(error) {
            return 'Not a valid id.';
        }
    }
}