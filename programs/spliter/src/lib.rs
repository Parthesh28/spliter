use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("sPitpiqrhcuAgu8Ss9Bv2YEpkYhnKdDQeSYW65DSMcd");

#[program]
pub mod spliter {
    use super::*;

    pub fn create_split(
        ctx: Context<InitializeSplit>,
        receiver: Pubkey,
        name: String,
        total_amount: u64,
        contributors: Vec<states::Spliter>,
    ) -> Result<()> {
        create(ctx, receiver, name, total_amount, contributors)
    }

    pub fn contribute_split(ctx: Context<Contribute>) -> Result<()> {
        contribute(ctx)
    }

    pub fn release_split(ctx: Context<ReleasePayment>) -> Result<()> {
        release(ctx)
    }
}