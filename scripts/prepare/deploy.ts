import { ContractStatePath, ContractState, writeJSON } from "../utils";

import hardhat, { ethers } from "hardhat";

async function main() {
  const network = hardhat.network.name;

  let contractState;
  try {
    contractState = ContractState(network);
  } catch (err) {
    contractState = {};
  }

  if (network !== "localhost" && contractState.contract_address) {
    throw new Error(
      `[${network}:deploy] Contract already deployed at ${contractState.contract_address}`
    );
  }

  if (!contractState.base_uri) {
    throw new Error(
      `[${network}:deploy] missing "base_uri", please run "npm run ${network}:store" first`
    );
  }

  if (
    !contractState.name ||
    !contractState.symbol ||
    !contractState.supply ||
    !contractState.base_uri
  ) {
    throw new Error(
      `[${network}:deploy] "name", "symbol", "supply" are required`
    );
  }

  // get the contract to deploy
  const Traveloggers = await ethers.getContractFactory("Traveloggers");
  console.log(`[${network}:deploy] Deploying Traveloggers...`);
  const traveloggers = await Traveloggers.deploy(
    contractState.name,
    contractState.symbol,
    contractState.supply,
    contractState.base_uri
  );
  await traveloggers.deployed();
  console.log(
    `[${network}:deploy] Traveloggers deployed to:`,
    traveloggers.address
  );

  // record contract address
  contractState.contract_address = traveloggers.address;
  writeJSON(contractState, ContractStatePath(network));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
