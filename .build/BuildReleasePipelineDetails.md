## Kubeflow Task Build and Release Pipeline

This pipeline was created to run tests, and package and publish the extensions within this repository. For more information on any tasks used here and more, visit https://github.com/microsoft/azure-pipelines-tasks/tree/master/Tasks or https://github.com/microsoft/azure-devops-extension-tasks/tree/master/BuildTasks.

### Code Quality Stage Tasks

- **TFX Installer:** Ensures that the tfx cli is installed on the agent. This will allow you to query, package, and publish your extensions.
- **NPM:** This task runs twice, and installs the node dependencies for both tasks. This task can be used to run a variety of npm scripts. To use custom scripts, add scripts to the package.json file.
- **Bash:** Configured to compile Javascript files for both tasks. This task can be used for anything that can be done in your bash CLI.
- **NPM:** This task runs twice, and runs unit tests for both tasks.
- **Publish Test Results:** Publishes the test results regardless of pass or fail. For this to work, you will need to ensure that your test script includes some way of reporting the tests, such as outputting an xml file.

### Build Manifest Files

- **TFX Installer:** Ensures that the tfx cli is installed on the agent.
- **NPM:** This task runs twice, and installs the node dependencies for both tasks.
- **Bash:** Configured to compile Javascript files for both tasks.
- **Query Azure DevOps Extension Version:** Retrieves the current version of the run task from the marketplace. This task is used to get the version of whichever extension you need in the Visual Studio Marketplace: https://marketplace.visualstudio.com/.
- **Package Azure DevOps Extension:** Increments the version, and packages the run task into a .vsix file. This task is able to increase the version of your extension, and/or it is used to package your extension into a single manifest file.
- **Query Azure DevOps Extension Version:** Retrieves the current version of the upload task from the marketplace.
- **Package Azure DevOps Extension:** Increments the version, and packages the upload task into a .vsix file.
- **Copy Files:** Copies both packaged extensions into the Build.ArtifactStagingDirectory. This task is used to copy any files currently available in the repository, to anywhere else in the repository, or variable directories. All predifined pipeline variables can be found here: https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml. 
- **Publish Build Artifacts:** Publish both extension artifacts together as ExtensionFiles. This task allows you to publish files into artifacts that can be used by other pipelines, other pipeline stages, or manually by you. If there are multiple files that need to be published, they can all be published in a new folder created by this task.

### Publish Extensions

- **TFX Installer:** Ensures that the tfx cli is installed on the agent.
- **Download Build Artifact:** Downloads the ExtensionFiles artifact. This task can get build artifacts from any other pipeline or pipeline stage, and make those artifacts available for use in the current pipeline or pipeline stage that it is run in.
- **Publish Azure DevOps Extension:** Publishes the extensions on the marketplace with the incremented version. This task uses an extension manifest file to publish your extension on the Visual Studio Marketplace. The version of the new manifest file must be higher than the current version of the extension on the marketplace for this task to work.