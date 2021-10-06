const Matty = artifacts.require("Matty");

module.exports = async function (deployer) {
  await deployer.deploy(Matty);
};
