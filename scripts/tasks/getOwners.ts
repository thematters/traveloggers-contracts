import { task } from "hardhat/config";
import _chunk from "lodash/chunk";

import { getTraveloggersContract, readJSON, writeJSON } from "../utils";

const taskName = "get:owners";

task(taskName, "Get all owners").setAction(async (_, hardhat) => {
  const network = hardhat.network.name;

  console.log(`[${network}:${taskName}] Running task`);

  // get contract
  const traveloggers = await getTraveloggersContract({ network, hardhat });

  // run task
  const MAX_ID = 1500;
  const MIN_ID = 1;
  const CHUNK_SIZE = 20;
  const chunks = _chunk(
    Array.from({ length: MAX_ID - MIN_ID + 1 }, (_, i) => i + MIN_ID),
    CHUNK_SIZE
  );

  try {
    for (const chunk of chunks) {
      const owners = readJSON("./data/mainnet/owners.json");

      await Promise.all(
        chunk.map(async (id) => {
          const owner = await traveloggers.ownerOf(id);
          console.log(id, owner);
          owners[id] = owner;
        })
      );

      console.log("write", chunk);
      writeJSON(owners, "./data/mainnet/owners.json");
    }
  } catch (error) {
    console.log(`[${network}:${taskName}] Failed to run task "${taskName}"`);
    console.error(error);
  }
});
