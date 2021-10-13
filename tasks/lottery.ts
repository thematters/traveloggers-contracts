import fs from "fs";
import { task, types } from "hardhat/config";

import { getMattyContract, getTaskInputs } from "./utils";

const taskName = "mint:lottery";

task(taskName, "Random draw lottery winners and mint NFTs by given addresses")
  .addOptionalParam(
    "inputs",
    "path of input file which contains address list",
    null,
    types.inputFile
  )
  .setAction(async ({ inputs: inputsFilePath }, hardhat) => {
    const network = hardhat.network.name;

    console.log(`Running task "${taskName}" on ${network}`);

    // get contract
    const matty = await getMattyContract({ network, hardhat });

    // read input file
    const { inputs } = await getTaskInputs({
      taskName,
      inputsFilePath,
      network,
    });

    if (!inputs.addresses || inputs.addresses.length === 0) {
      throw new Error(`Input file ${inputsFilePath} has no addresses`);
    }
    if (!inputs.amount || typeof inputs.amount !== "number") {
      throw new Error(`Input file ${inputsFilePath} has no amount or invalid`);
    }

    // run task
    try {
      const tx = await matty.drawLottery(inputs.addresses, inputs.amount);

      // get winners from emitted event
      const logs = await matty.queryFilter(matty.filters.LotteryWinners());
      const { winners } = logs[0].args;

      inputs.winners = winners;
      inputs.txHash = tx.hash;
      inputs.run = true;
      inputs.error = null;

      console.log(`Finish running task "${taskName}" on ${network}`);
    } catch (error) {
      inputs.error = (error as Error).message || (error as Error).toString();
      console.log(`Failed to run task "${taskName}" on ${network}`);
      console.error(error);
    }

    // write back to file
    fs.writeFileSync(inputsFilePath, JSON.stringify(inputs, null, 2));
  });
