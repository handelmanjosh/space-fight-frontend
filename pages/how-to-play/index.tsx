import dynamic from 'next/dynamic';

const WalletDisconnectButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
    { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);
export default function HowToPlay() {
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
            <div className="flex flex-col justify-start overflow-y-auto items-center gap-4">
                <StyledTextBlock title="How do I play?">
                    Move your mouse to move your cell! Eat other cells by covering them.
                </StyledTextBlock>
                <StyledTextBlock title="Where's the web3 integration?">
                    All items in this game are tokens on solana! You can buy and sell them using your solana wallet.
                </StyledTextBlock>
                <StyledTextBlock title="How can I set up a Solana wallet?">
                    Visit <a href="https://phantom.app/" className="underline bg-clip-text p-1 hover:text-orange-500 hover:cursor-pointer">phantom.app</a> to set up a wallet.
                </StyledTextBlock>
                <StyledTextBlock title="How do I earn $MASS?">
                    You earn $MASS by eating and growing your cell
                </StyledTextBlock>
                <StyledTextBlock title="How do I earn power up tokens?">
                    You earn power up tokens by collecting power ups in game!
                </StyledTextBlock>
                <StyledTextBlock title="How do I earn $TROPHY?">
                    You earn $TROPHY by rising to the top of the leaderboard!
                </StyledTextBlock>
                <StyledTextBlock title="How can I use $MASS?">
                    You can use $MASS to buy powerups, which can be used to help you grow faster!
                </StyledTextBlock>
                <StyledTextBlock title="How can I use my powerups?">
                    Click on your powerups to move them to your in game wallet! {`They'll then be usable in game`}
                </StyledTextBlock>
                <StyledTextBlock title="How can I use $TROPHY?">
                    You can us $TROPHY to buy NFT skins, which will be completely unique to you!
                </StyledTextBlock>
                <StyledTextBlock title="Can I trade items on secondary marketplaces?">
                    Of course! Swaps for all game tokens will be set up shortly.
                </StyledTextBlock>
            </div>
        </div>
    );
}

function StyledTextBlock({ title, children }: { title: string, children: React.ReactNode; }) {
    return (
        <div className="flex justify-center items-center w-[80%] bg-gray-800 rounded-lg">
            <div className="flex flex-col justify-start items-center gap-2 p-4 w-full">
                <div className="flex flex-row justify-start items-center w-full">
                    <p className="text-5xl font-semibold text-center text-transparent bg-clip-text p-1 bg-gradient-to-tr from-pink-600 to-yellow-400">{title}</p>
                </div>
                <p className="text-center text-3xl font-medium">{children}</p>
            </div>
        </div>
    );
}