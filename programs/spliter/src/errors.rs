use anchor_lang::prelude::*;

#[error_code]
pub enum SplitError {
    #[msg("Split not found")]
    SplitNotFound,

    #[msg("Split name exceeds maximum allowed length (50 characters)")]
    NameTooLong,

    #[msg("Split name should atleast contain 1 character")]
    InvalidName,

    #[msg("Math overflow occurred")]
    ArithmeticOverflow,

    #[msg("Target amount not yet reached")]
    TargetNotReached,

    #[msg("Missing or invalid bump")]
    InvalidBump,

    #[msg("Contributor count mismatch")]
    ContributorCountMismatch,

    #[msg("Invalid contributor account")]
    InvalidContributorAccount,

    #[msg("Contributor count should be less than 255")]
    TooManyContributors,

    #[msg("Unauthorized action")]
    Unauthorized,

    #[msg("Invalid receiver account")]
    InvalidReceiver,

    #[msg("Insufficient funds in split account")]
    InsufficientFunds,

    #[msg("Caller is not a contributor")]
    NotAContributor,

    #[msg("Contribution already settled")]
    AlreadyCleared,

    #[msg("Contributors list cannot be empty")]
    NoContributors,

    #[msg("Total contribution percentage must equal 100")]
    InvalidTotalPercentage,

    #[msg("Duplicate contributor detected")]
    DuplicateContributor,

    #[msg("Contributor percentage must be greater than zero")]
    ZeroPercentage,
}