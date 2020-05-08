# Kubeflow Pipeline Uploader

<p>This task will allow you to upload an ML pipeline to your Kubeflow workspace. The task utilizes the Kubeflow API to validate user input and upload new pipelines to Kubeflow.</p>

# Fields
- **Kubeflow Endpoint:** This is the base url of your Kubeflow workspace in *http://your_URL_here/* format.
- **Bearer Token:** The bearer token is used only if you have bearer authentication on your Kubeflow workspace. If you do not include this field, and have bearer authentication, then this task will not be able to access your workspace.
- **Kubeflow Pipeline Task:** This field allows you to choose which task you would like to perform. Currently the only option is to upload a new Kubeflow pipeline.
- **Pipeline Path:** This is the path that your .tar.gz pipeline file is located in your repository. The maximum file size is 32MB.
- **Pipeline Name:** This is the name that you would like to give the new pipeline.