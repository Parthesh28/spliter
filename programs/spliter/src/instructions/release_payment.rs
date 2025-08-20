use anchor_lang::prelude::*;
use crate::{errors::SplitError, states::*};

pub fn release_payment(ctx: Context<ReleasePayment>) -> Result<()> {
    let split = &mut ctx.accounts.split;
    
    require!(
        split.split_authority == ctx.accounts.split_authority.key(),
        SplitError::Unauthorized
    );
    
    require!(
        split.recieved_amount >= split.split_amount,
        SplitError::TargetNotReached
    );
    
    let split_balance = split.to_account_info().lamports();
    let rent_exempt_minimum = Rent::get()?.minimum_balance(split.to_account_info().data_len());
    
    let releasable_amount = split_balance
        .checked_sub(rent_exempt_minimum)
        .ok_or(SplitError::InsufficientFundsForRelease)?;
    
    **split.to_account_info().try_borrow_mut_lamports()? -= releasable_amount;
    **ctx.accounts.reciever.try_borrow_mut_lamports()? += releasable_amount;
    
    split.recieved_amount = 0;
    
    for contributor in &mut split.contributors {
        contributor.has_cleared = false;
    }
    
    emit!(ReleasePaymentEvent {
        split: split.key(),
        reciever: ctx.accounts.reciever.key(),
        amount: releasable_amount,
    });
    
    Ok(())
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    #[account(
        mut,
        has_one = split_authority @ SplitError::Unauthorized,
        has_one = reciever @ SplitError::InvalidReceiver,
        close = split_authority
    )]
    pub split: Account<'info, Split>,
    
    #[account(mut)]
    pub split_authority: Signer<'info>,
    
    #[account(mut)]
    pub reciever: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[event]
pub struct ReleasePaymentEvent {
    pub split: Pubkey,
    pub reciever: Pubkey,
    pub amount: u64,
}