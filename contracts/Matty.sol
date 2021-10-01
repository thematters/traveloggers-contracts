// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./PreOrder.sol";

contract Matty is ERC721, Ownable, PreOrder {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  event LotteryDraw(address[] winners);

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
  function drawLottery(address[] calldata _addresses, uint256 _draw)
    public
    onlyOwner
  {
    // TODO: check if there is enough available tokens
    // empty array to store winner addresses
    address[] memory winners = _randomDraw(_addresses, _draw);

    // batch air drop NFT for winners
    batchDrop(winners);

    // record lottery winners
    emit LotteryDraw(winners);
  }

  function _randomDraw(address[] memory _addresses, uint256 _draw)
    public
    view
    returns (
      // view
      address[] memory result
    )
  {
    // empty array to store result
    result = new address[](_draw);

    for (uint256 i = 0; i < _draw; i++) {
      uint256 random = uint256(
        keccak256(
          abi.encodePacked(
            i,
            msg.sender,
            block.coinbase,
            block.difficulty,
            block.gaslimit,
            block.timestamp
          )
        )
      ) % (_addresses.length - i);

      result[i] = _addresses[random];

      _addresses[random] = _addresses[_addresses.length - i - 1];
    }

    return result;
  }
}
