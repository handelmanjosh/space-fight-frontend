import { sendToken, swapTokens } from "./token";
import { getAddressByName } from "./utils";

type BuyButtonProps = {
    name: string;
    price: number;
    reward: number;
    rewardName: string;
    address: string;
    signTransaction: any;
    changeBuy: (...any: any[]) => any;
    changeSell: (...any: any[]) => any;
    currentSell: any[];
};
export default function BuyButton({ name, price, address, reward, rewardName, signTransaction, changeBuy, changeSell, currentSell }: BuyButtonProps) {
    return (
        <div
            className="flex flex-col justify-center p-4 items-center h-auto w-auto rounded-lg hover:cursor-pointer hover:scale-105 active:scale-100 hover:from-pink-600 hover:via-orange-600 hover:to-yellow-400 bg-gradient-to-tr from-purple-600 via-blue-600 to-teal-500 text-white"
            onClick={async () => {
                const rewardAddress = getAddressByName(rewardName);
                if (rewardAddress) {
                    swapTokens(name, address, price, signTransaction).then(result => {
                        sendToken(rewardAddress, address, reward).then(() => {
                            console.log(`Swapped ${price} ${name} for ${reward} ${rewardName}!`);
                            if (changeBuy && changeSell && currentSell) {
                                changeBuy((mass: any) => {
                                    return mass - price;
                                });
                                const newSell = [...currentSell];
                                const index = newSell.findIndex((item: any) => item.name === rewardName);
                                if (index > -1) {
                                    newSell[index].amount += reward;
                                }
                                changeSell(newSell);
                            }
                        });
                    }).catch(err => console.error(err));
                }
            }}
        >
            <p className="text-center">{`${price} ${name}`}</p>
            <p>for</p>
            <p>{`${reward} ${rewardName}`}</p>
        </div>
    );
}