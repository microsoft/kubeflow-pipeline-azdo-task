# Kubeflow Pipelines Tasks

## What these tasks will fix/improve:

- They make it easier to automate Kubeflow pipeline creation, and running these pipelines.
- Each task outputs variables that can be used to retrieve your pipelines, runs, or experiments from Kubeflow.
- These tasks will provide a link to your new pipeline or run depending on the task used.

## Setup

In order to use these extensions for working with Kubeflow, you will need to install them to your Azure Devops organization from the Visual Studio Marketplace. The marketplace can be found here: [https://marketplace.visualstudio.com/](https://marketplace.visualstudio.com/).
The other thing that you will need, is a Kubeflow workspace. More informaion on creating a Kubeflow workspace can be found here: [https://www.kubeflow.org/docs/started/getting-started/](https://www.kubeflow.org/docs/started/getting-started/).

## Kubeflow Upload Pipeline
This task will allow you to upload an ML pipeline to your Kubeflow workspace. The task utilizes the Kubeflow API to validate user input and upload new pipelines and versions to Kubeflow. Below is what the UI looks like from an Azure DevOps pipeline.

![alt-text-1](/images/KubeflowUploadPipelineUI.png =200x400) ![alt-text-2](/images/KubeflowUploadVersionUI.png =200x400)

### Fields
- **Kubeflow Endpoint:** This is the base url of your Kubeflow workspace in *http://your_URL_here/* format.
- **Bearer Token:** The bearer token is used only if you have bearer authentication on your Kubeflow workspace. If you do not include this field, and have bearer authentication, then this task will not be able to access your workspace. Please make sure to use a secret variable with this field, in order to keep it secure.
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
- **kf_pipeline_version_id:** The ID of the newly created pipeline version, if a new version was uploaded.
- **kf_pipeline_version_name:** The name of the newly created pipeline version, if a new version was uploaded.

## Kubeflow Experiment and Run

This task is used for creating and monitoring a new run. It also allows you to create a new experiment, if you do not want to use an existing one. This task utilizes the Kubeflow API to validate user input and create new runs and experiments on Kubeflow. Below are some examples of what the UI looks like for this task.

![alt-text-1](/images/KubeflowRunNewRunUI1.png =200x400) ![alt-text-2](/images/KubeflowRunNewRunUI2.png =200x400)
![alt-text-1](/images/KubeflowRunExperimentUI1.png =200x400) ![alt-text-2](/images/KubeflowRunExperimentUI2.png =200x400)

### Fields
- **Kubeflow Endpoint:** The base url of your Kubeflow workspace in *http://your_URL_here/* format.
- **Bearer Token:** The bearer token is used only if you have bearer authentication on your Kubeflow workspace. If you do not include this field, and have bearer authentication, then this task will not be able to access your workspace. Please make sure to use a secret variable with this field, in order to keep it secure.
- **Pipeline:** The name of the pipeline that you would like to use for your run.
- **Use Default Version:** If checked, this will use the default version of the pipeline that you have selected.
- **Pipeline Version:** The name of the version of the pipeline that you would like to use for your run.
- **Create New Pipeline Run:** If checked, this will allow you to make a new run.
- **Run Name:** The name of your new run. Does not have to be unique.
- **Pipeline Params:** The parameters you would like to pass the pipeline in JSON object array format, without the square brackets *{"name":"resource_group", "value":"your-rg"}, {"name":"workspace", "value":"your-workspace"}*. This field is not required, however depending on your workspace, the task could fail if you do not provide values.
- **Description:** This field is optional. Provides a description for your run.
- **Wait for run to complete:** If checked, this field will allow the task to monitor the run until completion. It will update the status every 15 seconds.
- **Experiment:** This field allows you to either create a new experiment or use an existing experiment.
- **Experiment Name:** The name of the experiment you would like your run to use. If the experiment field is set to create a new experiment, this name will need to be unique.
- **Description:** The optional description of a new experiment. Does not apply to existing experiments.

### Outputs
- **kf_pipeline_id:** The ID of the pipeline being used.
- **kf_pipeline_version_id:** The ID of the pipeline version being used.
- **kf_experiment_id:** The ID of the experiment, whether newly created, or pre-existing.
- **kf_run_id:** The ID of the new run. Only available if you choose to create a new run.
- **kf_run_status:** The end status of the run. Only available if you choose to create a new run, and wait for the run to complete.

## Kubeflow Experiment Run Async

This task is very similar to the Experiment and run task. The difference is that this task is used on serverless tasks, and does not require an agent to run. This task also does not allow you to create a new experiment, just a new run on an existing experiment. Below is an example of what the UI for this task looks like.

![alt-text-1](/images/KubeflowRunAsyncUI.png =200x400)

### Fields
- **Kubeflow Endpoint:** The base url of your Kubeflow workspace in *http://your_URL_here/* format.
- **Bearer Token:** The bearer token is used only if you have bearer authentication on your Kubeflow workspace. If you do not include this field, and have bearer authentication, then this task will not be able to access your workspace. Please make sure to use a secret variable with this field, in order to keep it secure.
- **Pipeline Version ID:** The ID of the pipeline version that you would like to use for your run.
- **Experiment ID:** The ID of the experiment that you would like to group your run with.
- **Run Name:** The name of your new run. Does not have to be unique.
- **Pipeline Params:** The parameters you would like to pass the pipeline in JSON object array format, without the square brackets *{"name":"resource_group", "value":"your-rg"}, {"name":"workspace", "value":"your-workspace"}*. This field is not required, however depending on your workspace, the task could fail if you do not provide values.
- **Description:** The optional description of your run.
- **Wait For Completion:** Waits for the run to complete and sends additional pipeline parameter (azdocallbackinfo) with callback details.
- **Headers:** This is for getting callback information.