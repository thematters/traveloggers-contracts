import path from "path";
import fs from "fs";

import env from "../../.env.json";

export { env };

export const ContractStatePath = (network: string) =>
  path.join(__dirname, "..", "..", `data/${network}/state.json`);

export const ContractState = (network: string) =>
  JSON.parse(fs.readFileSync(ContractStatePath(network), "utf-8") || '""');

export const BaseUriStatePath = (network: string) =>
  path.join(__dirname, "..", "..", `data/${network}/base-uri.json`);

export const BaseUriState = (network: string) =>
  JSON.parse(fs.readFileSync(ContractStatePath(network), "utf-8") || '""');

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
