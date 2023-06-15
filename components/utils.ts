

//ONLY FOR POWERUPS, not for masses
const addresses: Map<string, string> = new Map<string, string>();
addresses.set("SpeedPowerUp", process.env.NEXT_PUBLIC_SPEED_TOKEN!);
addresses.set("SizePowerUp", process.env.NEXT_PUBLIC_SIZE_TOKEN!);
addresses.set("Recombine", process.env.NEXT_PUBLIC_RECOMBINE_TOKEN!);
addresses.set("PlaceVirus", process.env.NEXT_PUBLIC_PLACE_VIRUS_TOKEN!);

export function getAddressByName(name: string): string {
    return addresses.get(name)!;
}

export function getNameByAddress(address: string): string | null {
    const value = Array.from(addresses.entries()).find(([_, value]) => value === address);
    if (value) {
        return value[0];
    } else {
        return null;
    }
}