import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import dynamic from 'next/dynamic';
import { checkBalance, fullMint, getMassTokens, getMyTokens, sendToken } from "@/components/token";
import { getAddressByName } from "@/components/utils";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";

const WalletDisconnectButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
  { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);
let socket: Socket;
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let mousePos: [number, number] | undefined;
let keys: string[] = [];
export default function Home() {
  const wallet = useAnchorWallet();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<[string, number][]>([]);
  const [powerUps, setPowerUps] = useState<{ name: string, keyString: string, num: number, use: () => any; }[]>([]);
  const [totalMass, setTotalMass] = useState<number>(0);
  useEffect(() => {
    if (wallet) {
      getMyTokens(wallet.publicKey.toBase58()).then(tokens => {
        socket.emit("loadPowerUps", tokens);
      });
      getMassTokens(wallet.publicKey.toBase58()).then(massTokens => {
        setTotalMass(massTokens);
      });
    }
  }, [wallet, isPlaying]);
  useEffect(() => {
    console.log(`My Wallet address: ${wallet?.publicKey?.toBase58()}`);
    canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (window.innerWidth > 768) {
      canvas.width = canvas.height = 600;
    } else {
      canvas.width = canvas.height = 300;
    }
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("touchmove", touchmove, { passive: false });
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
    return () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("touchmove", touchmove);
    };
  }, []);
  const keydown = (event: KeyboardEvent) => {
    if (event.key == " ") {
      event.preventDefault();
      if (!keys.includes(event.key)) {
        keys.push(event.key);
      }
    }
  };
  const keyup = (event: KeyboardEvent) => {
    if (event.key == " ") {
      event.preventDefault();
      if (keys.includes(event.key)) {
        keys.splice(keys.indexOf(event.key), 1);
      }
    }
  };
  useEffect(() => {
    if (socket) {
      socket.disconnect();
    }
    socket = io("http://localhost:3005", {
      autoConnect: false
    });
    socket.connect();
    console.log("Connecting");
    socket.on("connect", () => {
      console.log(`Connected: ${socket.id}`);
    });
    socket.on("gameState", drawState);
    socket.on("receiveLeaderboard", updateLeaderboard);
    socket.on("receiveMessages", updateMessages);
    socket.on("inventory", updateInventory);
    socket.on("connect_error", (err) => console.error(err));
    socket.on("massIncrease", (increase: number) => {
      setTotalMass(prevMass => {
        return prevMass + Math.floor(increase);
      });
    });
    const sendMouse = setInterval(sendMousePos, 1000 / 60);
    return () => {
      socket.disconnect();
      clearInterval(sendMouse);
    };
  }, []);

  useEffect(() => {
    //hacky solution. fix later
    const collectPowerUp = async (name: string) => {
      console.log(name);
      const tokenAddress = getAddressByName(name);
      if (wallet) {
        await sendToken(tokenAddress, wallet.publicKey.toBase58(), 1);
      }
    };
    const killPlayer = async (mass: number) => {
      setIsPlaying(false);
      //actually radius to be technic 
      if (wallet) {
        const tokenAddress = process.env.NEXT_PUBLIC_MASS_TOKEN!;
        console.log(`Adding ${Math.floor(mass)} mass. Mass is rounded`);
        await sendToken(tokenAddress, wallet.publicKey.toBase58(), Math.floor(mass));
      }
    };
    if (socket) {
      socket.on("collectPowerUp", collectPowerUp);
      socket.on("dead", killPlayer);
    }

  }, [wallet]);

  const sendMousePos = () => {
    if (mousePos) {
      socket.emit("move", { pos: mousePos, dimensions: [600, 600], id: socket.id, keys });
    }
  };
  const mousemove = (event: MouseEvent) => {
    mousePos = adjustToCanvas(event.clientX, event.clientY);
  };
  const touchmove = (event: TouchEvent) => {
    mousePos = adjustToCanvas(event.touches[0].clientX, event.touches[0].clientY);
  };
  const adjustToCanvas = (x: number, y: number): [number, number] | undefined => {
    const canvasRect = canvas.getBoundingClientRect();
    const [adjX, adjY] = [x - canvasRect.left - window.scrollX, y - canvasRect.top - window.scrollY];
    if (adjX > 0 && adjX < canvas.width && adjY > 0 && adjY < canvas.height) {
      return [x - canvasRect.left - window.scrollX, y - canvasRect.top - window.scrollY];
    }
  };
  const drawState = (objects: any[]) => {
    const player = objects.find((object) => object.id === socket.id);
    if (player) {
      paintBackground(player.x, player.y);
      for (const object of objects) {
        if (object.id && object.id === socket.id) {
          drawPlayer(object);
        } else if (object.id) {
          drawOtherPlayer(object, player);
        } else {
          drawObject(object, player);
        }
      }
    }

  };
  const originToCanvas = (x: number, y: number) => {
    return [x + canvas.width / 2, y + canvas.height / 2];
  };
  const drawPlayer = (object: any) => {
    object.players.forEach((player: any) => {
      drawSubPlayers(player, [object.x, object.y]);
    });
  };
  const drawSubPlayers = (player: any, relative: [number, number]) => {
    let [relX, relY] = [player.x - relative[0], player.y - relative[1]];
    [relX, relY] = originToCanvas(relX, relY);
    context.save();
    context.beginPath();
    context.translate(relX, relY);
    context.arc(0, 0, player.radius, 0, 2 * Math.PI);
    context.fillStyle = player.color;
    context.fill();
    context.restore();
  };
  const drawOtherPlayer = (object: any, player: { x: number, y: number; },) => {
    let [relX, relY] = [object.x - player.x, object.y - player.y];
    [relX, relY] = originToCanvas(relX, relY);
    object.players.forEach((player: any) => {
      const [tempX, tempY] = [relX - player.x, relY - player.y];
      context.save();
      context.beginPath();
      context.translate(tempX, tempY);
      context.arc(0, 0, player.radius, 0, 2 * Math.PI);
      context.fillStyle = player.color;
      context.fill();
      context.restore();
    });
  };
  const paintBackground = (x: number, y: number) => {
    context.clearRect(0, 0, 10000, 10000);
    context.save();
    context.translate(-1 * x, -1 * y);
    context.beginPath();
    for (let x = canvas.width / 2; x < 10000 + canvas.width / 2; x += 100) {
      context.moveTo(x, canvas.height / 2);
      context.lineTo(x, 10000 + canvas.height / 2);
    }
    for (let y = canvas.height / 2; y < 10000 + canvas.height / 2; y += 100) {
      context.moveTo(canvas.width / 2, y);
      context.lineTo(10000 + canvas.width / 2, y);

    }
    context.strokeStyle = "black";
    context.lineWidth = 0.5;
    context.stroke();
    context.strokeStyle = "red";
    context.strokeRect(canvas.width / 2, canvas.height / 2, 10000, 10000);
    context.restore();
  };
  const drawObject = (object: any, player: { x: number, y: number; }) => {
    let [relX, relY] = [object.x - player.x, object.y - player.y];
    [relX, relY] = originToCanvas(relX, relY);
    context.save();
    context.beginPath();
    context.translate(relX, relY);
    if (object.square) {
      context.fillStyle = object.color;
      context.fillRect(- object.radius, - object.radius, object.radius * 2, object.radius * 2);
    } else {
      context.fillStyle = object.color;
      context.arc(0, 0, object.radius, 0, 2 * Math.PI);
      context.fill();
    }


    context.restore();
  };
  const updateLeaderboard = (leaderboard: any) => {
    setLeaderboard(leaderboard);
  };
  const updateMessages = (messages: any) => {

  };
  const updateInventory = (inventory: any) => {
    const powerUpObjects: { name: string, keyString: string, num: number, use: () => any; }[] = [];
    let keys = ["z", "x", "c", "v", "b", "n", "m"];
    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i];
      powerUpObjects.push({ name: item[0], num: item[1], keyString: keys[i], use: () => { socket.emit("usePowerUp", { powerUp: item[0] }); } });
    }
    setPowerUps(powerUpObjects);
  };
  useEffect(() => {
    const funcs: any[] = [];
    for (const powerUp of powerUps) {
      const func = (event: KeyboardEvent) => {
        if (event.key === powerUp.keyString) {
          powerUp.use();
          // add removal of token from player's wallet
          console.log("We used a power up");
        }
      };
      document.addEventListener("keydown", func);
      funcs.push(func);
    }
    return () => {
      for (const func of funcs) {
        document.removeEventListener("keydown", func);
      }
    };
  }, [powerUps]);
  const spawn = () => {
    socket.emit("spawn");
    setIsPlaying(true);
  };
  return (
    <div className="w-full h-full flex flex-col justify-start items-center">
      <div className="flex flex-row justify-between items-center w-full p-4">
        <p>Agar.sol</p>
        <div className="flex flex-row justify-center items-center gap-4">
          <WalletMultiButtonDynamic />
          <WalletDisconnectButtonDynamic />
          {/* <button onClick={fullMint}>Mint a new token!</button>
          <button onClick={() => sendToken(process.env.NEXT_PUBLIC_MASS_TOKEN!, "FUcoeKT9Nod5mWxDJJrbq4SycLAqNyxe5eMnmChbZ89p", 1000)}>Send some token</button>
          <button onClick={() => checkBalance(process.env.NEXT_PUBLIC_MASS_TOKEN!)}>Check balance</button> */}
        </div>
      </div>
      <div className="flex flex-col flex-grow justify-center items-center gap-4">
        <div className="relative w-auto h-auto border border-red-600">
          <canvas id="game-canvas" className="bg-transparent" />
          {!isPlaying ?
            <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
              <GameButton color="bg-orange-600" onClick={spawn} text="Play" />
            </div>
            :
            <></>
          }
          {isPlaying && leaderboard && leaderboard.length > 0 ?
            <div id="leaderboard" className="absolute top-0 right-0 w-[40%] h-auto m-2 p-4 rounded-lg bg-gray-600/60">
              {leaderboard.map((value: [string, number], i: number) => {
                if (value[0] === socket.id) {
                  return (
                    <div key={i} className="flex justify-between w-full items-center text-yellow-400 font-bold">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <p>{`${i + 1}.`}</p>
                        <p>{shortenAddress(value[0])}</p>
                      </div>
                      <p className="text-yellow-400 font-bold">{Math.round(value[1])}</p>
                    </div>
                  );
                } else {
                  return (
                    <div key={i} className="flex justify-between w-full items-center">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <p>{`${i + 1}.`}</p>
                        <p>{shortenAddress(value[0])}</p>
                      </div>
                      <p>{Math.round(value[1])}</p>
                    </div>
                  );
                }

              })}
            </div>
            :
            <></>
          }
          {isPlaying && powerUps && powerUps.length > 0 ?
            <div id="power-ups" className="absolute right-0 bottom-0 h-auto w-auto">
              {powerUps.map((powerUp, i: number) => {
                return (
                  <PowerUp {...powerUp} key={i} />
                );
              })}
            </div>
            :
            <></>
          }
          {isPlaying ?
            <div className="absolute top-0 left-0 flex justify-center items-center w-24 aspect-square rounded-lg m-2 bg-gray-600/60">
              <p>{`$Mass: ${totalMass}`}</p>
            </div>
            :
            <></>
          }
          {isPlaying ?
            <div
              className="absolute left-0 bottom-0 flex justify-center items-center w-12 aspect-square rounded-lg m-2 bg-red-600/60 hover:cursor-pointer hover:brightness-90 active:brightness-75"
              onClick={() => {
                socket.emit("quit");
              }}
            >
              Quit
            </div>
            :
            <></>
          }
        </div>
      </div>
    </div>
  );
}
function PowerUp({ name, keyString, num, use }: { name: string, keyString: string, num: number, use: () => any; }) {
  return (
    <div
      className="relative w-16 aspect-square rounded-lg hover:brightness-90 active:brightness-75 hover:cursor-pointer bg-gray-600/60"
      onClick={use}
    >
      <div className="absolute top-0 left-0">
        {keyString}
      </div>
      <div className="absolute bottom-0 right-0">
        {`${num}`}
      </div>
      <div className="w-full h-full flex justify-center items-center">
        {name}
      </div>
    </div>
  );
}
function GameButton({ color, onClick, text }: { color: string, onClick: () => any; text: string; }) {
  return (
    <button onClick={onClick} className={`${color} py-4 px-8 w-auto h-auto rounded-lg hover:brightness-90 active:brightness-75 text-xl`}>
      {text}
    </button>
  );
}
function shortenAddress(address: string) {
  return `${address.slice(0, 2)}...${address.slice(address.length - 2, address.length)}`;
}
