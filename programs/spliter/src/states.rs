use anchor_lang::prelude::*;

pub const SPLIT_SEED: &str = "SPLIT_SEED";

#[account]
pub struct Split {
    pub split_authority: Pubkey,
    pub split_amount: u64,
    pub contributors: Vec<Spliter>,
    pub reciever: Pubkey,
    pub recieved_amount: u64,
}

#[account]
#[derive(Copy)]
pub struct Spliter{
    pub contributor: Pubkey,
    pub percent: u8,
    pub has_cleared: bool
}

impl Space for Split {
    const INIT_SPACE: usize = 32 + 32 + 8 + 8;
}