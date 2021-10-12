import fs from "fs";
import path from "path";
import hardhat, { ethers } from "hardhat";

import { network } from "../.env.json";

async function main() {
  const networkName = hardhat.network.name;

  // check env and network
  if (network !== networkName) {
    throw Error("Environment and network do not match");
  }
  console.log(`Deploying to ${networkName}`);

  // get the contract to deploy
  const Matty = await ethers.getContractFactory("Matty");
  console.log("Deploying Matty...");
  const matty = await Matty.deploy();
  await matty.deployed();
  console.log("Mattty deployed to:", matty.address);

  // read current contract state or initialize
  const contractStatePath = path.join(__dirname, "..", `state.${network}.json`);

  let contractState;
  try {
    contractState = JSON.parse(
      fs.readFileSync(contractStatePath, "utf-8") || '""'
    );
  } catch (err) {
    contractState = {};
  }
  contractState.contract_address = matty.address;

  // record contract address
  fs.writeFileSync(contractStatePath, JSON.stringify(contractState));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
