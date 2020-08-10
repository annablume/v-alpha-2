pragma solidity ^0.6.6;

/**
    @title An open source smart contract for a UBI token with demurrage that
        gives control of the currency to the community, with adjustable
        parameters.
    @author The Value Instrument Team
    @notice 
    @dev This contract was developed for solc 0.6.6
*/

import "./lib/contracts-ethereum-package/token/ERC20/ERC20Burnable.sol";
import "./lib/contracts-ethereum-package/math/SafeMath.sol";
import "./FusedController.sol";
import "./lib/contracts-ethereum-package/Initializable.sol";
import "./Calculations.sol";
// import "./IVICoin.sol";

struct Settings {
    // number of blocks until balance decays to zero
    uint256 lifetime;
    // blocks between each generation period
    uint256 generationPeriod;
    // tokens issued to each account at each generation period
    uint256 generationAmount;
    // starting balance for a new account
    uint256 initialBalance;
    // contribution % taken from the transaction fee on every transfer
    uint256 communityContribution;
    // transaction fee % taken from every transfer
    uint256 transactionFee;
    // account that receives the contribution payments
    address communityContributionAccount;
}

/// @notice One contract is deployed for each community
/// @dev Based on openzeppelin's burnable and mintable ERC20 tokens
contract VICoin is Initializable, ERC20BurnableUpgradeSafe, FusedController {
    using SafeMath for uint256;
    using SafeMath for int256;

    Settings settings;
    mapping(address => uint256) public lastTransactionBlock;
    mapping(address => uint256) public lastGenerationBlock;
    mapping(address => uint256) public zeroBlock;
    mapping(address => bool) public accountApproved;
    uint256 public numAccounts;

    event TransferSummary(
        address indexed from,
        address indexed to,
        uint256 value,
        uint256 feesBurned,
        uint256 contribution,
        uint256 payoutSender,
        uint256 payoutRecipient
    );
    event VerifyAccount(address indexed account);
    event UnapproveAccount(address account);
    event Log(string name, uint256 value);

    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _lifetime,
        uint256 _generationAmount,
        uint256 _generationPeriod,
        uint256 _communityContribution,
        uint256 _transactionFee,
        uint256 _initialBalance,
        address _communityContributionAccount,
        address _controller
    ) public initializer {
        FusedController.initialize(_controller);
        __ERC20_init(_name, _symbol);

        address communityContributionAccount = _communityContributionAccount;
        if (_communityContributionAccount == address(0)) {
            communityContributionAccount = msg.sender;
        }

        settings.lifetime = _lifetime;
        settings.generationAmount = _generationAmount;
        settings.generationPeriod = _generationPeriod;
        settings.communityContribution = _communityContribution;
        settings.transactionFee = _transactionFee;
        settings.initialBalance = _initialBalance;
        settings.communityContributionAccount = _communityContributionAccount;

        numAccounts = 0;
    }

    receive() external payable {
        revert("Do not send money to the contract");
    }

    /// @notice Manually trigger an onchain update of the live balance
    function triggerOnchainBalanceUpdate(address _account)
        public
        returns (uint256)
    {
        // 1. Decay the balance
        uint256 decay = Calculations.calcDecay(
            lastTransactionBlock[_account],
            balanceOf(_account),
            block.number,
            zeroBlock[_account]
        );
        uint256 decayedBalance;
        if (decay > 0) {
            // decayedBalance = burnAt(_account, decay);
            _burn(_account, decay);
            decayedBalance = balanceOf(_account);
        } else {
            decayedBalance = balanceOf(_account);
        }

        // 2. Generate tokens
        uint256 generationAccrued;
        if (accountApproved[_account]) {
            // Calculate the accrued generation, taking into account decay
            generationAccrued = Calculations.calcGeneration(
                block.number,
                lastGenerationBlock[_account],
                settings.lifetime,
                settings.generationAmount,
                settings.generationPeriod
            );

            if (generationAccrued > 0) {
                // Issue the generated tokens
                _mint(_account, generationAccrued);

                // Record the last generation block
                lastGenerationBlock[_account] += Calculations
                    .calcNumCompletedPeriods(
                    block
                        .number,
                    lastGenerationBlock[_account],
                    settings
                        .generationPeriod
                )
                    .mul(settings.generationPeriod);

                // Extend the zero block
                zeroBlock[_account] = Calculations.calcZeroBlock(
                    generationAccrued,
                    decayedBalance,
                    block.number,
                    settings.lifetime,
                    zeroBlock[_account]
                );
            }
        }
        // Record the last transaction block
        if (decay > 0 || generationAccrued > 0) {
            lastTransactionBlock[_account] = block.number;
        }
        return generationAccrued;
    }

    /** @notice Return the real balance of the account, as of this block
        @return Latest balance */
    function liveBalanceOf(address _account) public view returns (uint256) {
        uint256 decay = Calculations.calcDecay(
            lastTransactionBlock[_account],
            balanceOf(_account),
            block.number,
            zeroBlock[_account]
        );
        uint256 decayedBalance = balanceOf(_account).sub(decay);
        if (lastGenerationBlock[_account] == 0) {
            return (decayedBalance);
        }
        uint256 generationAccrued = 0;
        if (accountApproved[_account]) {
            generationAccrued = Calculations.calcGeneration(
                block.number,
                lastGenerationBlock[_account],
                settings.lifetime,
                settings.generationAmount,
                settings.generationPeriod
            );
        }
        return decayedBalance.add(generationAccrued);
    }

    /////////////////
    // Transfer
    /////////////////

    /** @notice Transfer the currency from one account to another,
                updating each account to reflect the time passed, and the
                effects of the transfer
        @return Success */
    function transfer(address _to, uint256 _value)
        public
        override
        returns (bool)
    {
        uint256 feesBurned;
        uint256 contribution;
        // Process generation and decay for sender
        emit Log("Sender balance before update", balanceOf(msg.sender));
        uint256 generationAccruedSender = triggerOnchainBalanceUpdate(
            msg.sender
        );
        emit Log("Sender balance after update", balanceOf(msg.sender));

        // Process generation and decay for recipient
        emit Log("Recipient balance before update", balanceOf(_to));
        uint256 generationAccruedRecipient = triggerOnchainBalanceUpdate(_to);
        emit Log("Recipient balance after update", balanceOf(_to));

        require(
            balanceOf(msg.sender) >= _value,
            "Not enough balance to make transfer"
        );

        // Process fees and contribution
        (feesBurned, contribution) = processFeesAndContribution(
            _value,
            settings.transactionFee,
            settings.communityContribution
        );
        uint256 valueAfterFees = _value.sub(feesBurned).sub(contribution);

        //Extend zero block based on transfer
        zeroBlock[_to] = Calculations.calcZeroBlock(
            valueAfterFees,
            balanceOf(_to),
            block.number,
            settings.lifetime,
            zeroBlock[_to]
        );

        /* If they haven't already been updated (during decay or generation),
            then update the lastTransactionBlock for both sender and recipient */
        if (lastTransactionBlock[_to] != block.number) {
            lastTransactionBlock[_to] = block.number;
        }
        if (lastTransactionBlock[msg.sender] != block.number) {
            lastTransactionBlock[msg.sender] = block.number;
        }

        ERC20UpgradeSafe.transfer(_to, valueAfterFees);
        emit TransferSummary(
            msg.sender,
            _to,
            valueAfterFees,
            feesBurned,
            contribution,
            generationAccruedSender,
            generationAccruedRecipient
        );
        return true;
    }

    /// @notice transferFrom disabled
    function transferFrom(
        address,
        address,
        uint256
    ) public override returns (bool) {
        revert("transferFrom disabled");
    }

    /** @notice Calculate the fees and contribution, send contribution to the communtiy account,
            and burn the fees
        @dev Percentage to x dp as defined by contributionFeeDecimals e.g.
            when contributionFeeDecimals is 2, 1200 is 12.00%
        @return The total amount used for fees and contribution */
    function processFeesAndContribution(
        uint256 _value,
        uint256 _transactionFee,
        uint256 _communityContribution
    ) internal returns (uint256, uint256) {
        uint256 feesIncContribution = Calculations.calcFeesIncContribution(
            _value,
            _transactionFee
        );
        uint256 contribution = Calculations.calcContribution(
            _value,
            _transactionFee,
            _communityContribution
        );
        uint256 feesToBurn = Calculations.calcFeesToBurn(
            _value,
            _transactionFee,
            _communityContribution
        );
        require(
            feesIncContribution == contribution.add(feesToBurn),
            "feesIncContribution should equal contribution + feesToBurn"
        );

        if (feesToBurn > 0) {
            ERC20BurnableUpgradeSafe.burn(feesToBurn);
        }

        if (contribution > 0) {
            super.transfer(settings.communityContributionAccount, contribution);
        }

        return (feesToBurn, contribution);
    }

    /////////////////
    // Approving / unapproving accounts
    /////////////////

    /** @notice Unapprove the specified account so that it no longer receives
        generation */
    function unapproveAccount(address _account)
        external
        onlyController
        fused(6)
    {
        accountApproved[_account] = false;
        emit UnapproveAccount(_account);
    }

    /** @notice Create a new account with the specified role
        @dev New accounts can always be created.
            This function can't be disabled. */
    function verifyAccount(address _account) external onlyController {
        accountApproved[_account] = true;
        if (
            settings.initialBalance > 0 && lastTransactionBlock[_account] == 0
        ) {
            // This is a new account !
            numAccounts++;
            _mint(_account, settings.initialBalance);
            zeroBlock[_account] = block.number.add(settings.lifetime);
            lastTransactionBlock[_account] = block.number;
        }
        lastGenerationBlock[_account] = block.number;
        emit VerifyAccount(_account);
        emit TransferSummary(
            address(this),
            _account,
            settings.initialBalance,
            0,
            0,
            0,
            0
        );
    }

    /////////////////
    // Getters
    /////////////////

    /** @notice Get the number of tokens issued to each account after each
            generation period
        @return Number of tokens issued during generation */
    function getGenerationAmount() public view returns (uint256) {
        return settings.generationAmount;
    }

    /// @notice Used only for debugging
    function getDetails(address _account)
        public
        view
        returns (
            uint256 _lastBlock,
            uint256 _balance,
            uint256 _zeroBlock
        )
    {
        _lastBlock = lastTransactionBlock[_account];
        _balance = balanceOf(_account);
        _zeroBlock = zeroBlock[_account];
    }

    /** @notice Return the current block number
        @return Current block number */
    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }
}
