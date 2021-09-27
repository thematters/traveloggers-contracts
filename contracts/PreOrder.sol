// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

abstract contract PreOrder {
    // TBC: 
    // - whether to support unique addresses using Set-like data structure
    // - whether need to store pre-order amount (probably not, as pre-order is for the purpose of whitelist)
    // - whether need to store pre-order status (e.g. pending, canceled, avater-minted)
    // - the owner shall be able to list all pre-order participants, which cannot be achieved with mapping

    // stage-1: basic functions to append to, and query an array of addresses
    // stage-2: think about the TBCs
    mapping(address => bool) private _preOrderAddrs;

    function preOrder(address _addr) public {
        _preOrderAddrs[_addr] = true;
    }

    function queryPreOrder(address _addr) public view virtual returns (bool) {
        return _preOrderAddrs[_addr];        
    }
}