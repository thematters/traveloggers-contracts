require("@nomiclabs/hardhat-ethers");

const mnemonic = process.env.MNEMONIC;
const alchemyApiKey = process.env.ALCHEMY_KEY;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyApiKey}`,
      accounts: { mnemonic: mnemonic },
    },
  },
};
