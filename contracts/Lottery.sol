// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./BatchNFT.sol";

/**
 * @dev Contract to random draw winners and mint NFTs from an array of addresses.
 */
abstract contract Lottery is BatchNFT {
  event LotteryWinners(address[] winners);

  /**
   * @dev Random draw lottery winners from an array of addresses, mint NFT, and emit an event to record winners.
   */
  function drawLottery(address[] calldata _addresses, uint256 _draw)
    public
    onlyOwner
  {
    // empty array to store winner addresses
    address[] memory winners = _randomDraw(_addresses, _draw);

    // batch mint NFT for winners
    batchMint(winners);

    // record lottery winners
    emit LotteryWinners(winners);
  }

  /**
   * @dev Random draw from an array of addresses and return the result.
   */
  function _randomDraw(address[] memory _addresses, uint256 _draw)
    public
    view
    returns (address[] memory result)
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
