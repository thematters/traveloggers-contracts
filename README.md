NFT avatar for Matties.

Tools and components:

- [Truffle](https://github.com/trufflesuite/truffle): interacting with, testing and deploy smart contract.
- [Ganache Cli](https://github.com/trufflesuite/ganache): local blockchain during development.
- [Openzepplin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts): componentized and standard smart contracts.

Services:

- [Alchemy](https://www.alchemy.com/): Ethereum node as a service
- [NFT Storage](https://nft.storage/): IPFS storage service with NFT metadata standard.

## Setup

Install dependencies:

```
npm i
```

Copy environment variables:

```
cp .env.local.example .env
```

Fill in the following environment variables:

- `ALCHEMY_KEY`: API key for Alchemy
- `MNEMONIC`: Mnemonic phrase of the contract owner
- `OWNER_ADDRESS`: address that the NFT will be mint to
- `NFT_CONTRACT_ADDRESS`: address of NFT contract
- `PINNING_SERVICE_KEY`: API key of [NFT Storage](https://nft.storage/)
- `ENV`: current environment, can be `develop`, `rinkeby` or `prod` (mainnet)

Source the file:

```
. ./.env
```

## Development

Build contract (optional):

```
npm run build
```

Start ganache:

```
npm run develop:start
```

Unit test:

```
npm run test
```

Deploy contracts to ganache:

```
npm run develop:deploy
```

Launch interactive console (optional):

```
npm run develop:console
```

## Minting NFTs (Rinkeby)

- Store assets under `assets/`, with each avatar in its own directory.
  - Each avatar has a `metadata.json` file.
  - `image` field in `metadata.json` points to the image of the avatar.
  - The rest of the fields will be included in the NFT metadata (we target [opensea metadata standard](https://docs.opensea.io/docs/metadata-standards)).
- Store avatar data on IPFS with `npm run store`
  - It writes the resulting hash into `uri` field in `state.${ENV}.json` file.
  - It only stored the avatars that do not have `uri` in `state.${ENV}.json` yet.
- Mint avatar assets to NFT with `npm run ${ENV}:mint`. (TODO)
  - It writes the resulting transaction hash into `tx` field in `state.${ENV}.json` file.
  - It only mint the avatars that do not have `tx` in `state.${ENV}.json` yet.
