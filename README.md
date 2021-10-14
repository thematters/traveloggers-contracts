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

Source the file:

```
. ./.env
```

## Development

Build contract (optional):

```
npm run build
```

Start hardhat local node:

```
npm run develop:start
```

Unit test:

```
npm run test
```

Deploy contracts to local node:

```
npm run develop:deploy
```

Launch interactive console (optional):

```
npm run develop:console
```

## Generation & Deployment CLI

### `npm run generate`

Generate avatar metadata files in `assets/metadata` according to attributes in `scripts/settings.json`.

- Each file is named by avatar id.
- Field `image` references file name in `assets/images`.

### `npm run store`

Store image and metadata to IPFS, then add `base_uri` in `state.${network}.json`.

- Add to IPFS images referenced in `assets/metadata/${tokenID}`, throw error if an image doesn't exists in `assets/images`.
- Update filed `image` in `assets/metadata/${tokenID}` with image IPFS hash.
- Add `assets/metadata` as a whole directory to IPFS, and add `base_uri` in `state.${network}.json` with the resulting hash.

### `npm run ${network}:deploy`

Deploy contracts to the given network and add `contract_address` in `state.${network}.json`.

- Read `base_uri` in `state.${network}.json` for deployment.
- Add `contract_address` in `state.${network}.json`

## Deployment Flow

- Store assets under `assets/`, with each avatar in its own directory.
  - Each avatar has a `metadata.json` file.
  - `image` field in `metadata.json` points to the image of the avatar.
  - The rest of the fields will be included in the NFT metadata (we target [opensea metadata standard](https://docs.opensea.io/docs/metadata-standards)).
- Store avatar data on IPFS with `npm run store`
  - It writes the resulting hash into `uri` field in `state.${network}.json` file.
  - It only stored the avatars that do not have `uri` in `state.${network}.json` yet.
- Mint avatar assets to NFT with `npm run ${network}:mint`. (TODO)
  - It writes the resulting transaction hash into `tx` field in `state.${network}.json` file.
  - It only mint the avatars that do not have `tx` in `state.${network}.json` yet.
