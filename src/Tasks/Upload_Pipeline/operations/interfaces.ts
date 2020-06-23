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

export interface IUploadPipeline {
    pipelineTask: string;
    pipelineFilePath: string;
}