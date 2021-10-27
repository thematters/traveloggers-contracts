import fs from "fs";
import { ContractStatePath } from "../utils";

import hardhat from "hardhat";

async function main() {
  const network = hardhat.network.name;

  let contractState;
  try {
    contractState = JSON.parse(
      fs.readFileSync(ContractStatePath(network), "utf-8") || '""'
    );
  } catch (err) {
    contractState = {};
  }

  if (
    !contractState.contract_address ||
    !contractState.name ||
    !contractState.symbol ||
    !contractState.supply ||
    !contractState.base_uri
  ) {
    throw new Error(
      `[${network}:deploy] "name", "symbol", "supply" are required`
    );
  }

  // verify contract on etherscan
  if (network !== "localhost") {
    console.log(`[${network}:deploy] Verifying contract on Etherscan...`);
    await hardhat.run("verify:verify", {
      address: contractState.contract_address,
      constructorArguments: [
        contractState.name,
        contractState.symbol,
        contractState.supply,
        contractState.base_uri,
      ],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
