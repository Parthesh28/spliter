use anchor_lang::prelude::*;

pub const SPLIT_SEED: &str = "SPLIT_SEED";

#[account]
pub struct Split {
    pub split_authority: Pubkey,
    pub reciever: Pubkey,
    pub split_amount: u64,
    pub contributors: Vec<Spliter>,
    pub recieved_amount: u64,
    pub is_released: bool,           
    pub released_at: i64,   
    pub bump: u8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct Spliter {
    pub contributor: Pubkey,
    pub percent: u8,
    pub has_cleared: bool,
    pub cleared_at: i64,
}

impl Space for Split {
    const INIT_SPACE: usize = 32 + 32 + 8 + 8 + 1 + 1 + 8;
}