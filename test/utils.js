const Web3 = require("web3");

const web3 = new Web3("http://127.0.0.1:8545/");

// gas price in gwei, includes base fee + tip, used for estimation
const gasPrice = 100;

// helper function
const createAddresses = (amount) =>
  new Array(amount)
    .fill(undefined)
    .map(() => web3.eth.accounts.create().address);

module.exports = { createAddresses, gasPrice };
