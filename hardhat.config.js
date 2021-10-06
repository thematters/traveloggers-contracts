require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

const { MNEMONIC, ALCHEMY_KEY } = require("./.env.json");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: { mnemonic: MNEMONIC },
    },
  },
};
