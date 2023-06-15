import { Account, AuthorityType, createMint, createSetAuthorityInstruction, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { Connection, clusterApiUrl, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const fromWallet = Keypair.generate();
let mint: PublicKey;
let fromTokenAccount: Account;

export async function createNft() {
    const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(fromAirdropSignature);

    // Create new NFT mint
    mint = await createMint(
        connection,
        fromWallet,
        fromWallet.publicKey,
        null,
        0 // only allow whole tokens
    );

    console.log(`Create NFT: ${mint.toBase58()}`);

    // Get the NFT account of the fromWallet address, and if it does not exist, create it
    fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
    );

    console.log(`Create NFT Account: ${fromTokenAccount.address.toBase58()}`);
}

export async function mintNft() {
    const signature = await mintTo(
        connection,
        fromWallet,
        mint, fromTokenAccount.address,
        fromWallet.publicKey,
        1
    );
    console.log(`Mint signature: ${signature}`);
}

export async function lockNft() {
    let transaction = new Transaction().add(
        createSetAuthorityInstruction(
            mint,
            fromWallet.publicKey,
            AuthorityType.MintTokens,
            null
        )
    );
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
    console.log(`Lock signature: ${signature}`);
}


