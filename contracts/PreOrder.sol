// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./BatchNFT.sol";

abstract contract PreOrder is BatchNFT {
    using Counters for Counters.Counter;

    // participant struct
    // - addr: participant wallet address
    // - amount: total wei amount spent by the participant
    // - time: timestamp of last order
    // - n: number of NFTs ordered
    // NOTE: amount, time removed to reduce gas
    // struct Participant {
    //     address addr;
    //     uint256 n;
    // }

    // the key `_preOrderIndex` is incremented with each additional pre-order
    // make sure `_preOrderIndex` starts from 1 instead of 0
    // mapping(address => uint256) private _preOrdered;
    // mapping(uint256 => Participant) private _preOrders;
    mapping(address => uint256) private _preOrders;
    Counters.Counter private _preOrderIndex;
    // record the number of NFTs minted during pre-order
    Counters.Counter private _preOrderMintIndex;

    // number of NTFs per participant can order
    uint256 public constant preOrderLimit = 5;
    // determine whether there is an ongoing pre-order
    bool public inPreOrder;
    // unit (wei)
    uint256 public preOrderMinAmount;
    // participants allowed
    uint256 public preOrderSupply;

    // set minimum contribution amount
    function setPreOrderMinAmount(uint256 amount_) public onlyOwner {
        preOrderMinAmount = amount_;
    }

    // set the number of pre-order supplied NFTs
    function setPreOrderSupply(uint256 supply_) public onlyOwner {
        require(supply_ <= totalSupply, "incorrect pre-order supply");
        preOrderSupply = supply_;
    }

    // start or stop pre-order
    // @param start_: start or end pre-order flag
    // @param amount_: minimum contribution amount
    // @param supply_: pre-order supply
    function setInPreOrder(
        bool start_,
        uint256 amount_,
        uint256 supply_
    ) public onlyOwner {
        if (start_ == true) {
            require(amount_ > 0, "zero amount");
            // number of pre-order supply shall be less or equal to the number of total supply
            require(
                supply_ > 0 && supply_ <= totalSupply,
                "incorrect pre-order supply"
            );
            preOrderMinAmount = amount_;
            preOrderSupply = supply_;
            inPreOrder = true;
        } else {
            inPreOrder = false;
        }
    }

    // place a pre-order
    // @param n - number of NFTs to order
    function preOrder(uint256 n) public payable {
        require(inPreOrder == true, "pre-order not started");
        require(preOrderMinAmount > 0, "zero minimum amount");
        // require(_preOrdered[msg.sender] <= 0, "already ordered"); // commented because a participant can order multiple times now
        // validation against the minimum contribution amount
        require(
            n > 0 && msg.value >= preOrderMinAmount * n,
            "amount too small"
        );
        // shall not exceed pre-order supply
        require(
            _preOrderMintIndex.current() + n <= preOrderSupply,
            "reach pre-order supply"
        );
        // require(
        //     _preOrderMintIndex.current() + n <= totalSupply,
        //     "reach total supply"
        // );

        if (_preOrders[msg.sender] <= 0) {
            // shall not exceed pre-order limit
            require(n <= preOrderLimit, "reach order limit");
            // lets start the index from 1, since default uint in mapping is 0 in _preOrdered
            // if the participant never ordered before
            _preOrderIndex.increment();
            _preOrders[msg.sender] = n;
        } else {
            // shall not exceed pre-order limit
            require(
                n + _preOrders[msg.sender] <= preOrderLimit,
                "reach order limit"
            );

            // if the participant has ordered before
            _preOrders[msg.sender] += n;
        }

        for (uint256 i = 0; i < n; i++) {
            _tokenIds.increment();
            _preOrderMintIndex.increment();

            uint256 newItemId = _tokenIds.current();
            _safeMint(msg.sender, newItemId);
        }
    }

    // check if an address has placed an order
    function preOrderExist(address addr_) public view virtual returns (bool) {
        return _preOrders[addr_] > 0;
    }

    // return participant's pre-order detail
    function preOrderGet(address addr_) public view virtual returns (uint256) {
        uint256 p = _preOrders[addr_];
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

    // // return the pre-orders between start and start + limit - 1 (-1 because the index starts from 1)
    // function preOrderList(uint256 startIndex_, uint256 limit_)
    //     public
    //     view
    //     virtual
    //     returns (Participant[] memory)
    // {
    //     // start index shall be less then next pre-order index
    //     assert(startIndex_ > 0 && startIndex_ <= _preOrderIndex.current());

    //     uint256 n = limit_;
    //     if (startIndex_ - 1 + limit_ > _preOrderIndex.current())
    //         n = _preOrderIndex.current() - (startIndex_ - 1);

    //     Participant[] memory participants = new Participant[](n);
    //     for (uint256 i = startIndex_; i < startIndex_ + n; i++) {
    //         participants[i - startIndex_] = _preOrders[i];
    //     }
    //     return participants;
    // }

    // // return all pre-orders
    // function preOrderListAll()
    //     public
    //     view
    //     virtual
    //     returns (Participant[] memory)
    // {
    //     Participant[] memory participants = new Participant[](
    //         _preOrderIndex.current()
    //     );
    //     for (uint256 i = 1; i <= _preOrderIndex.current(); i++) {
    //         participants[i - 1] = _preOrders[i];
    //     }
    //     return participants;
    // }
}
