// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./BatchNFT.sol";

contract PreOrder is BatchNFT {
    struct Participant {
        address sender;
        uint256 amount;
        uint256 time;
    }

    // the key `_nextPreOrder` is incremented with each additional pre-order
    // make sure `_nextPreOrder` starts from 1 instead of 0
    mapping(address => uint256) private _preOrdered;
    mapping(uint256 => Participant) private _preOrders;
    uint256 private _nextPreOrder;
    uint256 private _preOrderAmountTotal;

    // determine whether there is an ongoing pre-order
    bool public inPreOrder;
    // unit (wei)
    uint256 public minAmount;
    // participants allowed
    uint256 public participantsAllowed;

    // error PreOrderNotStarted();
    // error PreOrderAlreadyStarted();
    // error PreOrderExists(address addr);
    // minimum contribution amount allowed shall not be <= 0
    // error IncorrectMinAmount(uint amount);
    // error IncorrectParticipants(uint limit);
    // error MaxParticipantsReached(uint participants);

    constructor(
        string memory name_,
        string memory symbol_,
        uint16 supply_
    ) BatchNFT(name_, symbol_, supply_) {}

    // start pre-order, only allowed by ower
    function startPreOrder(uint256 amount, uint256 participants)
        public
        onlyOwner
    {
        // if (inPreOrder == true) revert PreOrderAlreadyStarted();
        require(inPreOrder == false, "pre-order already started.");
        // min contribution shall always be larger than 0
        // if (amount <= 0) revert IncorrectMinAmount(amount);
        require(amount > 0, "incorrect minimum amount.");

        // if (participants <= 0) revert IncorrectParticipants(participants);
        require(participants > 0, "incorrect number of participants.");

        participantsAllowed = participants;
        minAmount = amount;
        inPreOrder = true;
    }

    // end pre-order, only allowed by ower
    function endPreOrder() public onlyOwner {
        // if (inPreOrder != true) revert PreOrderNotStarted();
        require(inPreOrder == true, "pre-order has not been started.");

        inPreOrder = false;
    }

    // place a pre-order
    function preOrder() public payable {
        // if (inPreOrder != true) revert PreOrderNotStarted();
        require(inPreOrder == true, "pre-order has not been started.");
        // if (_preOrdered[msg.sender] > 0) revert PreOrderExists(msg.sender);
        require(
            _preOrdered[msg.sender] <= 0,
            "pre-order exists for this msg.sender."
        );
        // validation against the minimum contribution amount
        // if (msg.value < minAmount) revert IncorrectMinAmount(msg.value);
        require(msg.value >= minAmount, "incorrect minimum amount.");
        // if (_nextPreOrder > participantsAllowed) revert MaxParticipantsReached(participantsAllowed);
        require(
            _nextPreOrder <= participantsAllowed,
            "maximum participants reached."
        );

        // lets start the index from 1, since default uint in mapping is 0 in _preOrdered
        if (_nextPreOrder == 0) _nextPreOrder = 1;
        _preOrders[_nextPreOrder] = Participant({
            sender: msg.sender,
            amount: msg.value,
            time: block.timestamp
        });
        _preOrdered[msg.sender] = _nextPreOrder;
        _nextPreOrder += 1;
        _preOrderAmountTotal += msg.value;
    }

    // check if an address has placed an order
    function preOrderExist(address addr) public view virtual returns (bool) {
        return _preOrdered[addr] > 0;
    }

    // return participant's pre-order detail
    function preOrderGet(address addr)
        public
        view
        virtual
        returns (Participant memory)
    {
        Participant memory p = _preOrders[_preOrdered[addr]];
        return p;
    }

    // return the number of pre-orders
    function preOrderCount() public view virtual returns (uint256) {
        return _nextPreOrder - 1;
    }

    // return the total amount of pre-orders (wei)
    function preOrderAmountTotal() public view virtual returns (uint256) {
        return _preOrderAmountTotal;
    }

    // return the pre-orders between start and start + limit - 1 (-1 because the index starts from 1)
    function preOrderList(uint256 start, uint256 limit)
        public
        view
        virtual
        returns (Participant[] memory)
    {
        // start index shall be less then next pre-order index
        assert(start > 0 && start < _nextPreOrder);

        uint256 n = limit;
        if (start + limit > _nextPreOrder) n = _nextPreOrder - start;

        Participant[] memory participants = new Participant[](n);
        for (uint256 i = start; i < start + n; i++) {
            participants[i - start] = _preOrders[i];
        }
        return participants;
    }

    // return all pre-orders
    function preOrderListAll()
        public
        view
        virtual
        returns (Participant[] memory)
    {
        Participant[] memory participants = new Participant[](
            _nextPreOrder - 1
        );
        for (uint256 i = 1; i < _nextPreOrder; i++) {
            participants[i - 1] = _preOrders[i];
        }
        return participants;
    }
}
