// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./BatchNFT.sol";

abstract contract PreOrder is BatchNFT {
    using Counters for Counters.Counter;

    struct Participant {
        address addr;
        uint256 amount;
        uint256 time;
    }

    // the key `_preOrderIndex` is incremented with each additional pre-order
    // make sure `_preOrderIndex` starts from 1 instead of 0
    // make sure `_preOrderMintIndex` starts from 1, and always less or equal to `_preOrderMintIndex`
    mapping(address => uint256) private _preOrdered;
    mapping(uint256 => Participant) private _preOrders;
    Counters.Counter private _preOrderIndex;
    Counters.Counter private _preOrderMintIndex;

    // determine whether there is an ongoing pre-order
    bool public inPreOrder;
    // unit (wei)
    uint256 public minAmount;
    // participants allowed
    uint256 public participantsAllowed;
    // total amount pre-ordered
    uint256 public preOrderAmountTotal;

    // set minimum contribution amount
    function setMinAmount(uint256 amount_) public onlyOwner {
        minAmount = amount_;
    }

    // set the number of participants allowed
    function setParticipants(uint256 participants_) public onlyOwner {
        require(participants_ <= totalSupply, "incorrect participants");
        participantsAllowed = participants_;
    }

    // start or stop pre-order
    function setInPreOrder(bool start_) public onlyOwner {
        if (start_ == true) {
            require(minAmount > 0, "zero amount");
            // number of participants shall be less or equal to the number of supplied NFTs
            require(
                participantsAllowed > 0 && participantsAllowed <= totalSupply,
                "incorrect participants"
            );
            inPreOrder = true;
        } else {
            inPreOrder = false;
        }
    }

    // place a pre-order
    function preOrder() public payable {
        require(inPreOrder == true, "pre-order not started");
        require(_preOrdered[msg.sender] <= 0, "already ordered");
        // validation against the minimum contribution amount
        require(msg.value >= minAmount, "amount too small");
        require(
            _preOrderIndex.current() < participantsAllowed,
            "reach participants limit"
        );

        // lets start the index from 1, since default uint in mapping is 0 in _preOrdered
        _preOrderIndex.increment();
        _preOrders[_preOrderIndex.current()] = Participant({
            addr: msg.sender,
            amount: msg.value,
            time: block.timestamp
        });
        _preOrdered[msg.sender] = _preOrderIndex.current();
        preOrderAmountTotal += msg.value;
    }

    // batch mint to pre-order participants
    // @batchSize_ - to limit unbound loop
    function preOrderBatchMint(uint16 batchSize_) public onlyOwner {
        // shall be after pre-order
        require(inPreOrder == false, "still in pre-order");
        require(
            _preOrderIndex.current() >=
                _preOrderMintIndex.current() + batchSize_,
            "batch too large"
        );

        // lets start the index from 1, since default uint in mapping is 0 in _preOrdered
        for (uint16 i = 0; i < batchSize_; i++) {
            _tokenIds.increment();
            _preOrderMintIndex.increment();

            uint256 newItemId = _tokenIds.current();
            address addr = _preOrders[_preOrderMintIndex.current()].addr;
            _safeMint(addr, newItemId);
        }
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

    // return the number of minted
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
