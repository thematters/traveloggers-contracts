import fs from "fs";
import { task, types } from "hardhat/config";

import { getTraveloggersContract, getTaskInputs, writeJSON } from "../utils";

const taskName = "mint:batch";

task(taskName, "Batch mint NFTs to given addresses")
  .addOptionalParam(
    "inputs",
    "path of input file which contains address list",
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

    if (!inputs.addresses || inputs.addresses.length === 0) {
      throw new Error(
        `[${network}:${taskName}] Input file ${inputsFilePath} has no addresses`
      );
    }

    // run task
    try {
      const tx = await traveloggers.batchMint(inputs.addresses);

      const balances: { [key: string]: any } = {};
      for (const address of inputs.addresses) {
        balances[address] = await traveloggers.balanceOf(address);
      }

      inputs.txHash = tx.hash;
      inputs.balances = balances;
      inputs.run = true;
      inputs.error = null;

      console.log(`[${network}:${taskName}] Finish running task "${taskName}"`);
    } catch (error) {
      inputs.error = (error as Error).message || (error as Error).toString();
      console.log(`[${network}:${taskName}] Failed to run task "${taskName}"`);
      console.error(error);
    }

    // write back to file
    writeJSON(inputs, inputsFilePath);
  });
