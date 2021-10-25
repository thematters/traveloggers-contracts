import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-abi-exporter";

import {
  deployerPrivateKey,
  alchemyAPIKey,
  coinmarketcapKey,
  etherscanKey,
} from "./.env.json";

import "./scripts/tasks/batchMint";
import "./scripts/tasks/lottery";
import "./scripts/tasks/setBaseURI";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyAPIKey}`,
      accounts: [deployerPrivateKey],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyAPIKey}`,
      accounts: [deployerPrivateKey],
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    coinmarketcap: coinmarketcapKey,
  },
  etherscan: {
    apiKey: etherscanKey,
  },
};

export default config;
