export interface IExperiment {
    id: string,
    name: string,
    description: string,
    created_at: Date,
    // resource_references: [{key: {}, relationship: string}];
}

export interface IAllExperiment {
    experiments: IExperiment[]
}

export interface IRun {
    id: string,
    name: string,
    description: string,
    created_at: Date,
    status: string;
}

export interface ISingleRun {
    run: IRun;
}

export interface IAllRun {
    runs: IRun[]
}

export interface IPipeline {
    id: string;
    created_at: Date;
    name: string;
    description: string;
    parameters: [];
    default_version: Object;
}

export interface IAllPipeline {
    pipelines: IPipeline[]; 
}

export interface IPipelineVersion {
    id: string;
    created_at: Date;
    name: string;
    parameters: [];
    resource_references: [{key: {}, relationship: string}];
}

export interface IAllPipelineVersion {
    versions: IPipelineVersion[]; 
}