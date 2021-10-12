import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";

import { web3 } from "./utils";

chai.use(solidity);
const { expect } = chai;

const totalSupply = 20;

const deployPreOrder = async () => {
  const BatchNFT = await ethers.getContractFactory("PreOrder");
  const batchNFT = await BatchNFT.deploy("Tester", "TT", totalSupply);
  return await batchNFT.deployed();
};

describe("PreOrder", () => {
  it("Can start and end pre-ordering", async () => {
    const preOrder = await deployPreOrder();
    // start pre-order
    let started = await preOrder.inPreOrder();
    expect(started).to.equal(false);

    // cannot start pre-order if minimum contribution amount <= 0
    await expect(preOrder.startPreOrder(0, 100)).to.be.reverted;
    // cannot start pre-order if participants allowed <= 0
    await expect(preOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 0)).to
      .be.reverted;

    // set minimum contribution amount
    await preOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 100);
    const minAmount = await preOrder.minAmount();
    expect(minAmount.toString()).to.equal(web3.utils.toWei("0.1", "ether"));
    const participantsAllowed = await preOrder.participantsAllowed();
    expect(participantsAllowed.toString()).to.equal("100");
    started = await preOrder.inPreOrder();
    expect(started).to.equal(true);

    // cannot start again if already started
    await expect(preOrder.startPreOrder(web3.utils.toWei("0.8", "ether"), 100))
      .to.be.reverted;

    // close pre-order & restart it
    await preOrder.endPreOrder();
    started = await preOrder.inPreOrder();
    expect(started).to.equal(false);
    await preOrder.startPreOrder(web3.utils.toWei("0.5", "ether"), 100);
    started = await preOrder.inPreOrder();
    expect(started).to.equal(true);
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
    ).to.be.reverted;

    // start pre-order round 1
    await preOrder.startPreOrder(web3.utils.toWei("0.5", "ether"), 100);
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
    ).to.be.reverted;

    // pre-order closed
    await preOrder.endPreOrder();
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.reverted;

    // start pre-order round 2
    await preOrder.startPreOrder(web3.utils.toWei("0.51", "ether"), 100);
    // cannot pre-order is sent amount is less then minimum contribution required
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.reverted;

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
    // max participants allowed is 9
    const accounts = await ethers.getSigners();
    await preOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 9);

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
    ).to.be.reverted;

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
    await preOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 100);

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
});
