import { readJSON } from ".";

import { ContractState } from "./paths";

export const getTraveloggersContract = async ({
  network,
  hardhat,
}: {
  network: string;
  hardhat: any;
}) => {
  const contractState = ContractState(network);

  const contractAddress = contractState.contract_address;

  if (!contractAddress) {
    throw new Error(`Contract address not found in data/${network}/state.json`);
  }

  // read contract instance from adddress
  const Traveloggers = await hardhat.ethers.getContractFactory("Traveloggers");
  const traveloggers = Traveloggers.attach(contractAddress);
  console.log("Read contract from:", traveloggers.address);

  return traveloggers;
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
  const inputs = readJSON(inputsFilePath);

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
