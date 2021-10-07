// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./BatchNFT.sol";

/**
 * @dev Contract to record logs appended by token owner
 */
abstract contract Logbook is BatchNFT {
    struct Log {
        uint256 createdAt;
        string log;
        address sender;
    }
    struct TokenLogbook {
        Log[] logs;
        bool isLock;
    }

    // Mapping from token ID to logbook
    mapping(uint256 => TokenLogbook) private logbook;

    uint8 public constant MAX_LOG_LENGTH = 140;

    event LogbookNewLog(uint256 tokenId, address sender);

    /**
     * @dev Append a new log to logbook
     *
     * Emits a {LogbookNewLog} event.
     */
    function appendLog(uint256 tokenId, string calldata log) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not owner nor approved"
        );

        require(!logbook[tokenId].isLock, "logbook is locked");
        require(bytes(log).length <= MAX_LOG_LENGTH, "log exceeds max length");

        address owner = ERC721.ownerOf(tokenId);
        Log memory newLog = Log(block.timestamp, log, owner);

        logbook[tokenId].logs.push(newLog);
        logbook[tokenId].isLock = true;

        emit LogbookNewLog(tokenId, owner);
    }

    /**
     * @dev Read logbook
     */

    /**
     * @dev Unlock logbook on token transferring
     */
    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) internal virtual override(ERC721) {
    //     super._beforeTokenTransfer(from, to, tokenId); // Call parent hook

    //     require(
    //         _exists(tokenId),
    //         "ERC721: operator query for nonexistent token"
    //     );

    //     logbook[tokenId].isLock = false;
    // }
}
