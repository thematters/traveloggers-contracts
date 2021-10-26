// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./BatchNFT.sol";

abstract contract PreOrder is BatchNFT {
    using Counters for Counters.Counter;
    // safe division
    using SafeMath for uint256;

    // participant struct
    // - addr: participant wallet address
    // - amount: total wei amount spent by the participant
    // - time: timestamp of last order
    // - n: number of NFTs ordered
    struct Participant {
        address addr;
        uint256 amount;
        uint256 time;
        uint256 n;
    }

    // the key `_preOrderIndex` is incremented with each additional pre-order
    // make sure `_preOrderIndex` starts from 1 instead of 0
    mapping(address => uint256) private _preOrdered;
    mapping(uint256 => Participant) private _preOrders;
    Counters.Counter private _preOrderIndex;
    // record the number of NFTs minted during pre-order
    Counters.Counter private _preOrderMintIndex;

    // determine whether there is an ongoing pre-order
    bool public inPreOrder;
    // unit (wei)
    uint256 public preOrderMinAmount;
    // participants allowed
    uint256 public preOrderParticipantsAllowed;
    // number of NTFs per participant can order
    uint256 public constant preOrderLimit = 5;
    // total amount pre-ordered
    uint256 public preOrderAmountTotal;

    // set minimum contribution amount
    function setPreOrderMinAmount(uint256 amount_) public onlyOwner {
        preOrderMinAmount = amount_;
    }

    // set the number of participants allowed
    function setPreOrderParticipants(uint256 participants_) public onlyOwner {
        require(participants_ <= totalSupply, "incorrect participants");
        preOrderParticipantsAllowed = participants_;
    }

    // start or stop pre-order
    function setInPreOrder(bool start_) public onlyOwner {
        if (start_ == true) {
            require(preOrderMinAmount > 0, "zero amount");
            // number of participants shall be less or equal to the number of supplied NFTs
            require(
                preOrderParticipantsAllowed > 0 &&
                    preOrderParticipantsAllowed <= totalSupply,
                "incorrect participants"
            );
            inPreOrder = true;
        } else {
            inPreOrder = false;
        }
    }

    // place a pre-order
    function preOrder() public payable {
        // TODO shall not exceed total supply
        require(inPreOrder == true, "pre-order not started");
        // require(_preOrdered[msg.sender] <= 0, "already ordered"); // commented because a participant can order multiple times now
        // validation against the minimum contribution amount
        require(msg.value >= preOrderMinAmount, "amount too small");
        // shall be reverted on zero minimum amount
        uint256 numNFT = msg.value.div(
            preOrderMinAmount,
            "zero minimum amount"
        );
        require(
            _preOrderMintIndex.current() + numNFT <= totalSupply,
            "reach total supply"
        );

        if (_preOrdered[msg.sender] <= 0) {
            // shall not exceed allowed participants
            require(
                _preOrderIndex.current() < preOrderParticipantsAllowed,
                "reach participants limit"
            );
            // shall not exceed pre-order limit
            require(numNFT <= preOrderLimit, "reach order limit");
            // lets start the index from 1, since default uint in mapping is 0 in _preOrdered
            // if the participant never ordered before
            _preOrderIndex.increment();
            _preOrders[_preOrderIndex.current()] = Participant({
                addr: msg.sender,
                amount: msg.value,
                time: block.timestamp,
                n: numNFT
            });
            _preOrdered[msg.sender] = _preOrderIndex.current();
        } else {
            // shall not exceed pre-order limit
            require(
                numNFT + _preOrders[_preOrdered[msg.sender]].n <= preOrderLimit,
                "reach order limit"
            );

            // if the participant has ordered before
            _preOrders[_preOrdered[msg.sender]].amount += msg.value;
            _preOrders[_preOrdered[msg.sender]].n += numNFT;
            _preOrders[_preOrdered[msg.sender]].time = block.timestamp;
        }

        for (uint256 i = 0; i < numNFT; i++) {
            _tokenIds.increment();
            _preOrderMintIndex.increment();

            uint256 newItemId = _tokenIds.current();
            _safeMint(msg.sender, newItemId);
        }
        preOrderAmountTotal += msg.value;
    }

    // check if an address has placed an order
    function preOrderExist(address addr_) public view virtual returns (bool) {
        return _preOrdered[addr_] > 0;
    }

    // return participant's pre-order detail
    function preOrderGet(address addr_)
        public
        view
        virtual
        returns (Participant memory)
    {
        Participant memory p = _preOrders[_preOrdered[addr_]];
        return p;
    }

    // return the number of pre-orders
    function preOrderIndex() public view virtual returns (uint256) {
        return _preOrderIndex.current();
    }

    // return the number NFTs of minted in pre-order
    function preOrderMintIndex() public view virtual returns (uint256) {
        return _preOrderMintIndex.current();
    }

    // return the pre-orders between start and start + limit - 1 (-1 because the index starts from 1)
    function preOrderList(uint256 startIndex_, uint256 limit_)
        public
        view
        virtual
        returns (Participant[] memory)
    {
        // start index shall be less then next pre-order index
        assert(startIndex_ > 0 && startIndex_ <= _preOrderIndex.current());

        uint256 n = limit_;
        if (startIndex_ - 1 + limit_ > _preOrderIndex.current())
            n = _preOrderIndex.current() - (startIndex_ - 1);

        Participant[] memory participants = new Participant[](n);
        for (uint256 i = startIndex_; i < startIndex_ + n; i++) {
            participants[i - startIndex_] = _preOrders[i];
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
            _preOrderIndex.current()
        );
        for (uint256 i = 1; i <= _preOrderIndex.current(); i++) {
            participants[i - 1] = _preOrders[i];
        }
        return participants;
    }
}
