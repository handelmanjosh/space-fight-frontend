export default function PowerUp({ name, keyString, num, use }: { name: string, keyString: string, num: number, use: () => any; }) {
    return (
        <div
            className="relative w-auto p-4 h-24 rounded-lg hover:brightness-90 active:brightness-75 hover:cursor-pointer bg-gray-600/60 bg-teal-600 active:outline-none active:ring-2 active:ring-offset-2 active:ring-teal-500"
            onClick={use}
        >
            <div className="absolute top-0 left-0 m-1">
                {keyString}
            </div>
            <div className="absolute bottom-0 right-0 m-1">
                {`${num}`}
            </div>
            <div className="w-full h-full flex justify-center items-center">
                {name}
            </div>
        </div>
    );
}

export function InGamePowerUp({ name, keyString, num, use }: { name: string, keyString: string, num: number, use: () => any; }) {
    return (
        <div
            className="flex flex-col justify-between items-center w-36 h-24 rounded-lg aspect-square p-2 bg-blue-600 hover:cursor-pointer hover:brightness-90 active:brightness-75 active:ring-2 ring-offset-transparent ring-offset-2"
            onClick={use}
        >
            <div className="flex flex-row justify-start items-center w-full">
                {keyString}
            </div>
            <div className="flex flex-row justify-center items-center w-full">
                {name}
            </div>
            <div className="flex flex-row justify-end items-center w-full">
                {num}
            </div>
        </div>
    );
}