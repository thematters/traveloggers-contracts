import path from "path";

import { network } from "../.env.json";

export const contractStatePath = path.join(
  __dirname,
  "..",
  `state.${network}.json`
);
export const metadataDirPath = path.join(__dirname, "..", "assets", "metadata");
export const imageDirPath = path.join(__dirname, "..", "assets", "images");
