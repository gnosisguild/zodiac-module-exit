// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./CirculatingSupplyBase.sol";

contract CirculatingSupplyERC721 is CirculatingSupplyBase {
    constructor(
        address _owner,
        address _token,
        address[] memory _exclusions
    ) {
        bytes memory initParams = abi.encode(_owner, _token, _exclusions);
        setUp(initParams);
    }

    function get() public view override returns (uint256 circulatingSupply) {
        circulatingSupply = ERC721Enumerable(token).totalSupply();
        if (exclusions[SENTINEL_EXCLUSIONS] != SENTINEL_EXCLUSIONS) {
            address exclusion = exclusions[SENTINEL_EXCLUSIONS];
            while (exclusion != SENTINEL_EXCLUSIONS) {
                circulatingSupply -= ERC721(token).balanceOf(exclusion);
                exclusion = exclusions[exclusion];
            }
        }
        return circulatingSupply;
    }
}
