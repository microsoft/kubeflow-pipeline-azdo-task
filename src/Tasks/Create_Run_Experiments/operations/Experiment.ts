import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import * as rest from "typed-rest-client";
import { request, OutgoingHttpHeaders } from "http";
import FormData from "form-data";
import { IAllExperiment } from "./interfaces"

export class Experiment {
    public endpointUrl: string;
    public name: string;
    public description: string;
    public getAllExperimentsEndpoint: string;
    public restAPIClient: rest.RestClient;
    private bearerToken: string;

    constructor() {
        this.endpointUrl = task.getInput('kubeflowEndpoint', true)!;
        this.name = task.getInput('experimentName', true)!;
        this.description = task.getInput('experimentDescription', false)!;
        this.getAllExperimentsEndpoint = 'pipeline/apis/v1beta1/experiments';
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

    public async validateName() {
        try {
            var url = `${this.endpointUrl}${this.getAllExperimentsEndpoint}`;
            var options: rest.IRequestOptions = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get<IAllExperiment>(url, options)!;
            if (webRequest.result != null) {
                if (webRequest.result.experiments != undefined) {
                    for (var exp of webRequest.result.experiments) {
                        if (exp.name == this.name) {
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
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async runValidations() {
        try {
            if (!await this.validateEndpointUrl()) {
                throw new Error('Endpoint Url must be a valid Url.')
            }
            if (!await this.validateName()) {
                throw new Error('Experiment name field is either empty, or experiment name is already in use.');
            }
            return true;
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    //The payload that posting a new experiment takes follows this format as a string: {name: string, description: string}
    public async createExperiment() {
        try {
            if (this.description == undefined || this.description == null) {
                var form: string = JSON.stringify({ "name": this.name });
            }
            else {
                var form: string = JSON.stringify({ "name": this.name, "description": this.description });
            }
            var reqHost = this.endpointUrl.substring(7, this.endpointUrl.length - 1);

            var reqHeaders = {
                'authorization': `Bearer ${this.bearerToken}`,
                'content-type': 'application/json'
            }
            await this.postRequest(reqHost, form, reqHeaders);
        }
        catch (error) {
            task.setResult(task.TaskResult.Failed, error.message);
        }
    }

    public async postRequest(reqHost: string, form: string, reqHeaders: OutgoingHttpHeaders) {
        var req = request(
            {
                host: reqHost,
                path: `/${this.getAllExperimentsEndpoint}`,
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
        req.write(form);
        req.end();
    }
}