const fs = require("fs");
const path = require("path");
const hardhat = require("hardhat");

const env = process.env.ENV;

const envNetwork = {
  develop: "localhost",
  rinkeby: "rinkeby",
  prod: "mainnet",
};

async function main() {
  // check env and network
  if (envNetwork[env] !== hardhat.network.name) {
    throw Error("Environment and network do not match");
  }

  // get the contract to deploy
  const Matty = await ethers.getContractFactory("Matty");
  console.log("Deploying Matty...");
  const matty = await Matty.deploy();
  await matty.deployed();
  console.log("Mattt deployed to:", matty.address);

  // read current contract state or initialize
  const contractStatePath = path.join(__dirname, "..", `state.${env}.json`);

  let contractState;
  try {
    contractState = require(contractStatePath);
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
