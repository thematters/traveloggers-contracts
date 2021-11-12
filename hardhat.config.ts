import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-abi-exporter";

import {
  deployerPrivateKey,
  infuraAPIKey,
  coinmarketcapKey,
  etherscanKey,
} from "./.env.json";

import "./scripts/tasks/batchMint";
import "./scripts/tasks/lottery";
import "./scripts/tasks/setBaseURI";
import "./scripts/tasks/setPreOrder";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infuraAPIKey}}`,
      accounts: [deployerPrivateKey],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${infuraAPIKey}`,
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
