use anchor_lang::prelude::*;
use crate::instructions::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("sPitpiqrhcuAgu8Ss9Bv2YEpkYhnKdDQeSYW65DSMcd");

#[program]
pub mod spliter {
    use super::*;

    pub fn create_split_x(
        ctx: Context<InitializeSplit>,
        reciever: Pubkey,
        total_amount: u64,
        contributors: Vec<states::Spliter>,
    ) -> Result<()> {
        create_split(ctx, reciever, total_amount, contributors)
    }

    pub fn contribute_x(ctx: Context<Contribute>) -> Result<()> {
        contribute(ctx)
    }

    pub fn release_payment_x(ctx: Context<ReleasePayment>) -> Result<()> {
        release_payment(ctx)
    }
}