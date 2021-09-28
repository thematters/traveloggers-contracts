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

    // TBC: add pre-order status field?
    struct Participant {
        address sender;
        uint deposit;
        uint8 round;
    } 
    
    // the key `_preOrderIt` is incremented with each additional pre-order
    // make sure `_preOrderIt` starts from 1 instead of 0
    mapping(address => uint) private _preOrdered;
    mapping(uint => Participant) private _preOrders;
    uint private _nextPreOrder;
    // TBC: add depositedTotal

    // current round for pre-ordering, reserved, if only 1 round, then, this value can always be 1
    // TBC: whether remove `_round` attribute？
    uint8 private _round; 

    // determine whether there is an ongoing pre-order 
    bool public inPreOrder;

    error PreOrderNotStarted();
    error PreOrderAlreadyStarted();
    // error - the round shall be sequential the owner shall not trigger an incorrect round
    error IncorrectRound(uint8 previousRound);
    error PreOrderExists(address addr);

    // `round` argument is required make sure the owner knows what he is doing
    function startPreOrder(uint8 round) public onlyOwner {
        if (inPreOrder == true) revert PreOrderAlreadyStarted();
        // only reopen existing round, or start next round        
        if (round == 0) revert IncorrectRound(_round);
        if (round != _round && round != _round + 1) revert IncorrectRound(_round);
        
        inPreOrder = true;
        _round = round;
    }

    // `round` argument is required to make sure the owner knows which round he is closing
    function endPreOrder(uint8 round) public onlyOwner {
        if (inPreOrder != true) revert PreOrderNotStarted();
        if (round != _round) revert IncorrectRound(_round);
        
        inPreOrder = false;
    } 

    function preOrder() public payable {
        if (inPreOrder != true) revert PreOrderNotStarted();
        if (_preOrdered[msg.sender] > 0) revert PreOrderExists(msg.sender);
        // TBC: do we need to check the same round for the same address?
        // TBC: what is the validation against the amount

        // lets start the index from 1, since default uint in mapping is 0 in _preOrdered
        if (_nextPreOrder == 0) _nextPreOrder = 1; 
        _preOrders[_nextPreOrder] = Participant({
            sender: msg.sender, deposit: msg.value, round: _round
        });
        _preOrdered[msg.sender] = _nextPreOrder;
        _nextPreOrder += 1;
    }

    function preOrderQuery(address addr) public view virtual returns (bool) {
        return _preOrdered[addr] > 0;        
    }  

    function currentRound() public view onlyOwner returns (uint8) {
        if (inPreOrder != true) revert PreOrderNotStarted();
        return _round;
    }

    // function preOrderParticipants () public view returns (uint)
}