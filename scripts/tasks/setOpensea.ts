import { OpenSeaPort, Network } from "opensea-js";
import { task, types } from "hardhat/config";

import Web3ProviderEngine from "web3-provider-engine";
import { PrivateKeyWalletSubprovider } from "@0x/subproviders";

import {
  deployerAddress,
  deployerPrivateKey,
  infuraAPIKey,
} from "../../.env.json";
import { ContractState, getTaskInputs, writeJSON } from "../utils";

/* eslint-disable  @typescript-eslint/no-var-requires */
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");

const taskName = "set:opensea";

task(taskName, "Setup item listing info on OpenSea")
  .addOptionalParam(
    "inputs",
    "path of input file which contains listing settings",
    null,
    types.inputFile
  )
  .setAction(async ({ inputs: inputsFilePath }, hardhat) => {
    const network = hardhat.network.name;
    console.log(`[${network}:${taskName}] Running task`);

    const { inputs } = await getTaskInputs({
      taskName,
      inputsFilePath,
      network,
    });

    if (inputs.run) {
      throw new Error(
        `[${network}:${taskName}] ${inputsFilePath} has been run`
      );
    }

    if (!inputs.range || !inputs.startAmount || !inputs.expirationDay) {
      throw new Error(
        `[${network}:${taskName}] Input file ${inputsFilePath} needs range, startAmount and expirationDay`
      );
    }

    // run task
    try {
      /**
       * setup provider for signature
       */
      const providerRpcUrl = {
        rinkeby: `https://rinkeby.infura.io/v3/${infuraAPIKey}`,
        mainnet: `https://mainnet.infura.io/v3/${infuraAPIKey}`,
      }[network];
      const infuraRpcSubprovider = new RPCSubprovider({
        rpcUrl: providerRpcUrl,
      });
      const privateKeyWalletSubprovider = new PrivateKeyWalletSubprovider(
        deployerPrivateKey
      );

      /**
       * start provider engine
       */
      const providerEngine = new Web3ProviderEngine();
      providerEngine.addProvider(privateKeyWalletSubprovider);
      providerEngine.addProvider(infuraRpcSubprovider);
      providerEngine.start();

      /**
       * setup seaport instance
       */
      let networkName;
      if (network === "mainnet") {
        networkName = Network.Main;
      } else if (network === "rinkeby") {
        networkName = Network.Rinkeby;
      } else {
        throw Error(`Network unknown: ${network}`);
      }

      const seaport = new OpenSeaPort(providerEngine, {
        networkName,
        // apiKey: openseaAPIKey,
      });

      /**
       * setup listing
       */
      // Expire this auction n days from now.
      // convert from the JavaScript timestamp (milliseconds):
      const contractState = ContractState(network);
      // const accountAddress = deployerAddress;
      const tokenAddress = contractState.contract_address;
      inputs.listed = [];

      const { waitForHighestBid, startAmount, expirationDay, range } = inputs;

      const expirationTime = Math.round(
        Date.now() / 1000 + 60 * 60 * 24 * expirationDay
      );

      // if we are doing auction, use WETH
      const token = (await seaport.api.getPaymentTokens({ symbol: "WETH" }))
        .tokens[0];
      for (let tokenId = range[0]; tokenId <= range[1]; tokenId++) {
        await seaport.createSellOrder({
          asset: {
            tokenId,
            tokenAddress,
          },
          accountAddress: deployerAddress,
          startAmount,
          expirationTime,
          waitForHighestBid,
          paymentTokenAddress: waitForHighestBid ? token.address : undefined,
        });

        console.log(`[${network}:${taskName}] ${tokenId} is listed.`);
        inputs.listed.push(tokenId);
      }

      inputs.run = true;
      inputs.error = null;
    } catch (error) {
      console.log(`[${network}:${taskName}] Failed to run task "${taskName}"`);
      console.error(error);

      inputs.run = true;
      inputs.error = error;
    }

    writeJSON({ ...inputs, ranAt: new Date() }, inputsFilePath);
  });
