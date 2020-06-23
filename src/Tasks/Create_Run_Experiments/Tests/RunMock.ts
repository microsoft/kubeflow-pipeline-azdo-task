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
    public pipelineParams: string;

    constructor(pipelineParams: string) {
            this.pipelineParams = pipelineParams;
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
            if(!await this.validatePipelineParams()) {
                return false;            
            }
            return true;
        }
        catch(error) {
            return false;
        }
    }

    
}