use anchor_lang::prelude::*;
use crate::errors::*;
use crate::states::*;

pub fn create_split(
    ctx: Context<InitializeSplit>,
    reciever: Pubkey,
    total_amount: u64,
    mut contributors: Vec<Spliter>, 
) -> Result<()> {
    let split = &mut ctx.accounts.split;

    require!(!contributors.is_empty(), SplitError::NoContributors);

    let total_percent: u32 = contributors.iter().map(|c| c.percent as u32).sum();
    require!(total_percent == 100, SplitError::InvalidTotalPercentage);

    for (i, a) in contributors.iter().enumerate() {
        for (j, b) in contributors.iter().enumerate() {
            if i != j && a.contributor == b.contributor {
                return Err(SplitError::DuplicateContributor.into());
            }
        }
    }

    for c in &mut contributors {    
        require!(c.percent > 0, SplitError::ZeroPercentage);
        c.has_cleared = false;
        c.cleared_at = 0;
    }

    split.reciever = reciever;
    split.split_amount = total_amount;
    split.recieved_amount = 0;
    split.is_released = false;
    split.released_at = 0;
    split.split_authority = ctx.accounts.split_authority.key();
    split.bump = ctx.bumps.split;

    split.contributors = contributors;  

    emit!(CreateSplitEvent {
        split: split.key(),
        authority: split.split_authority,
        reciever,
        total_amount,
        contributor_count: split.contributors.len() as u8,
    });

    Ok(())
}


#[derive(Accounts)]
#[instruction(reciever: Pubkey, total_amount: u64, contributors: Vec<Spliter>)]
pub struct InitializeSplit<'info> {
    #[account(mut)]
    pub split_authority: Signer<'info>,
    
    #[account(
        init,
        space = 8 + Split::INIT_SPACE + (4 + (32 + 1 + 1 + 8) * contributors.len()),
        payer = split_authority,
        seeds = [SPLIT_SEED.as_bytes(), split_authority.key().as_ref()],
        bump
    )]
    pub split: Account<'info, Split>,
    
    pub system_program: Program<'info, System>,
}

#[event]
pub struct CreateSplitEvent {
    pub split: Pubkey,
    pub authority: Pubkey,
    pub reciever: Pubkey,
    pub total_amount: u64,
    pub contributor_count: u8,
}