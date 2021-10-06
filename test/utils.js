const Web3 = require("web3");

const { networks } = require("../truffle-config");

const web3 = new Web3(
  `http://${networks.development.host}:${networks.development.port}`
);

// gas price in gwei, includes base fee + tip, used for estimation
const gasPrice = 100;

// helper function
const createAddresses = (amount) =>
  new Array(amount)
    .fill(undefined)
    .map(() => web3.eth.accounts.create().address);

module.exports = { createAddresses, gasPrice };
