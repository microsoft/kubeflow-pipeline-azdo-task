# Kubeflow Tasks for Azure Pipelines

## Setup

<p>In order to use these extensions for working with Kubeflow, you will need to install them to your Azure Devops organization from the Visual Studio Marketplace. The marketplace can be found here: https://marketplace.visualstudio.com/.
The other thing that you will need, is a Kubeflow workspace. More informaion on creating a workspace can be found here: https://www.kubeflow.org/docs/started/getting-started/.</p>

## Kubeflow Upload Pipeline
<p>This task will allow you to upload an ML pipeline to your Kubeflow workspace. The task utilizes the Kubeflow API to validate user input and upload new pipelines and versions to Kubeflow.</p>

### Fields
- **Kubeflow Endpoint:** This is the base url of your Kubeflow workspace in *http://your_URL_here/* format.
- **Bearer Token:** The bearer token is used only if you have bearer authentication on your Kubeflow workspace. If you do not include this field, and have bearer authentication, then this task will not be able to access your workspace.
- **Kubeflow Pipeline Task:** This field allows you to choose which task you would like to perform. You can either upload a pipeline, or a version of a pipeline.
- **Pipeline Path:** The path that your .tar.gz pipeline file is located in your repository. The maximum file size is 32MB.
#### New Pipeline Specific
- **New Pipeline Name:** The name that you would like to give the new pipeline, if you choose to make a new pipeline. Must be unique.
#### New Pipeline Version Specific
- **Existing Pipeline Name:** The name of the pipeline you would like to make a new version of.
- **Version Name:** The name that you would like to give the new pipeline versoin, if you choose to make a new version. Must be unique.

### Outputs
- **kf_pipeline_id:** The ID of the pipeline, whether the newly created, or pre-existing.
- **kf_pipeline_name:** The name of the pipeline, whether the newly created, or pre-existing.
- **kf_version_id:** The ID of the newly created pipeline version.
- **kf_version_name:** The name of the newly created pipeline version.

## Kubeflow Experiment and Run

<p>This task is used for creating and monitoring a new run. It also allows you to create a new experiment, if you do not want to use an existing one. This task utilizes the Kubeflow API to validate user input and create new runs and experiments on Kubeflow.</p>

### Fields
- **Kubeflow Endpoint:** The base url of your Kubeflow workspace in *http://your_URL_here/* format.
- **Bearer Token:** The bearer token is used only if you have bearer authentication on your Kubeflow workspace. If you do not include this field, and have bearer authentication, then this task will not be able to access your workspace.
- **Pipeline:** The name of the pipeline that you would like to use for your run.
- **Pipeline Version:** The name of the version of the pipeline that you would like to use for your run.
- **Run Name:** The name of your new run. Does not have to be unique.
- **Pipeline Params:** The parameters you would like to pass the pipeline in JSON object array format *[{"name":"resource_group", "value":"kubeflow-integration-rg"}, {"name":"workspace", "value":"kubeflow-integration-aml"}]*. Both resource_group and workspace are required, but other fields can be added.
- **Description:** This field is optional. Provides a description for your run.
- **Wait for run to complete:** If checked, this field will allow the task to monitor the run until completion. It will update the status every 15 seconds.
- **Experiment:** This field allows you to either create a new experiment or use an existing experiment.
- **Experiment Name:** The name of the experiment you would like your run to use. If the experiment field is set to create a new experiment, this name will need to be unique.
- **Description:** The optional description of a new experiment. Does not apply to existing experiments.

### Outputs
- **kf_pipeline_id:** The ID of the pipeline being used.
- **kf_version_id:** The ID of the pipeline version being used.
- **kf_experiment_id:** The ID of the experiment, whether newly created, or pre-existing.
- **kf_run_id:** The ID of the new run.
- **kf_run_status:** The end status of the run. Only available if you choose to wait for the run to complete.
