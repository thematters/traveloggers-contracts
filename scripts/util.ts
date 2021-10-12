import path from "path";

import { env } from "../.env.json";

export const contractStatePath = path.join(
  __dirname,
  "..",
  `state.${env}.json`
);
export const metadataDirPath = path.join(__dirname, "..", "assets", "metadata");
export const imageDirPath = path.join(__dirname, "..", "assets", "images");
