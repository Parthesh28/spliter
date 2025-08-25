import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Spliter } from "../target/types/spliter";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import crypto from 'crypto'

const SPLIT_SEED = "SPLIT_SEED";

describe("spliter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Spliter as Program<Spliter>;
  const splitAuthority = provider.wallet;
  const receiver = Keypair.generate();
  const name = "Hello";
  
  let hexString = crypto.createHash('sha256').update(name, 'utf-8').digest('hex');
  let name_seed = Uint8Array.from(Buffer.from(hexString, 'hex'));

  it("Creates a split with valid contributors", async () => {
    const contributors = [
      {
        contributor: splitAuthority.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const [splitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );
    
    const splitAmount = new anchor.BN(100_000_000);

    await program.methods
      .createSplit(receiver.publicKey, name, splitAmount, contributors)
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const splitAccount = await program.account.split.fetch(splitPda);

    assert.strictEqual(splitAccount.receiver.toString(), receiver.publicKey.toString());
    assert.strictEqual(splitAccount.splitAmount.toString(), splitAmount.toString());
    splitAccount.contributors.forEach((element, index) => {
      assert.strictEqual(element.clearedAt.toString(), contributors[index].clearedAt.toString());
      assert.strictEqual(element.hasCleared.toString(), contributors[index].hasCleared.toString());
      assert.strictEqual(element.contributor.toString(), contributors[index].contributor.toString());
    });
  });

  it("Fails when percentages don't sum to 100", async () => {

    let flag = false;

    const badContributors = [
      {
        contributor: splitAuthority.publicKey,
        percent: 70,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const [badSplitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    try {
      await program.methods
        .createSplit(receiver.publicKey, name, new anchor.BN(100_000_000), badContributors)
        .accountsStrict({
          split: badSplitPda,
          splitAuthority: splitAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
      flag = true;
    }

    assert.strictEqual(flag, true);
  });


  it("Fails when sending duplicate contributors", async () => {
    let flag = false;

    const badContributors = [
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const [badSplitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );


    try {
      await program.methods
        .createSplit(receiver.publicKey, name, new anchor.BN(100_000_000), badContributors)
        .accountsStrict({
          split: badSplitPda,
          splitAuthority: splitAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
      flag = true;
    }

    assert.strictEqual(flag, true);
  });

  it("Fails when sending no contributors", async () => {
    let flag = false;

    const badContributors = [];

    const [badSplitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    try {
      await program.methods
        .createSplit(receiver.publicKey, name, new anchor.BN(100_000_000), badContributors)
        .accountsStrict({
          split: badSplitPda,
          splitAuthority: splitAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
      flag = true;
    }

    assert.strictEqual(flag, true);
  });

  it("Fails when sending 0% contribution", async () => {
    let flag = false;

    const badContributors = [
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: receiver.publicKey,
        percent: 0,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const [badSplitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    try {
      await program.methods
        .createSplit(receiver.publicKey, name, new anchor.BN(100_000_000), badContributors)
        .accountsStrict({
          split: badSplitPda,
          splitAuthority: splitAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
      flag = true;
    }

    assert.strictEqual(flag, true);
  });

  it("Allows a valid contributor to contribute their share", async () => {
    const splitAuthority = Keypair.generate();
    const receiver = Keypair.generate();
    const contributor = Keypair.generate();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(splitAuthority.publicKey, 1_000_000_000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(contributor.publicKey, 1_000_000_000),
      "confirmed"
    );

    const contributors = [
      {
        contributor: contributor.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const splitAmount = new anchor.BN(100_000_000);

    const [splitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    await program.methods
      .createSplit(receiver.publicKey, name, splitAmount, contributors)
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor])
      .rpc();

    const splitAccount = await program.account.split.fetch(splitPda);

    const owedAmount = 50_000_000;
    const contributorEntry = splitAccount.contributors.find(
      (c) => c.contributor.toBase58() === contributor.publicKey.toBase58()
    );

    assert.ok(contributorEntry.hasCleared);
    assert.ok(contributorEntry.clearedAt.toNumber() > 0);
    assert.strictEqual(splitAccount.receivedAmount.toNumber(), owedAmount);
  });

  it("Does not allow a invalid contributor to contribute", async () => {
    const splitAuthority = Keypair.generate();
    const receiver = Keypair.generate();
    const contributor = Keypair.generate();
    let flag = false;

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(splitAuthority.publicKey, 1_000_000_000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(contributor.publicKey, 1_000_000_000),
      "confirmed"
    );

    const contributors = [
      {
        contributor: contributor.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const splitAmount = new anchor.BN(100_000_000);

    const [splitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    await program.methods
      .createSplit(receiver.publicKey, name, splitAmount, contributors)
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();

    try {
      await program.methods
        .contributeSplit()
        .accountsStrict({
          split: splitPda,
          contributor: contributor.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([receiver])
        .rpc();
    } catch (error) {
      flag = true;
    }
    assert.strictEqual(true, flag);
  });


  it("Does not allow a contributor to contribute again", async () => {
    const splitAuthority = Keypair.generate();
    const receiver = Keypair.generate();
    const contributor = Keypair.generate();
    let flag = false;

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(splitAuthority.publicKey, 1_000_000_000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(contributor.publicKey, 1_000_000_000),
      "confirmed"
    );

    const contributors = [
      {
        contributor: contributor.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: receiver.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const splitAmount = new anchor.BN(100_000_000);

    const [splitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    await program.methods
      .createSplit(receiver.publicKey, name, splitAmount, contributors)
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor])
      .rpc();

    try {
      await program.methods
        .contributeSplit()
        .accountsStrict({
          split: splitPda,
          contributor: contributor.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor])
        .rpc();
    } catch (error) {
      flag = true;
    }
    assert.strictEqual(true, flag);
  });


  it("Releases funds to the receiver after all contributions", async () => {
    const splitAuthority = Keypair.generate();
    const receiver = Keypair.generate();
    const contributor1 = Keypair.generate();
    const contributor2 = Keypair.generate();

    for (let kp of [splitAuthority, contributor1, contributor2]) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(kp.publicKey, 1_000_000_000),
        "confirmed"
      );
    }

    const contributors = [
      {
        contributor: contributor1.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: contributor2.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const splitAmount = new anchor.BN(100_000_000);
    const [splitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    await program.methods
      .createSplit(receiver.publicKey, name, splitAmount, contributors)
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();


    const beforeBalance = await provider.connection.getBalance(receiver.publicKey);

    await program.methods
      .releaseSplit()
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        receiver: receiver.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();

    const afterBalance = await provider.connection.getBalance(receiver.publicKey);

    assert.ok(afterBalance > beforeBalance);
  });

  it("Fail if trying to release to wrong receiver account", async () => {
    const splitAuthority = Keypair.generate();
    const receiver = Keypair.generate();
    const contributor1 = Keypair.generate();
    const contributor2 = Keypair.generate();

    for (let kp of [splitAuthority, contributor1, contributor2]) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(kp.publicKey, 1_000_000_000),
        "confirmed"
      );
    }
    
    const contributors = [
      {
        contributor: contributor1.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: contributor2.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const splitAmount = new anchor.BN(100_000_000);
    const [splitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    await program.methods
      .createSplit(receiver.publicKey, name, splitAmount, contributors)
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();


    const beforeBalance = await provider.connection.getBalance(receiver.publicKey);
    let flag = false;
    try {
      await program.methods
        .releaseSplit()
        .accountsStrict({
          split: splitPda,
          splitAuthority: splitAuthority.publicKey,
          receiver: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([splitAuthority])
        .rpc();
    } catch (error) {
      flag = true;
    }

    assert.strictEqual(true, flag);
  });

  it("Fail if trying to release again", async () => {
    const splitAuthority = Keypair.generate();
    const receiver = Keypair.generate();
    const contributor1 = Keypair.generate();
    const contributor2 = Keypair.generate();

    for (let kp of [splitAuthority, contributor1, contributor2]) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(kp.publicKey, 1_000_000_000),
        "confirmed"
      );
    }

    const contributors = [
      {
        contributor: contributor1.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
      {
        contributor: contributor2.publicKey,
        percent: 50,
        hasCleared: false,
        clearedAt: new anchor.BN(0),
      },
    ];

    const splitAmount = new anchor.BN(100_000_000);
    const [splitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPLIT_SEED), receiver.publicKey.toBuffer(), name_seed],
      program.programId
    );

    await program.methods
      .createSplit(receiver.publicKey, name, splitAmount, contributors)
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    await program.methods
      .contributeSplit()
      .accountsStrict({
        split: splitPda,
        contributor: contributor2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    await program.methods
      .releaseSplit()
      .accountsStrict({
        split: splitPda,
        splitAuthority: splitAuthority.publicKey,
        receiver: receiver.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([splitAuthority])
      .rpc();


    const beforeBalance = await provider.connection.getBalance(receiver.publicKey);
    let flag = false;
    try {
      await program.methods
        .releaseSplit()
        .accountsStrict({
          split: splitPda,
          splitAuthority: splitAuthority.publicKey,
          receiver: receiver.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([splitAuthority])
        .rpc();
    } catch (error) {
      flag = true;
    }

    assert.strictEqual(true, flag);
  });
});