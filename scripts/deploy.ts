import fs from "fs";
import { contractStatePath } from "./util";

import hardhat, { ethers } from "hardhat";

async function main() {
  const network = hardhat.network.name;

  let contractState;
  try {
    contractState = JSON.parse(
      fs.readFileSync(contractStatePath(network), "utf-8") || '""'
    );
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
  const Matty = await ethers.getContractFactory("Matty");
  console.log(`[${network}:deploy] Deploying Matty...`);
  const matty = await Matty.deploy(
    contractState.name,
    contractState.symbol,
    contractState.supply,
    contractState.base_uri
  );
  await matty.deployed();
  console.log(`[${network}:deploy] Mattty deployed to:`, matty.address);

  // record contract address
  contractState.contract_address = matty.address;
  fs.writeFileSync(
    contractStatePath(network),
    JSON.stringify(contractState, null, 2)
  );

  // verify contract on etherscan
  if (network !== "localhost") {
    console.log(`[${network}:deploy] Verifying contract on Etherscan...`);
    await hardhat.run("verify:verify", {
      address: matty.address,
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
