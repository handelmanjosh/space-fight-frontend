import NFTModal from "./NFTModal";


export default function NFTBuyButton({ click, image, price }: { image: string, price: number, click: () => any; }) {
    return (
        <div className="flex flex-col justify-center items-center gap-2 hover:cursor-pointer">
            <NFTModal click={click}>
                <img src={image} className="rounded-full aspect-square" />
            </NFTModal>
            <p className="w-full text-center text-lg">{`${price} $MASS`}</p>
        </div>
    );
}