// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Lottery.sol";
import "./Logbook.sol";

contract Matty is Lottery, Logbook {
    constructor() BatchNFT("Matty", "MATT", 500) {}
}
