// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Matty is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor() ERC721("Matty", "MATT") {}

  // mint a NFT with a tokenURI, so every token can have a different hash
  function mintTo(address _to, string memory _tokenURI)
    public
    returns (uint256)
  {
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();
    _mint(_to, newItemId);
    _setTokenURI(newItemId, _tokenURI);

    return newItemId;
  }
}
