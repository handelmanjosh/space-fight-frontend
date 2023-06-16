import { Account, AuthorityType, createMint, createSetAuthorityInstruction, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";
import { Connection, clusterApiUrl, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, PublicKeyInitData } from "@solana/web3.js";
import { Socket } from "socket.io-client";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const privateKey = [88, 137, 216, 188, 173, 220, 96, 176, 27, 19, 90, 175, 206, 27, 135, 64, 206, 141, 223, 127, 131, 255, 163, 163, 212, 219, 197, 71, 85, 123, 250, 134, 251, 192, 136, 116, 41, 238, 57, 58, 190, 227, 181, 100, 236, 18, 57, 81, 213, 130, 93, 186, 232, 80, 241, 222, 147, 110, 219, 8, 163, 185, 168, 48];
export const nfts: [string, string][] = [["HQfhhshaSvE1wBvWqEXaNEewCEcF3mLAbo19sEq1Ug9A", "/canada.png"], ["YKmbpTwTjzai1GH91SgxzRuTNV9mowkeVM1cymBM9Nj", "/china.jpg"], ["8pZDopNiYaS7UTzVigAHR9sVbSHV3D43MHn89bMgk9Ki", "/sg.png"], ["6R6WZh8MpKNY5kHSvabKEKSsUig8Hu83Xb3BDhQrcVs2", "/uk.png"], ["D6dfYUK78iBnwzHXCeQZUJE99nDAcUGjXY28u7EHoxnM", "/us.webp"]];

export async function fullMintNFT() {
    const { mint, fromTokenAccount } = await createNft();
    await mintNft(mint, fromTokenAccount);
    await lockNft(mint);

    fetch("http://localhost:3005/nft",
        {
            method: "POST",
            body: JSON.stringify({
                nft_address: mint.toBase58(),
            }),
            headers: { "Content-Type": "application/json" }
        }
    ).then(response => {
        if (response.status == 200) {
            console.log("NFT created");
        } else {
            console.error("Error occurred");
        }
    });
}
export async function getNftsFromWallet(publicKey: PublicKey) {
    // Fetch account info
    const accountInfo = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program id
    });

    if (accountInfo.value.length === 0) {
        console.log('No token accounts found.');
    }
    const result: [string, string][] = [];
    accountInfo.value.forEach((account) => {
        const token = account.account.data.parsed.info.tokenAmount;
        const mint = account.account.data.parsed.info.mint;
        const index = nfts.indexOf(mint);
        if (index > -1 && token > 0) {
            result.push(nfts[index]);
        }
    });
    return result;
}
export async function sendNFT(destination: PublicKey, mintAddr: string) {
    const mint = new PublicKey(mintAddr);
    const fromWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, fromWallet.publicKey);
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, destination);
    console.log(`Sending user 1 nft`);
    const signature = await transfer(
        connection,
        fromWallet,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet,
        1
    );
    console.log(`Signature: ${signature}`);

}
export async function swapNFT() {
    //not needed yet
}
export async function createNft() {
    // const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
    // await connection.confirmTransaction(fromAirdropSignature);
    const fromWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
    // Create new NFT mint
    let mint: PublicKey = await createMint(
        connection,
        fromWallet,
        fromWallet.publicKey,
        null,
        0 // only allow whole tokens
    );

    console.log(`Create NFT: ${mint.toBase58()}`);

    // Get the NFT account of the fromWallet address, and if it does not exist, create it
    let fromTokenAccount: Account = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
    );

    console.log(`Create NFT Account: ${fromTokenAccount.address.toBase58()}`);
    return { mint, fromTokenAccount };
}

export async function mintNft(mint: PublicKey, fromTokenAccount: Account) {
    const fromWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
    const signature = await mintTo(
        connection,
        fromWallet,
        mint,
        fromTokenAccount.address,
        fromWallet.publicKey,
        1
    );
    console.log(`Mint signature: ${signature}`);
}

export async function lockNft(mint: PublicKey) {
    const fromWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
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


