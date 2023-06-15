import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getMint, getAccount, transfer, Account } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { formatWithOptions } from "util";
import { getNameByAddress } from "./utils";

//to make sure we don't lose the token addresses. These are all devnet tokens
// NEXT_PUBLIC_MASS_TOKEN="3wrcCKWMqaQanNf6E3h9oxCYeH5nrFBW3nNuyowZK4ec"

// NEXT_PUBLIC_PLACE_VIRUS_TOKEN="MgD9jkmR1nkQ4TpNdThuEEFKbkJ7Ff9JczQHV3xHaaT"

// NEXT_PUBLIC_SPEED_TOKEN="ChGH51osShe32B9CUdCCCzgsU9J7jGhgpAKwzd5PCFgS"

// NEXT_PUBLIC_SIZE_TOKEN="8D78ZkdEMfSzBdzHpYSfKUnF96ZyfmP8AdCoH1FZFUc5"

// NEXT_PUBLIC_RECOMBINE_TOKEN="8RgpX1aJoHTSBUnX1W8GsDw1P2LuAg75DuSzTGHz2A9U"

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const privateKey = [88, 137, 216, 188, 173, 220, 96, 176, 27, 19, 90, 175, 206, 27, 135, 64, 206, 141, 223, 127, 131, 255, 163, 163, 212, 219, 197, 71, 85, 123, 250, 134, 251, 192, 136, 116, 41, 238, 57, 58, 190, 227, 181, 100, 236, 18, 57, 81, 213, 130, 93, 186, 232, 80, 241, 222, 147, 110, 219, 8, 163, 185, 168, 48];
export async function fullMint() {
  const { tokenAccount, mint, wallet } = await createToken();
  await mintToken(wallet, mint, tokenAccount);
  await checkBalance(mint.toBase58());
  console.log(
    `TOKEN DATA: token address: ${mint}, 
  token account: ${tokenAccount.address} 
  wallet: ${wallet} 
  public key: ${wallet.publicKey} 
  secret key: ${wallet.secretKey}
  associated token account : ${(await getOrCreateAssociatedTokenAccount(connection, wallet, mint, wallet.publicKey)).address.toBase58()}
  `
  );
}
export async function createToken() {
  const fromWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
  console.log(fromWallet.publicKey.toBase58());
  let mint: PublicKey;
  let fromTokenAccount: Account;
  //const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
  //await connection.confirmTransaction(fromAirdropSignature);
  mint = await createMint(connection, fromWallet, fromWallet.publicKey, null, 9);
  console.log(`Create token: ${mint.toBase58()}`);

  fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );
  console.log(`Token account: ${fromTokenAccount.address.toBase58()}`);

  return { tokenAccount: fromTokenAccount, mint: mint, wallet: fromWallet };
}
export async function mintToken(fromWallet: Keypair, mint: PublicKey, fromTokenAccount: Account) {
  const signature = await mintTo(
    connection,
    fromWallet,
    mint,
    fromTokenAccount.address,
    fromWallet.publicKey,
    //we have 9 decimal points, same as sol, so we have the same amount of lamports as a SOL
    100000000 * LAMPORTS_PER_SOL
  );
  console.log(`Mint signature ${signature}`);
}
export async function checkBalance(mint: string) {
  const fromWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
  const mintKey = new PublicKey(mint);
  const mintInfo = await getMint(connection, mintKey);
  console.log(`Supply: ${mintInfo.supply}`);
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mintKey, fromWallet.publicKey);
  const tokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
  console.log(tokenAccountInfo.amount);
}
export async function sendToken(mint: string, address: string, amount: number) {
  const fromWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
  const toWallet = new PublicKey(address);
  const mintKey = new PublicKey(mint);
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mintKey, fromWallet.publicKey);
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mintKey, toWallet);
  console.log(`Sending user ${amount * LAMPORTS_PER_SOL} tokens`);
  const signature = await transfer(
    connection,
    fromWallet,
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet.publicKey,
    amount * LAMPORTS_PER_SOL
  );
  console.log(`Signature: ${signature}`);
}
export async function recieveToken(address: string) {

}

export async function getMyTokens(address: string): Promise<[string, number][]> {
  const publicKey = new PublicKey(address);

  // Fetch account info
  const accountInfo = await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program id
  });

  if (accountInfo.value.length === 0) {
    console.log('No token accounts found.');
  }
  const result: [string, number][] = [];
  accountInfo.value.forEach((account) => {
    const token = account.account.data.parsed.info.tokenAmount;
    const mint = account.account.data.parsed.info.mint;
    const name = getNameByAddress(mint);
    if (name) {
      result.push([name, token.amount / LAMPORTS_PER_SOL]);
    }
  });
  return result;
}

export async function getMassTokens(address: string): Promise<number> {
  const publicKey = new PublicKey(address);

  // Fetch account info
  const accountInfo = await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program id
  });
  const targetToken = process.env.NEXT_PUBLIC_MASS_TOKEN!;
  let total = 0;
  accountInfo.value.forEach((account) => {
    const amount = account.account.data.parsed.info.tokenAmount.amount;
    const mint = account.account.data.parsed.info.mint;
    if (mint === targetToken) {
      total = amount / LAMPORTS_PER_SOL;
    }
  });
  return total;
}