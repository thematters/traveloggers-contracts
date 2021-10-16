import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";

import { web3 } from "./utils";

chai.use(solidity);
const { expect } = chai;

const deployPreOrder = async () => {
  const PreOrder = await ethers.getContractFactory("Matty");
  const preOrder = await PreOrder.deploy(
    "PreOrder_Tester",
    "POTT",
    20,
    "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp3JD/"
  );
  return await preOrder.deployed();
};

describe("PreOrder", () => {
  it("Can start and end pre-ordering", async () => {
    const preOrder = await deployPreOrder();
    // start pre-order
    const started = await preOrder.inPreOrder();
    expect(started).to.equal(false);

    // cannot start pre-order if minimum contribution amount <= 0
    await expect(preOrder.setInPreOrder(true)).to.be.revertedWith(
      "zero amount"
    );

    // participants allowed shall be less or equal to total NFT in supply
    await preOrder.setSupply(500);
    await expect(preOrder.setParticipants(501)).to.be.revertedWith(
      "incorrect participants"
    );

    // set correct min amount
    await preOrder.setMinAmount(web3.utils.toWei("0.1", "ether"));
    expect(await preOrder.minAmount()).to.equal(
      web3.utils.toWei("0.1", "ether")
    );
    // cannot start pre-order if participants allowed <= 0
    await expect(preOrder.setInPreOrder(true)).to.be.revertedWith(
      "incorrect participants"
    );
    // set correct participants
    await preOrder.setParticipants(500);
    expect(await preOrder.participantsAllowed()).to.equal(500);
    await preOrder.setParticipants(100);
    expect(await preOrder.participantsAllowed()).to.equal(100);

    // start pre-order
    await preOrder.setInPreOrder(true);
    expect(await preOrder.inPreOrder()).to.equal(true);

    // close pre-order & restart it
    await preOrder.setInPreOrder(false);
    expect(await preOrder.inPreOrder()).to.equal(false);
    await preOrder.setInPreOrder(true);
    expect(await preOrder.inPreOrder()).to.equal(true);
  });

  it("Participants can participate pre-ordering", async () => {
    const preOrder = await deployPreOrder();
    // pre-order not started
    const accounts = await ethers.getSigners();
    await expect(
      preOrder.connect(accounts[0]).preOrder({
        from: accounts[0].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.revertedWith("pre-order not started");

    // start pre-order round 1
    await preOrder.setSupply(100);
    await preOrder.setMinAmount(web3.utils.toWei("0.5", "ether"));
    await preOrder.setParticipants(100);
    await preOrder.setInPreOrder(true);
    // success pre-order
    await preOrder.connect(accounts[0]).preOrder({
      from: accounts[0].address,
      value: web3.utils.toWei("0.5", "ether"),
    });
    // no duplicated pre-ordering
    await expect(
      preOrder.connect(accounts[0]).preOrder({
        from: accounts[0].address,
        value: web3.utils.toWei("1.5", "ether"),
      })
    ).to.be.revertedWith("");

    // pre-order closed
    await preOrder.setInPreOrder(false);
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.revertedWith("pre-order not started");

    // start pre-order round 2
    await preOrder.setMinAmount(web3.utils.toWei("0.51", "ether"));
    await preOrder.setInPreOrder(true);
    // cannot pre-order is sent amount is less then minimum contribution required
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.revertedWith("amount too small");

    await preOrder.connect(accounts[1]).preOrder({
      from: accounts[1].address,
      value: web3.utils.toWei("0.52", "ether"),
    });

    // query pre-order status
    let status = await preOrder.preOrderExist(accounts[0].address);
    expect(status).to.equal(true);
    status = await preOrder.preOrderExist(accounts[1].address);
    expect(status).to.equal(true);
    status = await preOrder.preOrderExist(accounts[3].address);
    expect(status).to.equal(false);

    // query pre-order total amounts
    const amount = await preOrder.preOrderAmountTotal();
    expect(amount.toString()).to.equal(web3.utils.toWei("1.02", "ether"));
  });

  it("Pre-ordering participants limit cannot be exceeded", async () => {
    const preOrder = await deployPreOrder();
    await preOrder.setSupply(9);
    await preOrder.setMinAmount(web3.utils.toWei("0.1", "ether"));
    await preOrder.setParticipants(9);
    await preOrder.setInPreOrder(true);

    // max participants allowed is 9
    const accounts = await ethers.getSigners();

    for (let i = 0; i < 9; i++) {
      await preOrder.connect(accounts[i]).preOrder({
        from: accounts[i].address,
        value: web3.utils.toWei("0.1", "ether"),
      });
    }

    await expect(
      preOrder.connect(accounts[9]).preOrder({
        from: accounts[9].address,
        value: web3.utils.toWei("0.1", "ether"),
      })
    ).to.be.revertedWith("reach participants limit");

    // query pre-order total amounts
    const amount = await preOrder.preOrderAmountTotal();
    expect(amount.toString()).to.equal(web3.utils.toWei("0.9", "ether"));

    // query single pre-order
    let participant = await preOrder.preOrderGet(accounts[9].address);
    expect(participant.amount.toString()).to.equal("0");
    participant = await preOrder.preOrderGet(accounts[0].address);
    expect(participant.amount.toString()).to.equal(
      web3.utils.toWei("0.1", "ether")
    );
  });

  it("Can list all pre-order participants", async () => {
    const preOrder = await deployPreOrder();
    const accounts = await ethers.getSigners();

    await preOrder.setSupply(500);
    await preOrder.setMinAmount(web3.utils.toWei("0.1", "ether"));
    await preOrder.setParticipants(100);
    await preOrder.setInPreOrder(true);

    for (let i = 0; i < accounts.length; i++) {
      await preOrder.connect(accounts[i]).preOrder({
        from: accounts[i].address,
        value: web3.utils.toWei("0.1", "ether"),
      });
    }
    let participants = await preOrder.preOrderListAll();
    expect(participants.length).to.equal(accounts.length);

    participants = await preOrder.preOrderList(9, 100);
    expect(participants.length).to.equal(accounts.length - 9 + 1);
    participants = await preOrder.preOrderList(1, 5);
    expect(participants.length).to.equal(5);

    // start index out of bound
    await expect(preOrder.preOrderList(accounts.length + 1, 5)).to.be.reverted;
  });

  it("Can batch mint to pre-order participants", async () => {
    const preOrder = await deployPreOrder();
    const accounts = await ethers.getSigners();

    await preOrder.setSupply(1000);
    await preOrder.setMinAmount(web3.utils.toWei("0.1", "ether"));
    await preOrder.setParticipants(accounts.length);
    await preOrder.setInPreOrder(true);

    for (let i = 0; i < accounts.length; i++) {
      await preOrder.connect(accounts[i]).preOrder({
        from: accounts[i].address,
        value: web3.utils.toWei("0.1", "ether"),
      });
    }

    const batchSize = 7;
    const batchRounds = Math.ceil(accounts.length / batchSize);

    // cannot trigger batch when still in pre-order
    await expect(preOrder.preOrderBatchMint(batchSize)).to.be.revertedWith(
      "still in pre-order"
    );

    // stop pre-order
    await preOrder.setInPreOrder(false);

    for (let i = 0; i < batchRounds - 1; i++) {
      await preOrder.preOrderBatchMint(batchSize);
    }
    // the last batch exceeds
    await expect(preOrder.preOrderBatchMint(batchSize)).to.be.revertedWith(
      "batch too large"
    );

    // set the correct batch size for the last batch
    await preOrder.preOrderBatchMint(accounts.length % batchSize);
    // minted equal to pre-order participants
    expect(await preOrder.preOrderMintIndex()).to.equal(
      await preOrder.preOrderIndex()
    );
  });
});
