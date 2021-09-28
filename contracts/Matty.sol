// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Matty is ERC721, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor() ERC721("Matty", "MATT") {}

  // air drop NFT to addresses in batch
  function batchDrop(address[] memory _addresses)
    public
    onlyOwner
    returns (uint256[] memory)
  {
    uint256[] memory ids = new uint256[](_addresses.length);

    // TODO: check if there is enough available tokens
    for (uint256 i = 0; i < _addresses.length; i++) {
      _tokenIds.increment();

      uint256 newItemId = _tokenIds.current();
      _mint(_addresses[i], newItemId);

      ids[i] = newItemId;
    }

    return ids;
  }

  // random draw from addresses and drop NFTs
  function drawLottery(address[] calldata _addresses, uint256 _amount)
    public
    onlyOwner
    returns (address[] memory)
  {
    // empty array to store winner addresses
    address[] memory winners = new address[](_amount);

    // matrix to draw address index randomly
    // adapt from https://github.com/1001-digital/erc721-extensions/blob/main/contracts/RandomlyAssigned.sol
    uint256[] memory addressMatrix = new uint256[](_addresses.length);

    // TODO: check if there is enough available tokens
    for (uint256 i = 0; i < _amount; i++) {
      uint256 random = uint256(
        keccak256(
          abi.encodePacked(
            msg.sender,
            block.coinbase,
            block.difficulty,
            block.gaslimit,
            block.timestamp
          )
        )
      ) % _addresses.length;

      uint256 value = 0;

      if (addressMatrix[random] == 0) {
        // If this matrix position is empty, set the value to the generated random number.
        value = random;
      } else {
        // Otherwise, use the previously stored number from the matrix.
        value = addressMatrix[random];
      }

      // If the last available address has not been drawn...
      if (addressMatrix[_addresses.length - 1] == 0) {
        // ...store that ID in the current matrix position.
        addressMatrix[random] = _addresses.length - 1;
      } else {
        // ...otherwise copy over the stored number to the current matrix position.
        addressMatrix[random] = addressMatrix[_addresses.length - 1];
      }

      winners[i] = _addresses[i];
    }

    // batch air drop NFT for winners
    batchDrop(winners);

    return winners;
  }
}
