// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./BatchNFT.sol";

/**
 * @dev Contract that allows token owner to read and write logbook
 */
abstract contract Logbook is BatchNFT {
    struct Log {
        address sender;
        string message;
        uint256 createdAt;
    }
    struct TokenLogbook {
        Log[] logs;
        bool isLocked;
    }

    // Mapping from token ID to logbook
    mapping(uint256 => TokenLogbook) private _logbook;

    uint8 public constant MAX_LOG_LENGTH = 140;

    event LogbookNewLog(uint256 tokenId, address sender);

    /**
     * @dev Append a new log to logbook
     *
     * Emits a {LogbookNewLog} event.
     */
    function appendLog(uint256 tokenId, string calldata message) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not owner nor approved"
        );
        require(!_logbook[tokenId].isLocked, "logbook is locked");
        require(
            bytes(message).length <= MAX_LOG_LENGTH,
            "log exceeds max length"
        );

        address owner = ERC721.ownerOf(tokenId);
        Log memory newLog = Log({
            sender: owner,
            message: message,
            createdAt: block.timestamp
        });

        _logbook[tokenId].logs.push(newLog);
        _logbook[tokenId].isLocked = true;

        emit LogbookNewLog(tokenId, owner);
    }

    /**
     * @dev Read logbook
     */
    function readLogbook(uint256 tokenId)
        public
        view
        returns (TokenLogbook memory)
    {
        return _logbook[tokenId];
    }

    /**
     * @dev Unlock logbook on token transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId); // Call parent hook

        _logbook[tokenId].isLocked = false;
    }
}