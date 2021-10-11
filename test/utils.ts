import { ethers } from "hardhat";
import Web3 from "web3";

const web3 = new Web3("http://127.0.0.1:8545/");

// gas price in gwei, includes base fee + tip, used for estimation
const gasPrice = ethers.utils.parseUnits("100", "gwei");

export const toGasCost = (gasUsed: number) =>
  ethers.utils.formatEther(gasPrice.mul(ethers.BigNumber.from(gasUsed)));

export const createAddresses = (amount: number) =>
  new Array(amount)
    .fill(undefined)
    .map(() => web3.eth.accounts.create().address);
