export default function GameButton({ color, onClick, text }: { color: string, onClick: () => any; text: string; }) {
    return (
        <button onClick={onClick} className={`${color} py-4 px-8 w-auto h-auto rounded-lg hover:brightness-90 active:brightness-75 text-xl`}>
            {text}
        </button>
    );
}