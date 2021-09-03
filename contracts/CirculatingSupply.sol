// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CirculatingSupply is Ownable {
    uint256 public circulatingSupply;

    constructor(uint256 _circulatingSupply) {
        bytes memory initParams = abi.encode(_circulatingSupply);
        setUp(initParams);
    }

    function set(uint256 _circulatingSupply) public onlyOwner {
        circulatingSupply = _circulatingSupply;
    }

    function get() public view returns (uint256) {
        return circulatingSupply;
    }

    function setUp(bytes memory initializeParams) public {
        require(!initialized, "Contract is already initialized");
        initialized = true;
        uint256 _circulatingSupply = abi.decode(initializeParams, (uint256));
        circulatingSupply = _circulatingSupply;
    }
}
