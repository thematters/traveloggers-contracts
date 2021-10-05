const hardhat = require("hardhat");
const env = process.env.ENV;

const envNetwork = {
  develop: "localhost",
  rinkeby: "rinkeby",
  prod: "mainnet",
};

async function main() {
  if (envNetwork[env] !== hardhat.network.name) {
    throw Error("Environment and network do not match");
  }
  // We get the contract to deploy
  const Matty = await ethers.getContractFactory("Matty");
  console.log("Deploying Matty...");
  const matty = await Matty.deploy();
  await matty.deployed();
  console.log("Mattt deployed to:", matty.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
