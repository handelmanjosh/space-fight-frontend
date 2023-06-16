import { sendToken, sendTrophies } from '@/components/token';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { io } from 'socket.io-client';


const WalletDisconnectButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
    { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);
export default function LoadWallet() {
    const { publicKey, signTransaction } = useWallet();
    const [offChainKey, setOffChainKey] = useState<string>("");
    const [error, setError] = useState<string>("");
    const claim = () => {
        if (publicKey) {
            const socket = io("http://localhost:3005", {
                autoConnect: false
            });
            socket.connect();
            socket.on("getOffChainUserAndDelete", async (user) => {
                if (user) {
                    console.log(user);
                    await sendToken(process.env.NEXT_PUBLIC_SPEED_TOKEN!, publicKey.toBase58(), user.speedPowerUp);
                    await sendToken(process.env.NEXT_PUBLIC_RECOMBINE_TOKEN!, publicKey.toBase58(), user.recombinePowerUp);
                    await sendToken(process.env.NEXT_PUBLIC_PLACE_VIRUS_TOKEN!, publicKey.toBase58(), user.placeVirusPowerUp);
                    await sendToken(process.env.NEXT_PUBLIC_SIZE_TOKEN!, publicKey.toBase58(), user.sizePowerUp);
                    await sendTrophies(publicKey, user.trophies);
                    await sendToken(process.env.NEXT_PUBLIC_MASS_TOKEN!, publicKey.toBase58(), user.mass);
                } else {
                    setError("User not found");
                }
                socket.disconnect();
            });
            socket.emit("getOffChainUserAndDelete", offChainKey);
        } else {
            setError("Please connect a web3 wallet!");
        }
    };
    return (
        <div className="w-full h-full flex flex-col justify-start items-center">
            <div className="flex flex-row justify-between items-center w-full p-4">
                <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text p-1 bg-gradient-to-tr from-[#9945FF] to-[#14F195]">Agar.sol</h1>
                <div className="flex flex-row justify-center items-center gap-4">
                    <a className="text-lg font-bold hover:underline hover:cursor-pointer" onClick={() => window.location.href = "/"}>Play now!</a>
                    <WalletMultiButtonDynamic />
                    <WalletDisconnectButtonDynamic />
                </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-8 w-full">
                <input
                    className="appearance-none outline-none border-2 bg-black border-white rounded-md p-2 w-96 text-center text-lg font-bold"
                    onChange={(event: any) => setOffChainKey(event.target.value)}
                    value={offChainKey}
                    placeholder="Enter your off chain key"
                    required
                />
                {error !== "" ?
                    <p className="text-center text-red-600 text-lg font-bold">{error}</p>
                    :
                    <></>
                }
                <button className="rounded-lg px-8 py-4 bg-yellow-400 hover:brightness-90 active:brightness-75" onClick={claim}>Claim</button>
            </div>
        </div>
    );
} 