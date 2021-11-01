import { task, types } from "hardhat/config";

import { getTraveloggersContract, getTaskInputs, writeJSON } from "../utils";

const taskName = "set:preOrder";

task(taskName, "Set pre-order state")
  .addOptionalParam(
    "inputs",
    "path of input file which contains pre-order options",
    null,
    types.inputFile
  )
  .setAction(async ({ inputs: inputsFilePath }, hardhat) => {
    const network = hardhat.network.name;

    console.log(`[${network}:${taskName}] Running task`);

    // get contract
    const traveloggers = await getTraveloggersContract({ network, hardhat });

    // read input file
    const { inputs } = await getTaskInputs({
      taskName,
      inputsFilePath,
      network,
    });

    if (inputs.run) {
      throw new Error(
        `[${network}:${taskName}] ${inputsFilePath} has been run`
      );
    }

    if (
      !Object.prototype.hasOwnProperty.call(inputs, "start") ||
      !inputs.amount ||
      !inputs.supply
    ) {
      throw new Error(
        `[${network}:${taskName}] Input file ${inputsFilePath} needs parameter "start", "amount" and "supply"`
      );
    }

    // run task
    try {
      const tx = await traveloggers.setInPreOrder(
        inputs.start,
        inputs.amount,
        inputs.supply
      );

      inputs.txHash = tx.hash;
      inputs.run = true;
      inputs.error = null;

      console.log(`[${network}:${taskName}] Finish running task "${taskName}"`);
    } catch (error) {
      inputs.error = (error as Error).message || (error as Error).toString();
      console.log(`[${network}:${taskName}] Failed to run task "${taskName}"`);
      console.error(error);
    }

    // write back to file
    writeJSON({ ...inputs, ranAt: new Date() }, inputsFilePath);
  });
