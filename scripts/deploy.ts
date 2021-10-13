import fs from "fs";
import path from "path";
import hardhat, { ethers } from "hardhat";

async function main() {
  const network = hardhat.network.name;

  console.log(`Deploying to ${network}`);

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
      `Contract already deployed at ${contractState.contract_address}`
    );
  }

  // get the contract to deploy
  const Matty = await ethers.getContractFactory("Matty");
  console.log("Deploying Matty...");
  const matty = await Matty.deploy();
  await matty.deployed();
  console.log("Mattty deployed to:", matty.address);

  // record contract address
  contractState.contract_address = matty.address;
  fs.writeFileSync(contractStatePath, JSON.stringify(contractState, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
