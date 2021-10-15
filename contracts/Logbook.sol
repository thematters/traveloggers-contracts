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

    event LogbookNewLog(uint256 tokenId, address sender);

    /**
     * @dev Append a new log to logbook
     *
     * Emits a {LogbookNewLog} event.
     */
    function appendLog(uint256 tokenId_, string calldata message_) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId_),
            "caller is not owner nor approved"
        );
        require(!_logbook[tokenId_].isLocked, "logbook is locked");

        address owner = ERC721.ownerOf(tokenId_);
        Log memory newLog = Log({
            sender: owner,
            message: message_,
            createdAt: block.timestamp
        });

        _logbook[tokenId_].logs.push(newLog);
        _logbook[tokenId_].isLocked = true;

        emit LogbookNewLog(tokenId_, owner);
    }

    /**
     * @dev Read logbook
     */
    function readLogbook(uint256 tokenId_)
        public
        view
        returns (TokenLogbook memory)
    {
        return _logbook[tokenId_];
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
