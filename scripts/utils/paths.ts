import path from "path";
import fs from "fs";

import env from "../../.env.json";

export { env };

// general functions
export const writeJSON = (json: { [key: string]: any }, filePath: string) =>
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));

export const readJSON = (filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, "utf-8") || '""');

// constant and functions to get data and state
export const ContractStatePath = (network: string) =>
  path.join(__dirname, "..", "..", `data/${network}/state.json`);

export const BaseUriStatePath = (network: string) =>
  path.join(__dirname, "..", "..", `data/${network}/base-uri.json`);

export const ContractState = (network: string) =>
  readJSON(ContractStatePath(network));

export const metadataDirPath = path.join(
  __dirname,
  "..",
  "..",
  "assets",
  "metadata"
);

export const imageDirPath = path.join(
  __dirname,
  "..",
  "..",
  "assets",
  "images"
);
