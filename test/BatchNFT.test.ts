import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";

import { createAddresses, toGasCost } from "./utils";

chai.use(solidity);
const { expect } = chai;

const totalSupply = 20;

const deployBatchNFT = async () => {
  const BatchNFT = await ethers.getContractFactory("BatchNFT");
  const batchNFT = await BatchNFT.deploy("Tester", "TT", totalSupply);
  return await batchNFT.deployed();
};

describe("BatchNFT", () => {
  it("Can read or write base URI", async () => {
    // get contract URI
    const batchNFT = await deployBatchNFT();
    const contractURI = await batchNFT.contractURI();
    expect(contractURI).to.be.a("string");

    // set new sharedBaseURI
    const uri = "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp123/";
    await batchNFT.setSharedBaseURI(uri);

    // get new contract URI
    const newContractURI = await batchNFT.contractURI();
    expect(newContractURI).to.equal(uri + "contract-metadata.json");
  });

  it("Can batch mint to a list of accounts", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply - 1;

    const addressList = createAddresses(amount);

    const batchNFT = await deployBatchNFT();
    const tx = await batchNFT.batchMint(addressList);

    // test first one and last one
    expect(await batchNFT.ownerOf(1)).to.equal(addressList[0]);
    expect(await batchNFT.ownerOf(amount)).to.equal(
      addressList[addressList.length - 1]
    );

    // assuming base fee + tip ~ 100 gwei
    const { gasUsed } = await tx.wait();
    console.log(
      `        Gas used for minting ${amount} NFTs in batch: ${gasUsed}. Estimated ETH: ${toGasCost(
        gasUsed
      )}`
    );
  });

  it("Require enough token supply left", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply + 1;

    const addressList = createAddresses(amount);

    const batchNFT = await deployBatchNFT();
    await expect(batchNFT.batchMint(addressList)).to.be.revertedWith(
      "not enough supply"
    );
  });
});
