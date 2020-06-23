# Build and Release Azure DevOps Custom Task to Marketplace

In this article learn how to create a functional build and release pipeline for your Azure DevOps custom task. This will allow you to publish your pipeline extension to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/).

## Prerequisites

To begin creating a build and release pipeline, you will need the following:

- An Azure DevOps organization. For more info on creating one, visit [Create an organization](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/create-organization?view=azure-devops).

- A project on your organization that you upload your code to. For help creating a project, visit [Create a project](https://docs.microsoft.com/en-us/azure/devops/organizations/projects/create-project?view=azure-devops&tabs=preview-page).

- An extension to build and release to the marketplace. For help creating an Azure DevOps custom task, visit [Add a task](https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-build-task?view=azure-devops).

- Some knowledge of using the YAML language in Azure DevOps pipelines. To learn more about YAML, visit [YAML schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema%2Cparameter-schema).

- For a list of predefined variables, such as $(System.DefaultWorkingDirectory), please visit [Use predefined variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml).

## Pipeline Building

- Step 1: Setup
- Step 2: Task Steps
- Step 3: Stages and Jobs

## Step 1: Setup

- From within your project, select the 'Pipelines' tab.
- Select 'New Pipeline'
- Select the location of your code repository. If your code is on your Azure project, select 'Azure Repos Git'.
- Next, select your repository.
- Then select 'Starter pipeline'.

Your new pipeline should then look something like this:

![New Pipeline](/images/ReleasePLDoc/NewBasePL.png =600x300)

- If you don't want your pipeline to run every time that a change to master is made, you can change the trigger from master to none.
- Make sure to select 'Save and run' to finish creating your pipeline.

## Step 2: Task Steps

- Remove all of the generated tasks below the 'steps' tag.
- Open the 'Show assistant' tab on the right side of the page. This window displays all of the available tasks that can be used on your pipeline.
- The first task to add is the 'Use Node CLI for Azure DevOps (tfx-cli)'. This will install the tfx-cli onto your build agent. This is installed to ensure that some of the later tasks don't run into any deprecation issues.

### Installing Node modules, and Compiling Javascript

- Add the 'npm' task. Make sure to use the install command, and to target the folder with your package.json. Inputs:
    - Command: install
    - Working folder that contains package.json: $(System.DefaultWorkingDirectory)/yourTaskDirectory
- Next add the 'Bash' task. This will be used to compile the Typescript into Javascript. Inputs:
    - Type: inline
    - Script: Should look something like:
    ```
    cd 'yourTaskDirectory'
    tsc
    ```

The following image is an example of the installation and compiling tasks:

![Dependancy Tasks](/images/ReleasePLDoc/DependancySteps.png =600x300)

### Running Unit tests (Optional)

For help setting up unit tests, visit [Unit tests](https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-build-task?view=azure-devops#step-2-unit-test-your-task-scripts).

- To run unit tests, add a custom script to your package.json, similar to:
```
"scripts": {
    "testScript": "mocha ./yourTestFile --reporter xunit --reporter-option output=yourResultsFile.xml"
},
```
- This will require the 'npm' task again. Make sure to select 'custom' command, target the folder with your tests, and input testScript as the command. Inputs:
    - Command: custom
    - Working folder that contains package.json: $(System.DefaultWorkingDirectory)/yourTestsDirectory
    - Command and arguments: testScript
- Next add the 'Publish Test Results' task. Ensure that the result format is 'JUnit' and not 'XUnit', if using the Mocha XUnit reporter. Also set the search folder to the root directory. Inputs:
    - Test result format: JUnit
    - Test results files: **/yourResultsFile.xml
    - Search folder: $(System.DefaultWorkingDirectory)

The following image is an example of the unit testing tasks:

![Unit Test Tasks](/images/ReleasePLDoc/UnitTestStep.png =450x200)

### Packaging and Publishing

For some of these tasks you will need a Visual Studio Marketplace service connection. Make sure to grant access permissions for all pipleines. For more information on creating a service extension, visit [Service connections](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops&tabs=yaml).

- The first task for publishing the extension is the 'Query Extension Version' task. For this you will need the following inputs:
    - Connect to: Visual Studio Marketplace
    - Visual Studio Marketplace (Service connection): yourServiceConnection
    - Publisher ID: ID of your Visual Studio Marketplace publisher
    - Extension ID: ID of your extension in your vss-extension.json file
    - Increase version: Patch
    - Output Variable: Task.Extension.Version
- The next task is the 'Package Extension' task. Inputs:
    - Root manifests folder: $(System.DefualtWorkingDirectory) _this is the root directory_
    - Manifest file(s): vss-extension.json 
    - Publisher ID: ID of your Visual Studio Marketplace publisher
    - Extension ID: ID of your extension in your vss-extension.json file
    - Extension Name: Name of your extension in your vss-extension.json file
    - Extension Version: $(Task.Extension.Version)
    - Override tasks version: checked (true)
    - Override Type: Replace Only Patch (1.0.r)
    - Extension Visibility: If you are still developing your extension, this should be set to private. This way only you and those your share the extension with can see it on the marketplace. If you are releasing the extension to the public, this should be set to public.
- The last task you will need is the 'Publish Extension' task. Inputs:
    - Connect to: Visual Studio Marketplace
    - Visual Studio Marketplace connection: yourServiceConnection
    - Input file type: VSIX file
    - VSIX file: /yourPublisher.*.vsix
    - Publisher ID: ID of your Visual Studio Marketplace publisher
    - Extension ID: ID of your extension in your vss-extension.json file
    - Extension Name: Name of your extension in your vss-extension.json file
    - Extension visibility: Your choice of private or public.

The following image is an example of the packaging and publishing tasks:

![Package Publish Tasks](/images/ReleasePLDoc/PackagePublishStep.png =600x500)

## Step 3: Stages and Jobs

To learn how to setup the structure of using multiple stages and jobs in one pipeline, visit [YAML schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema%2Cparameter-schema).

An important note to keep in mind when using multiple stages and jobs, is that each job uses a new user agent. This means that when a new job starts, anything installed on the previous jobs agent is gone. This includes dependancies, pipeline generated files, and compiled files.

To use the same dependancies across multiple jobs, you will need to reinstall them on each job that they are needed.The compiled files will need to be recompiled each time they are needed as well. 

To use pipeline generated files, you will need to publish the files as artifacts, and download the artifacts on the later jobs that require those files. This can be done with the following tasks:

- This first task is optional, but makes it easier to locate and publish multiple files. This is the 'Copy files' task. Inputs:
    - Contents: All of the files that you would like to copy in order to publish them into an artifact.
    - Target folder: The folder that the files will all be copied to. A good choice for this would be the                                 $(Build.ArtifactStagingDirectory).
- The task for publishing the artifacts is 'Publish build artifacts'. This will publish your artifacts for use in other jobs, or pipelines. Inputs:
    - Path to publish: The path to the folder that contains the files you are publishing. For example, the                                $(Build.ArtifactStagingDirectory).
    - Artifact name: The name you would like to give your artifact.
    - Arifact publish location: Pick 'Azure Pipelines' to use the artifact in future jobs.
- To download the artifacts onto a new job, use the 'Download build artifacts' task.
    - Download artifacts produced by: If downloading the artifact on a new job from the same pipeline, pick 'Current build', if downloading  on a new pipeline, pick 'Specific build'.
    - Download type: Choose 'Specific artifact' to download all files that were published.
    - Artifact name: The name that you gave your artifact when it was published.
    - Destination directory: The folder where you would like the files to be downloaded.

The following image is an example of these tasks, and the structure for multi-stage pipelines:

![MultiStage Tasks](/images/ReleasePLDoc/MultiStageDesign.png =600x450)
