import fs from "fs";
import path from "path";

export const getTravelogerContract = async ({
  network,
  hardhat,
}: {
  network: string;
  hardhat: any;
}) => {
  // read contract address from current state
  const contractStatePath = path.join(
    __dirname,
    "..",
    `data/${network}/state.json`
  );
  const contractState = JSON.parse(
    fs.readFileSync(contractStatePath, "utf-8") || '""'
  );
  const contractAddress = contractState.contract_address;

  if (!contractAddress) {
    throw new Error(`Contract address not found in data/${network}/state.json`);
  }

  // read contract instance from adddress
  const Traveloger = await hardhat.ethers.getContractFactory("Traveloger");
  const traveloger = Traveloger.attach(contractAddress);
  console.log("Read contract from:", traveloger.address);

  return traveloger;
};

export const getTaskInputs = async ({
  taskName,
  inputsFilePath,
  network,
}: {
  taskName: string;
  inputsFilePath: string;
  network: string;
}) => {
  const inputs = JSON.parse(fs.readFileSync(inputsFilePath, "utf-8") || '""');

  // check inputs
  if (!inputsFilePath.includes(network)) {
    throw new Error(
      `Input file ${inputsFilePath} shouldn't be run on ${network}`
    );
  }
  if (!inputs) {
    throw new Error(`Input file ${inputsFilePath} is empty`);
  }
  if (inputs.taskName !== taskName) {
    throw new Error(
      `Input file ${inputsFilePath} shouldn't be inputs as this task`
    );
  }
  if (inputs.run) {
    throw new Error(`Input file ${inputsFilePath} has been run`);
  }

  return { inputs };
};
