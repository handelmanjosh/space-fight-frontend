


export default function NFTModal({ click, children }: { children: React.ReactNode, click: () => any; }) {
    return (
        <div className={`w-24 aspect-square rounded-lg hover:brightness-90 active:brightness-75`} onClick={click}>
            {children}
        </div>
    );
}