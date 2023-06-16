import BuyButton from '@/components/BuyButton';
import { InGamePowerUp } from '@/components/PowerUp';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { use, useEffect, useState } from 'react';
import { checkBalance, fullMint, getMassTokens, getMyTokens, sendToken, swapTokens } from "@/components/token";
import { getNftsFromWallet, nfts, sendNFT } from '@/components/nft';
import NFTModal from '@/components/NFTModal';
import NFTBuyButton from '@/components/NFTBuyButton';

const WalletDisconnectButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
    { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);
const tokenPrices: { name: string, price: number, reward: number, rewardName: string; }[] = [
    { name: "Mass", price: 5000, reward: 1, rewardName: "SpeedPowerUp" },
    { name: "Mass", price: 7500, reward: 1, rewardName: "SizePowerUp" },
    { name: "Mass", price: 10000, reward: 1, rewardName: "Recombine" },
    { name: "Mass", price: 15000, reward: 1, rewardName: "PlaceVirus" }
];
export default function Shop() {
    const { publicKey, signTransaction } = useWallet();
    const [myTokens, setMyTokens] = useState<{ name: string, num: number, use: () => any; }[]>([]);
    const [totalMass, setTotalMass] = useState<number>(0);
    const [myNfts, setMyNfts] = useState<{ address: string, image: string, click: () => any; }[]>([]);
    const [shopNfts, setShopNfts] = useState<{ address: string, image: string, click: () => any; }[]>([]);

    useEffect(() => {
        if (publicKey) {
            getMyTokens(publicKey.toBase58()).then(tokens => {
                const myTokens: { name: string, num: number, use: () => any; }[] = [];
                for (const token of tokens) {
                    myTokens.push({
                        name: token[0], num: token[1], use: () => null
                    });
                }
                setMyTokens(myTokens);
                //socket.emit("loadPowerUps", tokens);
            });
            getMassTokens(publicKey.toBase58()).then(massTokens => {
                setTotalMass(massTokens);
            });
            const finalNfts: { address: string, image: string, img: HTMLImageElement, click: () => any; }[] = [];
            nfts.forEach(nft => {
                const myImg = document.createElement("img");
                myImg.src = nft[1];
                finalNfts.push({
                    address: nft[0], image: nft[1], img: myImg, click: () => {
                        sendNFT(publicKey, nft[0]).then(response => {
                            console.log(response);
                        }).catch(err => console.error(err));
                    }
                });
            });
            setShopNfts(finalNfts);
            getNftsFromWallet(publicKey).then(nfts => {
                const finalNfts: { address: string, image: string, click: () => any; }[] = [];
                for (const nft of nfts) {
                    const myImg = document.createElement("img");
                    myImg.src = nft[1];
                    finalNfts.push({
                        address: nft[0], image: nft[1], click: () => null
                    });
                }
                setMyNfts(finalNfts);
            });
        }
    }, [publicKey]);
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
            <div className="flex flex-col justify-center items-center gap-20 w-full">
                <p className="text-center text-5xl font-bold text-transparent bg-clip-text p-1 bg-gradient-to-tr from-pink-600 to-yellow-500">{`${totalMass} $MASS`}</p>
                <div className="flex flex-row justify-start items-center w-[90%]">
                    <div className="flex flex-col justify-center items-center w-[40%] gap-6">
                        <p className="text-2xl">Token Shop</p>
                        <div className="flex flex-grow w-full">
                            <div className="grid grid-cols-4 gap-2 w-full place-items-center">
                                {tokenPrices.map((price, i: number) => (
                                    <BuyButton
                                        {...price}
                                        key={i}
                                        signTransaction={signTransaction!}
                                        address={publicKey?.toBase58() || ""}
                                        changeBuy={setTotalMass}
                                        changeSell={setMyTokens}
                                        currentSell={myTokens}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-center w-[20%] gap-6">
                        <p className="text-2xl">NFT marketplace</p>
                        <div className="flex flex-grow w-full">
                            <div className="grid grid-cols-2 w-full place-items-center">
                                {shopNfts.map((nft, i: number) => (
                                    <NFTBuyButton image={nft.image} click={nft.click} price={100000} key={i} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-center w-[30%] gap-6">
                        <p className="text-2xl">Your wallet</p>
                        <div className="grid grid-cols-2 w-full gap-2 place-items-center">
                            {myTokens.map((token, i: number) => (
                                <InGamePowerUp {...token} keyString="" key={i} />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 w-full gap-2">
                            {myNfts.map((nft, i: number) => (
                                <NFTModal {...nft} key={i}>
                                    <img src={nft.image} className="rounded-full aspect-square" />
                                </NFTModal>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
