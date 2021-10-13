import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-abi-exporter";

import {
  deployerPrivateKey,
  alchemyAPIKey,
  coinmarketcapKey,
} from "./.env.json";

import "./tasks/batchMint";
import "./tasks/lottery";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyAPIKey}`,
      accounts: [deployerPrivateKey],
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    coinmarketcap: coinmarketcapKey,
  },
};

export default config;
