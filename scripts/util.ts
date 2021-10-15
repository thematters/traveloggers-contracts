import path from "path";

export const contractStatePath = (network: string) =>
  path.join(__dirname, "..", `data/${network}/state.json`);

export const metadataDirPath = path.join(__dirname, "..", "assets", "metadata");

export const imageDirPath = path.join(__dirname, "..", "assets", "images");
