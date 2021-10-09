// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Lottery.sol";
import "./Logbook.sol";

contract Matty is Lottery, TokenLogbook {
    constructor() BatchNFT("Matty", "MATT", 500) {}

    /**
     * @dev Unlock logbook on token transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, TokenLogbook) {
        super._beforeTokenTransfer(from, to, tokenId); // Call parent hook
    }
}
