// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";


contract CirculatingSupplyERC721 is OwnableUpgradeable {
    event ExclusionAdded(uint256 indexed tokenId);
    event ExclusionRemoved(uint256 indexed tokenId);
    event CollectionSet(address indexed newCollection);

    ERC721Enumerable public collection;
    uint256 internal constant SENTINEL_EXCLUSIONS = 2 ** 256 - 1;

    // Mapping of excluded addresses
    bool zeroExcluded = false;
    mapping(uint256 => uint256) internal exclusions;

    constructor(
        address _owner,
        address _collection,
        uint256[] memory _exclusions
    ) {
        bytes memory initParams = abi.encode(_owner, _collection, _exclusions);
        setUp(initParams);
    }

    function setUp(bytes memory initializeParams) public {
        (address _owner, address _collection, uint256[] memory _exclusions) = abi
        .decode(initializeParams, (address, address, uint256[]));
        __Ownable_init();
        transferOwnership(_owner);
        setupExclusions();
        collection = ERC721Enumerable(_collection);

        for (uint256 i = 0; i < _exclusions.length; i++) {
            _exclude(_exclusions[i]);
        }
    }

    function get() public view returns (uint256 circulatingSupply) {
        circulatingSupply = ERC721Enumerable(collection).totalSupply();
        if (zeroExcluded) {
            circulatingSupply--;
        }
        if (exclusions[SENTINEL_EXCLUSIONS] != SENTINEL_EXCLUSIONS) {
            uint256 exclusion = exclusions[SENTINEL_EXCLUSIONS];
            while (exclusion != SENTINEL_EXCLUSIONS) {
                circulatingSupply--;
                exclusion = exclusions[exclusion];
            }
        }
        return circulatingSupply;
    }

    // @dev Sets the token to calculate circulating supply of
    // @param _collection collection to calculate circulating supply of
    // @notice This can only be called by the owner
    function setCollection(address _collection) public onlyOwner {
        collection = ERC721Enumerable(_collection);
        emit CollectionSet(_collection);
    }

    function setupExclusions() internal {
        require(
            exclusions[SENTINEL_EXCLUSIONS] == 0,
            "setupExclusions has already been called"
        );
        exclusions[SENTINEL_EXCLUSIONS] = SENTINEL_EXCLUSIONS;
    }

    // @dev Enables the balance of an address from the circulatingSupply calculation
    // @param exclusion Address to be excluded
    // @notice This can only be called by the owner
    function exclude(uint256 exclusion) external onlyOwner {
        _exclude(exclusion);
    }

    function _exclude(uint256 exclusion) private {
        require(
            exclusion != SENTINEL_EXCLUSIONS,
            "Invalid exclusion"
        );
        require(
            exclusions[exclusion] == 0 || (exclusion == 0 && !zeroExcluded),
            "Exclusion already enabled"
        );
        if (exclusion == 0) {
            zeroExcluded = true;
            emit ExclusionAdded(exclusion);
            return;
        }
        assert(exclusion != 0);
        exclusions[exclusion] = exclusions[SENTINEL_EXCLUSIONS];
        exclusions[SENTINEL_EXCLUSIONS] = exclusion;
        emit ExclusionAdded(exclusion);
    }

    // @dev Removes an excluded address
    // @param prevExclusion Exclusion that pointed to the exclusion to be removed in the linked list
    // @param exclusion Exclusion to be removed
    // @notice This can only be called by the owner
    function removeExclusion(uint256 prevExclusion, uint256 exclusion)
    public
    onlyOwner
    {
        require(
            exclusion != SENTINEL_EXCLUSIONS,
            "Invalid exclusion"
        );
        if (exclusion == 0) {
            // Handle special case (zero)
            require(zeroExcluded, "Exclusion already disabled");
            zeroExcluded = false;
            emit ExclusionRemoved(exclusion);
            return;
        }
        assert(exclusion != 0);

        require(
            exclusions[prevExclusion] == exclusion,
            "Exclusion already disabled"
        );
        exclusions[prevExclusion] = exclusions[exclusion];
        exclusions[exclusion] = 0;
        emit ExclusionRemoved(exclusion);
    }

    // @dev Returns if an exclusion is enabled
    // @return True if the exclusion is enabled
    function isExcluded(uint256 _exclusion) public view returns (bool) {
        return SENTINEL_EXCLUSIONS != _exclusion && (
        (_exclusion == 0 && zeroExcluded) ||
        (_exclusion != 0 && exclusions[_exclusion] != 0)
        );
    }

    // @dev Returns array of exclusions.
    // @param start Start of the page.
    // @param pageSize Maximum number of exclusions that should be returned.
    // @return array Array of exclusions.
    // @return next Start of the next page.
    function getExclusionsPaginated(uint256 start, uint256 pageSize)
    public
    view
    returns (uint256[] memory array, uint256 next)
    {
        uint256 exclusionCount = 0;
        array = new uint256[](pageSize);

        if (zeroExcluded && start == SENTINEL_EXCLUSIONS) {
            array[exclusionCount] = 0;
            exclusionCount++;
        }

        uint256 currentExclusion = exclusions[start];
        while (
            currentExclusion != 0 &&
            currentExclusion != SENTINEL_EXCLUSIONS &&
            exclusionCount < pageSize
        ) {
            array[exclusionCount] = currentExclusion;
            currentExclusion = exclusions[currentExclusion];
            exclusionCount++;
        }
        next = currentExclusion;

        // Set correct size of returned array
        // solhint-disable-next-line no-inline-assembly
        assembly {
            mstore(array, exclusionCount)
        }
    }
}
