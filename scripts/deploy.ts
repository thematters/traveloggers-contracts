import fs from "fs";
import path from "path";
import hardhat, { ethers } from "hardhat";

async function main() {
  const network = hardhat.network.name;

  // read current contract state or initialize
  const contractStatePath = path.join(
    __dirname,
    "..",
    `data/${network}/state.json`
  );

  let contractState;
  try {
    contractState = JSON.parse(
      fs.readFileSync(contractStatePath, "utf-8") || '""'
    );
  } catch (err) {
    contractState = {};
  }

  if (network !== "localhost" && contractState.contract_address) {
    throw new Error(
      `[${network}:deploy] Contract already deployed at ${contractState.contract_address}`
    );
  }

  // get the contract to deploy
  const Matty = await ethers.getContractFactory("Matty");
  console.log(`[${network}:deploy] Deploying Matty...`);
  const matty = await Matty.deploy();
  await matty.deployed();
  console.log(`[${network}:deploy] Mattty deployed to:`, matty.address);

  // record contract address
  contractState.contract_address = matty.address;
  fs.writeFileSync(contractStatePath, JSON.stringify(contractState, null, 2));

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
