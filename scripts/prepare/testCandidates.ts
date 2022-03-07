/**
 * Generate test candidates for rinkeby
 */
import path from "path";
import Web3 from "web3";

import { writeJSON } from "../utils";

const candidateNumber = 27;
const amount = 27;
const dataPath = "data/rinkeby/lottery-premium.json";

const web3 = new Web3("http://127.0.0.1:8545/");
const createAddresses = (amount: number) =>
  new Array(amount)
    .fill(undefined)
    .map(() => web3.eth.accounts.create().address);

// main function
const main = async () => {
  const data = {
    taskName: "mint:lottery",
    run: false,
    addresses: createAddresses(candidateNumber),
    amount,
  };

  writeJSON(data, path.join(__dirname, "..", "..", dataPath));
};

main();
