const { expect } = require("chai")

const { createAddresses, gasPrice } = require("./utils")

// Load compiled artifacts
const Matty = artifacts.require("Matty")

// Start test block
contract("Matty", (accounts) => {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.matty = await Matty.new()
  })

  it("Can draw lottery from a list of accounts", async function () {
    // account test list, repeating with the same account
    const candidateAmount = 10000
    const winnerAmount = 10

    const addressList = createAddresses(4000)

    const { logs, receipt } = await this.matty.drawLottery(
      addressList,
      winnerAmount
    )

    const winners = logs.filter(({ event }) => event === "LotteryWinners")[0]
      .args.winners

    expect(await this.matty.ownerOf(1)).to.equal(winners[0])
    expect(await this.matty.ownerOf(winnerAmount)).to.equal(
      winners[winners.length - 1]
    )

    // assuming base fee + tip ~ 100 gwei
    console.log(
      `        Gas used for drawing ${winnerAmount} winners from ${candidateAmount} addresses: ${
        receipt.gasUsed
      }. Estimated ETH: ${receipt.gasUsed * gasPrice * 0.000000001}`
    )
  })

  it("Can random draw from a list of accounts without duplicates", async function () {
    const amount = 10
    const addressList = createAddresses(10)

    const result = await this.matty._randomDraw(addressList, amount)

    // should be no duplication in result
    expect(new Set(result).size).to.equal(result.length)
  })
})
