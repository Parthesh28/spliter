use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;

pub fn release(ctx: Context<ReleasePayment>) -> Result<()> {
    let split = &mut ctx.accounts.split;

    require!(
        split.split_authority == ctx.accounts.split_authority.key(),
        SplitError::Unauthorized
    );

    require!(
        split.received_amount >= split.split_amount,
        SplitError::TargetNotReached
    );

    require!(!split.is_released, SplitError::AlreadyCleared);

    let rent_exempt_minimum = Rent::get()?.minimum_balance(split.to_account_info().data_len());

    let releasable_amount = split.split_amount;

    require!(
        split.to_account_info().lamports() >= releasable_amount + rent_exempt_minimum,
        SplitError::InsufficientFunds
    );

    **split.to_account_info().try_borrow_mut_lamports()? -= releasable_amount;
    **ctx
        .accounts
        .receiver
        .to_account_info()
        .try_borrow_mut_lamports()? += releasable_amount;

    split.is_released = true;
    split.released_at = Clock::get()?.unix_timestamp;

    emit!(ReleasePaymentEvent {
        split: split.key(),
        receiver: ctx.accounts.receiver.key(),
        amount: releasable_amount,
        released_at: split.released_at,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    #[account(
        mut,
        has_one = split_authority @ SplitError::Unauthorized,
        has_one = receiver @ SplitError::InvalidReceiver
    )]
    pub split: Account<'info, Split>,

    #[account(mut)]
    pub split_authority: Signer<'info>,

    /// CHECK: receiver account
    #[account(mut)]
    pub receiver: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct ReleasePaymentEvent {
    pub split: Pubkey,
    pub receiver: Pubkey,
    pub amount: u64,
    pub released_at: i64,
}