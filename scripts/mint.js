// TODO

module.exports = async function main(callback) {
  try {
    // Set up a Truffle contract, representing our deployed Box instance
    const Matty = artifacts.require("Matty");
    const matty = await Matty.deployed();

    // TODO: loop through unminted token
    const value = await matty.ownerOf(1);

    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
};
