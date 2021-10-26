import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers";

import { web3, toGasCost } from "./utils";

chai.use(solidity);
const { expect } = chai;

let preOrder: Contract;

describe("PreOrder", () => {
  beforeEach(async () => {
    const PreOrderFactory = await ethers.getContractFactory("Traveloggers");
    const PreOrder = await PreOrderFactory.deploy(
      "PreOrder_Tester",
      "POTT",
      20,
      "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp3JD/"
    );
    preOrder = await PreOrder.deployed();
  });

  it("Can start and end pre-ordering", async () => {
    // start pre-order
    const started = await preOrder.inPreOrder();
    expect(started).to.equal(false);

    // cannot start pre-order if minimum contribution amount <= 0
    await expect(preOrder.setInPreOrder(true)).to.be.revertedWith(
      "zero amount"
    );

    // participants allowed shall be less or equal to total NFT in supply
    await preOrder.setSupply(500);
    await expect(preOrder.setPreOrderParticipants(501)).to.be.revertedWith(
      "incorrect participants"
    );

    // set correct min amount
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.1", "ether"));
    expect(await preOrder.preOrderMinAmount()).to.equal(
      web3.utils.toWei("0.1", "ether")
    );
    // cannot start pre-order if participants allowed <= 0
    await expect(preOrder.setInPreOrder(true)).to.be.revertedWith(
      "incorrect participants"
    );
    // set correct participants
    await preOrder.setPreOrderParticipants(500);
    expect(await preOrder.preOrderParticipantsAllowed()).to.equal(500);
    await preOrder.setPreOrderParticipants(100);
    expect(await preOrder.preOrderParticipantsAllowed()).to.equal(100);

    // start pre-order
    await preOrder.setInPreOrder(true);
    expect(await preOrder.inPreOrder()).to.equal(true);

    // close pre-order & restart it
    await preOrder.setInPreOrder(false);
    expect(await preOrder.inPreOrder()).to.equal(false);
    await preOrder.setInPreOrder(true);
    expect(await preOrder.inPreOrder()).to.equal(true);

    // pre-order limit
    expect(await preOrder.preOrderLimit()).to.equal(5);
  });

  it("Participants can participate pre-ordering", async () => {
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
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.5", "ether"));
    await preOrder.setPreOrderParticipants(100);
    await preOrder.setInPreOrder(true);

    // success pre-order
    const r1Tx = await preOrder.connect(accounts[0]).preOrder({
      from: accounts[0].address,
      value: web3.utils.toWei("0.5", "ether"),
    });
    const { gasUsed: r1GasUsed } = await r1Tx.wait();
    console.log(
      `        Gas used for preOrder: ${r1GasUsed}. Estimated ETH: ${toGasCost(
        r1GasUsed
      )}`
    );
    // // no duplicated pre-ordering
    // await expect(
    //   preOrder.connect(accounts[0]).preOrder({
    //     from: accounts[0].address,
    //     value: web3.utils.toWei("1.5", "ether"),
    //   })
    // ).to.be.revertedWith("");

    // can re-order if not exceeding pre-order limit (5 NFTs)
    // use integer division (floor) to calculated ordered number of NTFs
    const r2Tx = await preOrder.connect(accounts[0]).preOrder({
      from: accounts[0].address,
      value: web3.utils.toWei("0.99", "ether"),
    });
    const { gasUsed: r2GasUsed } = await r2Tx.wait();
    console.log(
      `        Gas used for preOrder: ${r2GasUsed}. Estimated ETH: ${toGasCost(
        r2GasUsed
      )}`
    );
    let participant0 = await preOrder.preOrderGet(accounts[0].address);
    // floor((0.5 + 0.99) / 0.5) = 2
    expect(participant0.n).to.equal(2);

    // cannot re-order if exceeding pre-order limit in subsequent purchase
    // 2 + 4 > 5
    await expect(
      preOrder.connect(accounts[0]).preOrder({
        from: accounts[0].address,
        value: web3.utils.toWei("2.0", "ether"),
      })
    ).to.be.revertedWith("reach order limit");

    // can re-order to the maximum allowed pre-order limit in subsequent purchase
    // 2 + 3 <= 5
    const r3Tx = await preOrder.connect(accounts[0]).preOrder({
      from: accounts[0].address,
      value: web3.utils.toWei("1.5", "ether"),
    });
    const { gasUsed: r3GasUsed } = await r3Tx.wait();
    console.log(
      `        Gas used for preOrder: ${r3GasUsed}. Estimated ETH: ${toGasCost(
        r3GasUsed
      )}`
    );
    participant0 = await preOrder.preOrderGet(accounts[0].address);
    expect(participant0.n).to.equal(5);

    // pre-order closed
    await preOrder.setInPreOrder(false);
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.revertedWith("pre-order not started");

    // start pre-order round 2
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.1", "ether"));
    await preOrder.setInPreOrder(true);
    // cannot pre-order is sent amount is less then minimum contribution required
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.09", "ether"),
      })
    ).to.be.revertedWith("amount too small");

    // cannot order if exceeding pre-order limit in initial purchase
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.6"),
      })
    ).to.be.revertedWith("reach order limit");

    // can order to the maximum allowed pre-order limit in initial purchase
    const r4Tx = await preOrder.connect(accounts[1]).preOrder({
      from: accounts[1].address,
      value: web3.utils.toWei("0.5", "ether"),
    });
    const { gasUsed: r4GasUsed } = await r4Tx.wait();
    console.log(
      `        Gas used for preOrder: ${r4GasUsed}. Estimated ETH: ${toGasCost(
        r4GasUsed
      )}`
    );
    const participant1 = await preOrder.preOrderGet(accounts[1].address);
    expect(participant1.n).to.equal(5);

    // cannot order any single NFT once reached order limit
    await expect(
      preOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.1", "ether"),
      })
    ).to.be.revertedWith("reach order limit");

    // query pre-order status
    let status = await preOrder.preOrderExist(accounts[0].address);
    expect(status).to.equal(true);
    status = await preOrder.preOrderExist(accounts[1].address);
    expect(status).to.equal(true);
    status = await preOrder.preOrderExist(accounts[3].address);
    expect(status).to.equal(false);

    // query pre-order total amounts
    const amount = await preOrder.preOrderAmountTotal();
    expect(amount.toString()).to.equal(
      web3.utils.toWei((0.5 + 0.99 + 1.5 + 0.5).toString(), "ether")
    );

    // query minted NFTs in pre-order
    const minted = await preOrder.preOrderMintIndex();
    expect(minted.toString()).to.equal("10");

    /******** test edge cases ***********/
    // revert when minimum pre-order amount set to zero
    await preOrder.setPreOrderMinAmount(0);
    await expect(
      preOrder.connect(accounts[2]).preOrder({
        from: accounts[2].address,
        value: web3.utils.toWei("0.1", "ether"),
      })
    ).to.be.revertedWith("zero minimum amount");

    // revert when exceeding total supply of NFTs
    await preOrder.setSupply(4);
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.5", "ether"));
    await expect(
      preOrder.connect(accounts[2]).preOrder({
        from: accounts[2].address,
        value: web3.utils.toWei("2.5", "ether"),
      })
    ).to.be.revertedWith("reach total supply");
  });

  it("Pre-ordering participants limit cannot be exceeded", async () => {
    await preOrder.setSupply(10);
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.1", "ether"));
    await preOrder.setPreOrderParticipants(9);
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
    const accounts = await ethers.getSigners();

    await preOrder.setSupply(500);
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.1", "ether"));
    await preOrder.setPreOrderParticipants(100);
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
});
