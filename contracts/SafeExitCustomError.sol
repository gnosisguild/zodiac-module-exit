// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Enum {
    enum Operation {
        Call,
        DelegateCall
    }
}

interface Executor {
    /// @dev Allows a Module to execute a transaction.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);
}

contract SafeExitCustomError {
    Executor public executor;
    ERC20 public designatedToken;
    uint256 public circulatingSupply;

    event SafeExitModuleSetup(address indexed initiator, address indexed safe);

    /// Designated token address can not be zero
    error DesignatedTokenCannotBeZero();

    /// Module is already initialized
    error ModuleAlreadyInitialized();

    /// Token `token` is denied
    /// @param token balance available.
    error InvalidToken(address token);

    /// `unacceptedAddress` is not authorized to execute transaction. Transaction must be triggered by executor of contract
    /// @param unacceptedAddress address that tried to execute the transaction
    error NotAuthorized(address unacceptedAddress);

    /// Token `deniedToken` can not be added twice in the list of denied tokens
    /// @param deniedToken token that is already denied
    error TokenAlreadyDenied(address deniedToken);

    /// Token `token` is not added in the denied tokens list
    /// @param token token that is not added
    error TokenNotDenied(address token);

    /// Owner does not have `expectedBalance` of token with address `token`
    /// @param token address of token without enough balance
    error NotEnoughBalance(address token);

    /// Error on exit execution
    error ExitError();

    /// Error on token transfer
    /// @param token token where transfer failed
    error TransferError(address token);

    /// @notice Mapping of denied tokens defined by the executor
    mapping(address => bool) public deniedTokens;

    modifier executorOnly() {
        if (msg.sender != address(executor)) revert NotAuthorized(msg.sender);
        _;
    }

    /// @dev Iterates on deniedTokens list to check if one of the requested tokens is added
    /// @param tokens Tokens requested to be claimed
    modifier onlyValidTokens(address[] calldata tokens) {
        for (uint8 i; i < tokens.length; i++) {
            if (deniedTokens[tokens[i]]) revert InvalidToken(tokens[i]);
        }
        _;
    }

    constructor(
        Executor _executor,
        address _designatedToken,
        uint256 _circulatingSupply
    ) {
        setUp(_executor, _designatedToken, _circulatingSupply);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param _executor Address of the executor (e.g. a Safe)
    /// @param _designatedToken Address of the ERC20 token that will define the share of users
    /// @param _circulatingSupply Circulating Supply of designated token
    /// @notice Designated token address can not be zero
    function setUp(
        Executor _executor,
        address _designatedToken,
        uint256 _circulatingSupply
    ) public {
        if (address(executor) != address(0)) revert ModuleAlreadyInitialized();
        if (_designatedToken == address(0)) {
            revert DesignatedTokenCannotBeZero();
        }
        executor = _executor;
        designatedToken = ERC20(_designatedToken);
        circulatingSupply = _circulatingSupply;

        emit SafeExitModuleSetup(msg.sender, address(_executor));
    }

    function exit(address[] calldata tokens) public onlyValidTokens(tokens) {
        // 0x449b8acb - bytes4(keccak256("executeCheckout(address[],address)"))
        bytes memory data = abi.encodeWithSelector(
            0x449b8acb,
            tokens,
            msg.sender
        );

        bool success = executor.execTransactionFromModule(
            address(this),
            0,
            data,
            Enum.Operation.Call
        );
        if (!success) revert ExitError();
    }

    function transferToken(address token, address leaver) private {
        uint256 ownerBalance = ERC20(token).balanceOf(address(executor));
        uint256 leaverBalance = ERC20(designatedToken).balanceOf(leaver);

        if (ownerBalance == 0) revert NotEnoughBalance(token);

        uint256 amount = (leaverBalance * ownerBalance) / circulatingSupply;
        // 0xa9059cbb - bytes4(keccak256("transfer(address,uint256)"))
        bytes memory data = abi.encodeWithSelector(0xa9059cbb, leaver, amount);

        bool success = executor.execTransactionFromModule(
            token,
            0,
            data,
            Enum.Operation.Call
        );
        if (!success) revert TransferError(token);
    }

    function executeCheckout(address[] calldata tokens, address leaver)
        public
        executorOnly
    {
        for (uint8 i = 0; i < tokens.length; i++) {
            transferToken(tokens[i], leaver);
        }
        uint256 leaverBalance = designatedToken.balanceOf(leaver);

        // 0x23b872dd - bytes4(keccak256("transferFrom(address,address,uint256)"))
        bytes memory data = abi.encodeWithSelector(
            0x23b872dd,
            leaver,
            address(executor),
            leaverBalance
        );
        bool success = executor.execTransactionFromModule(
            address(designatedToken),
            0,
            data,
            Enum.Operation.Call
        );
        if (!success) revert ExitError();
    }

    /// @dev Add a batch of token addresses to denied tokens list
    /// @param tokens Batch of addresses to add into the denied token list
    /// @notice Can not add duplicate token address or it will throw
    function addToDenylist(address[] calldata tokens) external executorOnly {
        for (uint8 i; i < tokens.length; i++) {
            if (deniedTokens[tokens[i]]) {
                revert TokenAlreadyDenied(tokens[i]);
            }
            deniedTokens[tokens[i]] = true;
        }
    }

    /// @dev Remove a batch of token addresses from denied tokens list
    /// @param tokens Batch of addresses to be removed from the denied token list
    /// @notice If a non denied token address is passed, the function will throw
    function removeFromDenylist(address[] calldata tokens)
        external
        executorOnly
    {
        for (uint8 i; i < tokens.length; i++) {
            if (!deniedTokens[tokens[i]]) {
                revert TokenNotDenied(tokens[i]);
            }
            deniedTokens[tokens[i]] = false;
        }
    }

    /// @dev Change the designated token address variable
    /// @param _token Address of new designated token
    /// @notice Designated token address can not be zero
    function setDesignatedToken(address _token) public {
        if (_token == address(0)) {
            revert DesignatedTokenCannotBeZero();
        }
        designatedToken = ERC20(_token);
    }

    function setCirculatingSupply(uint256 _circulatingSupply)
        external
        executorOnly
    {
        circulatingSupply = _circulatingSupply;
    }

    function getCirculatingSupply() public view returns (uint256) {
        return circulatingSupply;
    }
}
