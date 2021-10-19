NFT avatar for Travelogers.

Tools and components:

- [Hardhat](https://hardhat.org/): interacting with, testing and deploy smart contract.
- [Openzepplin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts): componentized and standard smart contracts.

Services:

- [Alchemy](https://www.alchemy.com/): Ethereum node as a service
- [Infura IPFS](https://infura.io/product/ipfs): IPFS storage service with NFT metadata standard.

## Setup

Install dependencies:

```
npm i
```

Copy environment variables:

```
cp .env.json.example .env.json
```

Fill in the following environment variables:

- `network`: current network name, can be `localhost`, `rinkeby` or `mainnet`
- `alchemyAPIKey`: API key for Alchemy
- `deployerAddress`: address of deployer account
- `deployerPrivateKey`: private key of deployer account
- `contractAddress`: address of NFT contract
- `infuraIPFSId`: Project ID of Infura IPFS
- `infuraIPFSSecret`: Project Secret of Infura IPFS
- `coinmarketcapKey`: use Coinmarketcap API to get price of ETH and estimate gas cost
- `etherscanKey`: use Etherscan API to verify the contract

## Development

Build contract (optional):

```
npm run build
```

Unit test:

```
npm run test
```

Deploy contract to Hardhat Network:

```
npm run localhost:deploy
```

Start Hardhat Network:

```
npm run localhost:start
```

Launch interactive console:

```
npm run localhost:console
```

## CLI

### `npm run generate`

Generate avatar metadata files in `assets/metadata` according to attributes in `scripts/settings.json`.

- Each file is named by avatar id.
- Field `image` references file name in `assets/images`.

### `npm run ${network}:store`

Store image and metadata to IPFS, then add `base_uri` in `data/${network}/state.json`.

- Add to IPFS images referenced in `assets/metadata/${tokenID}`, throw error if an image doesn't exists in `assets/images`.
- Update filed `image` in `assets/metadata/${tokenID}` with image IPFS hash.
- Add `assets/metadata` as a whole directory to IPFS, and add `base_uri` in `data/${network}/state.json` with the resulting hash.

### `npm run ${network}:deploy`

Deploy contracts to the given network and add `contract_address` in `data/${network}/state.json`.

- Read `base_uri` in `data/${network}/state.json` for deployment.
- Add `contract_address` in `data/${network}/state.json`.

### `npm run ${network}:mint:batch` / `npm run ${network}:mint:lottery`

Mint NFTs to the given addresses with inputs file.

- Result will be updated back to input files.

```bash
# batch mint
npm run localhost:mint:batch -- --inputs ./data/localhost/sample-mint-batch.json

# lottery mint
npm run localhost:mint:lottery -- --inputs ./data/localhost/sample-mint-lottery.json
```
