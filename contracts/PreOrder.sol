// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract PreOrder is Ownable {
    // TBC: 
    // - whether an address can participant multiple times (seems not)
    // - whether need to store pre-order status (e.g. pending, canceled, avater-minted)
    // - the owner shall be able to list all pre-order participants, which cannot be achieved with mapping

    // stage-1: basic functions to append pre-orders, and query an array of addresses
    // stage-2: think about the TBCs

    struct Participant {
        address sender;
        uint amount;
    } 
    
    // the key `_preOrderIt` is incremented with each additional pre-order
    // make sure `_preOrderIt` starts from 1 instead of 0
    mapping(address => uint) private _preOrdered;
    mapping(uint => Participant) private _preOrders;
    uint private _nextPreOrder;
    // TBC: add depositedTotal

    // determine whether there is an ongoing pre-order 
    bool public inPreOrder;
    // unit (wei)
    uint public minAmount;
    // participants allowed
    uint256 public participantsAllowed;

    error PreOrderNotStarted();
    error PreOrderAlreadyStarted();
    error PreOrderExists(address addr);
    // minimum contribution amount allowed shall not be <= 0
    error IncorrectMinAmount(uint amount);
    error IncorrectParticipants(uint limit);
    error MaxParticipantsReached(uint participants);

    function startPreOrder(uint amount, uint participants) public onlyOwner {
        if (inPreOrder == true) revert PreOrderAlreadyStarted();
        // min contribution shall always be larger than 0
        if (amount <= 0) revert IncorrectMinAmount(amount);
        if (participants <= 0) revert IncorrectParticipants(participants);

        participantsAllowed = participants;
        minAmount = amount;    
        inPreOrder = true;
    }

    function endPreOrder() public onlyOwner {
        if (inPreOrder != true) revert PreOrderNotStarted();
        
        inPreOrder = false;
    } 

    function preOrder() public payable {
        if (inPreOrder != true) revert PreOrderNotStarted();
        if (_preOrdered[msg.sender] > 0) revert PreOrderExists(msg.sender);
        // validation against the minimum contribution amount
        if (msg.value < minAmount) revert IncorrectMinAmount(msg.value);
        if (_nextPreOrder > participantsAllowed) revert MaxParticipantsReached(participantsAllowed);

        // lets start the index from 1, since default uint in mapping is 0 in _preOrdered
        if (_nextPreOrder == 0) _nextPreOrder = 1; 
        _preOrders[_nextPreOrder] = Participant({
            sender: msg.sender, amount: msg.value
        });
        _preOrdered[msg.sender] = _nextPreOrder;
        _nextPreOrder += 1;
    }

    function preOrderQuery(address addr) public view virtual returns (bool) {
        return _preOrdered[addr] > 0;        
    }  

    // function preOrderAmount(address addr) public view virtual return (uint) {
    //     if (_preOrdered[addr] > 0) {}
    // }

    // function preOrderParticipants () public view returns (uint)
}