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
    await expect(preOrder.setInPreOrder(true, 0, 10)).to.be.revertedWith(
      "zero amount"
    );

    // pre-order supply shall be less or equal to total NFT in supply
    await preOrder.setSupply(500);
    await expect(preOrder.setPreOrderSupply(501)).to.be.revertedWith(
      "incorrect pre-order supply"
    );
    // cannot start pre-order pre-order supply > total supply
    await expect(
      preOrder.setInPreOrder(true, web3.utils.toWei("0.1", "ether"), 501)
    ).to.be.revertedWith("incorrect pre-order supply");
    // cannot start pre-order pre-order supply <= 0
    await expect(
      preOrder.setInPreOrder(true, web3.utils.toWei("0.1", "ether"), 0)
    ).to.be.revertedWith("incorrect pre-order supply");

    // start pre-order
    await preOrder.setInPreOrder(true, web3.utils.toWei("0.2"), 300);
    expect(await preOrder.inPreOrder()).to.equal(true);
    expect(await preOrder.preOrderMinAmount()).to.equal(
      web3.utils.toWei("0.2", "ether")
    );
    expect(await preOrder.preOrderSupply()).to.equal(300);

    // set correct min amount
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.1", "ether"));
    expect(await preOrder.preOrderMinAmount()).to.equal(
      web3.utils.toWei("0.1", "ether")
    );

    // set correct pre-order supply
    await preOrder.setPreOrderSupply(500);
    expect(await preOrder.preOrderSupply()).to.equal(500);
    await preOrder.setPreOrderSupply(300);
    expect(await preOrder.preOrderSupply()).to.equal(300);

    // close pre-order & restart it
    await preOrder.setInPreOrder(false, 0, 0);
    expect(await preOrder.inPreOrder()).to.equal(false);
    await preOrder.setInPreOrder(true, web3.utils.toWei("0.5", "ether"), 200);
    expect(await preOrder.inPreOrder()).to.equal(true);
    expect(await preOrder.preOrderMinAmount()).to.equal(
      web3.utils.toWei("0.5", "ether")
    );
    expect(await preOrder.preOrderSupply()).to.equal(200);

    // pre-order limit
    expect(await preOrder.preOrderLimit()).to.equal(5);
  });

  it("Participants can participate pre-ordering", async () => {
    // pre-order not started
    const accounts = await ethers.getSigners();
    await expect(
      preOrder.connect(accounts[0]).preOrder(1, {
        from: accounts[0].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.revertedWith("pre-order not started");

    // start pre-order round 1
    await preOrder.setSupply(1500);
    await preOrder.setInPreOrder(true, web3.utils.toWei("0.5", "ether"), 300);

    // the quantity to order cannot be 0
    await expect(
      preOrder.connect(accounts[0]).preOrder(0, {
        from: accounts[0].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.revertedWith("amount too small");

    // paid amount is not enough for the order quantity
    await expect(
      preOrder.connect(accounts[0]).preOrder(1, {
        from: accounts[0].address,
        value: web3.utils.toWei("0.4", "ether"),
      })
    ).to.be.revertedWith("amount too small");

    // success pre-order
    const r1Tx = await preOrder.connect(accounts[0]).preOrder(1, {
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
    const r2Tx = await preOrder.connect(accounts[0]).preOrder(1, {
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
    expect(participant0).to.equal(2);

    // cannot re-order if exceeding pre-order limit in subsequent purchase
    // 2 + 4 > 5
    await expect(
      preOrder.connect(accounts[0]).preOrder(4, {
        from: accounts[0].address,
        value: web3.utils.toWei("2.0", "ether"),
      })
    ).to.be.revertedWith("reach order limit");

    // can re-order to the maximum allowed pre-order limit in subsequent purchase
    // 2 + 3 <= 5
    const r3Tx = await preOrder.connect(accounts[0]).preOrder(3, {
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
    expect(participant0).to.equal(5);

    // pre-order closed
    await preOrder.setInPreOrder(false, 0, 0);
    await expect(
      preOrder.connect(accounts[1]).preOrder(1, {
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.revertedWith("pre-order not started");

    // start pre-order round 2
    await preOrder.setInPreOrder(true, web3.utils.toWei("0.1", "ether"), 300);
    // cannot pre-order is sent amount is less then minimum contribution required
    await expect(
      preOrder.connect(accounts[1]).preOrder(1, {
        from: accounts[1].address,
        value: web3.utils.toWei("0.09", "ether"),
      })
    ).to.be.revertedWith("amount too small");

    // cannot order if exceeding pre-order limit in initial purchase
    await expect(
      preOrder.connect(accounts[1]).preOrder(6, {
        from: accounts[1].address,
        value: web3.utils.toWei("0.6"),
      })
    ).to.be.revertedWith("reach order limit");

    // can order to the maximum allowed pre-order limit in initial purchase
    const r4Tx = await preOrder.connect(accounts[1]).preOrder(5, {
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
    expect(participant1).to.equal(5);

    // cannot order any single NFT once reached order limit
    await expect(
      preOrder.connect(accounts[1]).preOrder(1, {
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

    // // NOTE: preOrderAmountTotal removed to save gas fee
    // // query pre-order total amounts
    // // const amount = await preOrder.preOrderAmountTotal();
    // // expect(amount.toString()).to.equal(
    // //   web3.utils.toWei((0.5 + 0.99 + 1.5 + 0.5).toString(), "ether")
    // // );

    // query minted NFTs in pre-order
    const minted = await preOrder.preOrderMintIndex();
    expect(minted.toString()).to.equal("10");

    /******** test edge cases ***********/
    // revert when minimum pre-order amount set to zero
    await preOrder.setPreOrderMinAmount(0);
    await expect(
      preOrder.connect(accounts[2]).preOrder(5, {
        from: accounts[2].address,
        value: web3.utils.toWei("0.1", "ether"),
      })
    ).to.be.revertedWith("zero minimum amount");

    // // revert when exceeding total supply of NFTs
    // await preOrder.setSupply(4);
    // await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.5", "ether"));
    // await expect(
    //   preOrder.connect(accounts[2]).preOrder(5, {
    //     from: accounts[2].address,
    //     value: web3.utils.toWei("2.5", "ether"),
    //   })
    // ).to.be.revertedWith("reach total supply");

    // check preOrderSupply
    await preOrder.setPreOrderMinAmount(web3.utils.toWei("0.5", "ether"));
    await preOrder.setPreOrderSupply(3);
    await expect(
      preOrder.connect(accounts[2]).preOrder(4, {
        from: accounts[2].address,
        value: web3.utils.toWei("2.0", "ether"),
      })
    ).to.be.revertedWith("reach pre-order supply");
  });

  it("Pre-order supply cannot be exceeded", async () => {
    await preOrder.setSupply(10);
    await preOrder.setInPreOrder(true, web3.utils.toWei("0.1", "ether"), 9);

    // max participants allowed is 9
    const accounts = await ethers.getSigners();

    for (let i = 0; i < 9; i++) {
      await preOrder.connect(accounts[i]).preOrder(1, {
        from: accounts[i].address,
        value: web3.utils.toWei("0.1", "ether"),
      });
    }

    await expect(
      preOrder.connect(accounts[9]).preOrder(1, {
        from: accounts[9].address,
        value: web3.utils.toWei("0.1", "ether"),
      })
    ).to.be.revertedWith("reach pre-order supply");

    // NOTE: preOrderAmountTotal removed to save gas fee
    // query pre-order total amounts
    // const amount = await preOrder.preOrderAmountTotal();
    // expect(amount.toString()).to.equal(web3.utils.toWei("0.9", "ether"));

    // NOTE: participant.amount and participant.addr is removed to save gas fee
    // query single pre-order
    // let participant = await preOrder.preOrderGet(accounts[9].address);
    // expect(participant.amount.toString()).to.equal("0");
    // participant = await preOrder.preOrderGet(accounts[0].address);
    // expect(participant.amount.toString()).to.equal(
    //   web3.utils.toWei("0.1", "ether")
    // );
  });

  // NOTE: two mapping data structure revamp to single mapping to save gas fee
  //   thus, view functions for participants list are not supported anymore
  // it("Can list all pre-order participants", async () => {
  //   const accounts = await ethers.getSigners();

  //   await preOrder.setSupply(500);
  //   await preOrder.setInPreOrder(true, web3.utils.toWei("0.1", "ether"), 100);

  //   for (let i = 0; i < accounts.length; i++) {
  //     await preOrder.connect(accounts[i]).preOrder(1, {
  //       from: accounts[i].address,
  //       value: web3.utils.toWei("0.1", "ether"),
  //     });
  //   }
  //   let participants = await preOrder.preOrderListAll();
  //   expect(participants.length).to.equal(accounts.length);

  //   participants = await preOrder.preOrderList(9, 100);
  //   expect(participants.length).to.equal(accounts.length - 9 + 1);
  //   participants = await preOrder.preOrderList(1, 5);
  //   expect(participants.length).to.equal(5);

  //   // start index out of bound
  //   await expect(preOrder.preOrderList(accounts.length + 1, 5)).to.be.reverted;
  // });
});
