use anchor_lang::prelude::*;

#[error_code]
pub enum SplitError {
    #[msg("Split does not exist")]
    SplitNotFound,
    #[msg("Split target not yet reached")]
    TargetNotReached,
    #[msg("Contributors do not match")]
    ContributorCountMismatch,
    #[msg("Contributor account is invalid")]
    InvalidContributorAccount,
     #[msg("Unauthorized: Only split authority can perform this action")]
    Unauthorized,
    #[msg("Invalid receiver account")]
    InvalidReceiver,
    #[msg("Insufficient funds in split account for release")]
    InsufficientFundsForRelease,
    #[msg("You need to be part of the split")]
    NotAContributor,
    #[msg("You have already cleared the amount")]
    AlreadyCleared,
    #[msg("Insufficient Funds")]
    InsufficientFunds,
    #[msg("Contributors list cannot be empty")]
    NoContributors,
    #[msg("Total percentage must equal 100")]
    InvalidTotalPercentage,
    #[msg("Duplicate contributor found")]
    DuplicateContributor,
    #[msg("Contributor percentage cannot be zero")]
    ZeroPercentage
}
