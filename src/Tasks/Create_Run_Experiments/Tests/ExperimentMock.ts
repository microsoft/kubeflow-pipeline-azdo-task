import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import * as rest from "typed-rest-client";
import{request, OutgoingHttpHeaders} from "http";
import FormData from "form-data";
import { IAllExperiment } from "../operations/interfaces";

export class ExperimentMock {
    public endpointUrl: string;
    public name: string;
    public description: string;
    public getAllExperimentsEndpoint: string;
    public restAPIClient: rest.RestClient;
    private bearerToken: string;

    constructor(endpointUrl: string, name: string, description?: string, bearerToken?: string) {
        this.endpointUrl = endpointUrl;
        this.name = name;
        this.description = description!;
        this.getAllExperimentsEndpoint = 'pipeline/apis/v1beta1/experiments';
        this.restAPIClient = new rest.RestClient('agent');
        this.bearerToken = bearerToken!;
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

    public async validateName() {
        try {
            var url = `${this.endpointUrl}${this.getAllExperimentsEndpoint}`;
            var options: rest.IRequestOptions = {additionalHeaders: {'authorization': `Bearer ${this.bearerToken}`}};
            var webRequest = await this.restAPIClient.get<IAllExperiment>(url, options)!;
            if(webRequest.result != null) {
                if(webRequest.result.experiments != undefined){
                    for(var exp of webRequest.result.experiments) {
                        if(exp.name == this.name) {
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
                return false;
            }
        } 
        catch(error) {
            return false;
        }
    }

    public async runValidations() {
        try {
            if(!await this.validateEndpointUrl()) {
                return false;
            }
            if(!await this.validateName()) {
                return false;
            }
            return true;
        }
        catch(error) {
            return false;
        }
    }
}