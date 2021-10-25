import { task } from "hardhat/config";

import {
  getTraveloggersContract,
  ContractStatePath,
  ContractState,
} from "../utils";

const taskName = "set:baseURI";

task(taskName, "Set shared base URI for token and contract metadata").setAction(
  async (_, hardhat) => {
    const network = hardhat.network.name;

    console.log(`[${network}:${taskName}] Running task`);

    // get contract
    const traveloggers = await getTraveloggersContract({ network, hardhat });

    // get contract state
    const contractState = ContractState(network);

    if (!contractState.base_uri) {
      throw new Error(
        `[${network}:${taskName}] Base URI not provided in ${ContractStatePath(
          network
        )}`
      );
    }

    // check if base_url is the same
    const oldContractUri = await traveloggers.contractURI();
    if (oldContractUri.includes(contractState.base_uri)) {
      console.log(
        `[${network}:${taskName}] Baser URI already updated, skipped`
      );
      return;
    }

    // run task
    try {
      const tx = await traveloggers.setSharedBaseURI(contractState.base_uri);

      console.log(
        `[${network}:${taskName}] Finish running task "${taskName}", tx hash ${tx.hash}`
      );
    } catch (error) {
      console.log(`[${network}:${taskName}] Failed to run task "${taskName}"`);
      console.error(error);
    }
  }
);
