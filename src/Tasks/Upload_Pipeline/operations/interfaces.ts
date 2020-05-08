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

export interface IUploadPipeline {
    endpointUrl: string;
    getAllPipelinesEndpoint: string;
    pipelineTask: string;
    pipelineFilePath: string;
    newPipelineName: string;
    existingPipelineName: string;
    versionName: string;
}