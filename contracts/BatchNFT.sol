// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev ERC721 token with batch mint functionality that only contract owner can call.
 * Token id increases incrementally.
 */
contract BatchNFT is ERC721, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  uint64 public _totalSupply;

  constructor(
    string memory name_,
    string memory symbol_,
    uint64 supply_
  ) ERC721(name_, symbol_) {
    setSupply(supply_);
  }

  /**
   * @dev Update supply of NFT.
   */
  function setSupply(uint64 supply_) public onlyOwner {
    _totalSupply = supply_;
  }

  /**
   * @dev Batch mint NFTs to an array of addresses, require enough supply left.
   */
  function batchMint(address[] memory addresses_)
    public
    onlyOwner
    returns (uint256[] memory)
  {
    require(
      _totalSupply >= addresses_.length + _tokenIds.current(),
      "not enough supply"
    );

    uint256[] memory ids = new uint256[](addresses_.length);
    for (uint256 i = 0; i < addresses_.length; i++) {
      _tokenIds.increment();

      uint256 newItemId = _tokenIds.current();
      _mint(addresses_[i], newItemId);

      ids[i] = newItemId;
    }

    return ids;
  }
}
