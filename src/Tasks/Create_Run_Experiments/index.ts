import path = require("path");
import fs = require("fs");
import task = require("azure-pipelines-task-lib/task");
import { Experiment } from "./operations/Experiment";
import { Run } from "./operations/Run";

async function run() {
    try {
        var RUN = new Run();
        if (RUN.experiment == 'createNewExperiment') {
            var EXP = new Experiment();
            if (await EXP.runValidations()) {
                await EXP.createExperiment();
            }
        }
        if (await RUN.runValidations()) {
            if (RUN.createNewRun) {

                await RUN.createRun();
                if (RUN.waitForRunToFinish == true) {
                    await RUN.monitorRun();
                }

            }
        }
    }
    catch (error) {
        task.setResult(task.TaskResult.Failed, error.message);
    }
}

run();