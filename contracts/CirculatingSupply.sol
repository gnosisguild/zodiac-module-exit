// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.4;

contract CirculatingSupply {
    uint256 public circulatingSupply;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(uint256 _circulatingSupply, address _owner) {
        circulatingSupply = _circulatingSupply;
        owner = _owner;
    }

    function set(uint256 _circulatingSupply) public onlyOwner {
        circulatingSupply = _circulatingSupply;
    }

    function get() public view returns (uint256) {
        return circulatingSupply;
    }
}
