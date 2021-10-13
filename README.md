NFT avatar for Matties.

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
cp .env.example.json .env.json
```

Fill in the following environment variables:

- `network`: current network name, can be `localhost`, `rinkeby` or `mainnet`
- `alchemyAPIKey`: API key for Alchemy
- `deployerAddress`: address of deployer account
- `deployerPrivateKey`: private key of deployer account
- `contractAddress`: address of NFT contract
- `infuraIPFSId`: Project ID of Infura IPFS
- `infuraIPFSSecret`: Project Secret of Infura IPFS

## Development

Build contract (optional):

```
npm run build
```

Unit test:

```
npm run test
```

Deploy contract to Hardhat Network (localhost):

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

## Minting NFTs

- Store assets under `assets/`, with each avatar in its own directory.
  - Each avatar has a `metadata.json` file.
  - `image` field in `metadata.json` points to the image of the avatar.
  - The rest of the fields will be included in the NFT metadata (we target [opensea metadata standard](https://docs.opensea.io/docs/metadata-standards)).
- Store avatar data on IPFS with `npm run store`
  - It writes the resulting hash into `uri` field in `data/${network}/state.json` file.
  - It only stored the avatars that do not have `uri` in `data/${network}/state.json` yet.
- Mint avatar assets to NFT with `npm run ${network}:mint:${type} -- --inputs ./data/${network}/${inputs}.json`.
  - It writes the resulting back to input file.
