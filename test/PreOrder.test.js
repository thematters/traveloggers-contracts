const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const { createAddresses, web3 } = require("./utils");

chai.use(chaiAsPromised);
const { expect, assert } = chai;

const totalSupply = 20;

describe("PreOrder", () => {
  beforeEach(async () => {
    const contractFactory = await ethers.getContractFactory("PreOrder");
    this.PreOrder = await contractFactory.deploy("Tester", "TT", totalSupply);
    await this.PreOrder.deployed();
  });

  it("Can batch mint to a list of accounts", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply - 1;

    const addressList = createAddresses(amount);

    const tx = await this.PreOrder.batchMint(addressList);

    // test first one and last one
    expect(await this.PreOrder.ownerOf(1)).to.equal(addressList[0]);
    expect(await this.PreOrder.ownerOf(amount)).to.equal(
      addressList[addressList.length - 1]
    );
  });

  it("Require enough token supply left", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply + 1;

    const addressList = createAddresses(amount);

    try {
      await this.PreOrder.batchMint(addressList);
      assert.fail("should throw error");
    } catch (error) {
      console.log(error.message);
      assert.isAbove(
        error.message.search("not enough supply"),
        -1,
        `"not enough supply" error must be returned`
      );
    }
  });

  it("Can start and end pre-ordering", async () => {
    // start pre-order
    let started = await this.PreOrder.inPreOrder();
    expect(started).to.equal(false);

    // cannot start pre-order if minimum contribution amount <= 0
    await expect(this.PreOrder.startPreOrder(0, 100)).to.be.rejected;
    // cannot start pre-order if participants allowed <= 0
    await expect(
      this.PreOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 0)
    ).to.be.rejected;

    // set minimum contribution amount
    await this.PreOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 100);
    let minAmount = await this.PreOrder.minAmount();
    expect(minAmount.toString()).to.equal(web3.utils.toWei("0.1", "ether"));
    let participantsAllowed = await this.PreOrder.participantsAllowed();
    expect(participantsAllowed.toString()).to.equal("100");
    started = await this.PreOrder.inPreOrder();
    expect(started).to.equal(true);

    // cannot start again if already started
    await expect(
      this.PreOrder.startPreOrder(web3.utils.toWei("0.8", "ether"), 100)
    ).to.be.rejected;

    // close pre-order & restart it
    await this.PreOrder.endPreOrder();
    started = await this.PreOrder.inPreOrder();
    expect(started).to.equal(false);
    await this.PreOrder.startPreOrder(web3.utils.toWei("0.5", "ether"), 100);
    started = await this.PreOrder.inPreOrder();
    expect(started).to.equal(true);
  });

  it("Participants can participate pre-ordering", async () => {
    // pre-order not started
    const accounts = await ethers.getSigners();
    await expect(
      this.PreOrder.connect(accounts[0]).preOrder({
        from: accounts[0].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.rejected;

    // start pre-order round 1
    await this.PreOrder.startPreOrder(web3.utils.toWei("0.5", "ether"), 100);
    // success pre-order
    await this.PreOrder.connect(accounts[0]).preOrder({
      from: accounts[0].address,
      value: web3.utils.toWei("0.5", "ether"),
    });
    // no duplicated pre-ordering
    await expect(
      this.PreOrder.connect(accounts[0]).preOrder({
        from: accounts[0].address,
        value: web3.utils.toWei("1.5", "ether"),
      })
    ).to.be.rejected;

    // pre-order closed
    await this.PreOrder.endPreOrder();
    await expect(
      this.PreOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.rejected;

    // start pre-order round 2
    await this.PreOrder.startPreOrder(web3.utils.toWei("0.51", "ether"), 100);
    // cannot pre-order is sent amount is less then minimum contribution required
    await expect(
      this.PreOrder.connect(accounts[1]).preOrder({
        from: accounts[1].address,
        value: web3.utils.toWei("0.5", "ether"),
      })
    ).to.be.rejected;

    await this.PreOrder.connect(accounts[1]).preOrder({
      from: accounts[1].address,
      value: web3.utils.toWei("0.52", "ether"),
    });

    // query pre-order status
    let status = await this.PreOrder.preOrderExist(accounts[0].address);
    expect(status).to.equal(true);
    status = await this.PreOrder.preOrderExist(accounts[1].address);
    expect(status).to.equal(true);
    status = await this.PreOrder.preOrderExist(accounts[3].address);
    expect(status).to.equal(false);

    // query pre-order total amounts
    let amount = await this.PreOrder.preOrderAmountTotal();
    expect(amount.toString()).to.equal(web3.utils.toWei("1.02", "ether"));
  });

  it("Pre-ordering participants limit cannot be exceeded", async () => {
    // max participants allowed is 9
    const accounts = await ethers.getSigners();
    await this.PreOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 9);

    for (let i = 0; i < 9; i++) {
      await this.PreOrder.connect(accounts[i]).preOrder({
        from: accounts[i].address,
        value: web3.utils.toWei("0.1", "ether"),
      });
    }

    await expect(
      this.PreOrder.connect(accounts[9]).preOrder({
        from: accounts[9].address,
        value: web3.utils.toWei("0.1", "ether"),
      })
    ).to.be.rejected;

    // query pre-order total amounts
    let amount = await this.PreOrder.preOrderAmountTotal();
    expect(amount.toString()).to.equal(web3.utils.toWei("0.9", "ether"));

    // query single pre-order
    let participant = await this.PreOrder.preOrderGet(accounts[9].address);
    expect(participant.amount.toString()).to.equal("0");
    participant = await this.PreOrder.preOrderGet(accounts[0].address);
    expect(participant.amount.toString()).to.equal(
      web3.utils.toWei("0.1", "ether")
    );
  });

  it("Can list all pre-order participants", async () => {
    const accounts = await ethers.getSigners();
    await this.PreOrder.startPreOrder(web3.utils.toWei("0.1", "ether"), 100);

    for (let i = 0; i < accounts.length; i++) {
      await this.PreOrder.connect(accounts[i]).preOrder({
        from: accounts[i].address,
        value: web3.utils.toWei("0.1", "ether"),
      });
    }
    let participants = await this.PreOrder.preOrderListAll();
    expect(participants.length).to.equal(accounts.length);

    participants = await this.PreOrder.preOrderList(9, 100);
    expect(participants.length).to.equal(accounts.length - 9 + 1);
    participants = await this.PreOrder.preOrderList(1, 5);
    expect(participants.length).to.equal(5);

    // start index out of bound
    await expect(this.PreOrder.preOrderList(accounts.length + 1, 5)).to.be.rejected;
  });
});
