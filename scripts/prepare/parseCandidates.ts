/**
 * Parse candidate data to get mainnet lottery input
 */

import path from "path";
import { readJSON, writeJSON } from "../utils";

const dataPath = path.join(__dirname, "..", "..", "data/mainnet");
const candidatesPath = path.join(dataPath, "lottery-candidates.json");
// winner amount
const amounts = {
  premium: 27,
  standard: 253,
  free: 20,
};

// main function
const main = async () => {
  // initialize empty data
  const data = {} as { [key in keyof typeof amounts]: any };
  for (const group in amounts) {
    data[group as keyof typeof amounts] = {
      taskName: "mint:lottery",
      run: false,
      addresses: [],
      amount: amounts[group as keyof typeof amounts],
    };
  }

  const candidates = readJSON(candidatesPath);

  // group candidates
  for (const candidate of candidates) {
    const { address, group_ } = candidate;
    try {
      data[group_ as keyof typeof amounts].addresses.push(address);
    } catch (err) {
      throw Error(`${err}: ${candidate}`);
    }
  }

  // write data
  for (const group in data) {
    writeJSON(
      data[group as keyof typeof amounts],
      path.join(dataPath, `lottery-${group}.json`)
    );
  }
};

main();
