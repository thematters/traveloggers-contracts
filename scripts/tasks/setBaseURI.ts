import { task } from "hardhat/config";

import {
  getTraveloggersContract,
  BaseUriStatePath,
  readJSON,
  ContractStatePath,
  writeJSON,
  ContractState,
} from "../utils";

const taskName = "set:baseURI";

task(taskName, "Set shared base URI for token and contract metadata").setAction(
  async (_, hardhat) => {
    const network = hardhat.network.name;

    console.log(`[${network}:${taskName}] Running task`);

    // get contract
    const traveloggers = await getTraveloggersContract({ network, hardhat });

    // get base url to update
    const { base_uri } = readJSON(BaseUriStatePath(network));

    // check if ready
    if (!base_uri) {
      throw new Error(
        `[${network}:${taskName}] Base URI not provided in ${BaseUriStatePath(
          network
        )}`
      );
    }

    // check if base_url is the same
    const oldContractUri = await traveloggers.contractURI();
    if (oldContractUri.includes(base_uri)) {
      console.log(
        `[${network}:${taskName}] Baser URI already updated, skipped`
      );
      return;
    }

    // run task
    try {
      const tx = await traveloggers.setSharedBaseURI(base_uri);

      // update contract state
      const contractStatePath = ContractStatePath(network);
      const contractState = ContractState(network);
      writeJSON({ ...contractState, base_uri }, contractStatePath);

      console.log(
        `[${network}:${taskName}] Finish running task "${taskName}", tx hash ${tx.hash}`
      );
    } catch (error) {
      console.log(`[${network}:${taskName}] Failed to run task "${taskName}"`);
      console.error(error);
    }
  }
);
