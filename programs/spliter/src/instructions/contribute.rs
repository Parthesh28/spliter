use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;

pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
    let split = &mut ctx.accounts.split;
    let contributor_key = ctx.accounts.contributor.key();

    let maybe_index = split
        .contributors
        .iter()
        .position(|s| s.contributor == contributor_key);
    require!(maybe_index.is_some(), SplitError::NotAContributor);

    let index = maybe_index.unwrap();

    require!(
        !split.contributors[index].has_cleared,
        SplitError::AlreadyCleared
    );

    let owed_amount =
        (split.split_amount as u128 * split.contributors[index].percent as u128 / 100) as u64;

    require!(
        ctx.accounts.contributor.lamports() >= owed_amount,
        SplitError::InsufficientFunds
    );

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.contributor.to_account_info(),
            to: split.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, owed_amount)?;

    split.contributors[index].has_cleared = true;
    split.contributors[index].cleared_at = Clock::get()?.unix_timestamp;

    split.received_amount = split
        .received_amount
        .checked_add(owed_amount)
        .ok_or(SplitError::ArithmeticOverflow)?;

    emit!(ContributeEvent {
        split: split.key(),
        contributor: contributor_key,
        amount: owed_amount,
        total_received: split.received_amount,
        has_cleared: true,
        cleared_at: split.contributors[index].cleared_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub split: Account<'info, Split>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct ContributeEvent {
    pub split: Pubkey,
    pub contributor: Pubkey,
    pub amount: u64,
    pub total_received: u64,
    pub has_cleared: bool,
    pub cleared_at: i64,
}