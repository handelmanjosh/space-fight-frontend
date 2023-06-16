

export default function Layout({ children }: { children: React.ReactNode; }) {
    return (
        <div className="flex justify-center items-center w-screen h-[120vh] bg-slate-900">
            {children}
        </div>
    );
}