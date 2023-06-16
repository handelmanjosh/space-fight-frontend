import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import dynamic from 'next/dynamic';
import { checkBalance, fullMint, getMassTokens, getMyTokens, getMyTrophies, sendToken, sendTrophies, swapTokens } from "@/components/token";
import { getAddressByName } from "@/components/utils";
import { AnchorWallet, WalletContextState, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { set } from "@project-serum/anchor/dist/cjs/utils/features";
import PowerUp, { InGamePowerUp } from "@/components/PowerUp";
import GameButton from "@/components/GameButton";
import BuyButton from "@/components/BuyButton";
import { fullMintNFT, getNftsFromWallet } from "@/components/nft";
import NFTModal from "@/components/NFTModal";

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
let loadedPowerUps: Map<string, number> = new Map<string, number>();

let img: HTMLImageElement | undefined = undefined;
export default function Home() {
  const { publicKey, signTransaction } = useWallet();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<[string, number][]>([]);
  const [powerUps, setPowerUps] = useState<{ name: string, keyString: string, num: number, use: () => any; }[]>([]);
  const [myTokens, setMyTokens] = useState<{ name: string, num: number, use: () => any; }[]>([]);
  const [totalMass, setTotalMass] = useState<number>(0);
  const [totalTrophies, setTotalTrophies] = useState<number>(0);
  const [trophiesWon, setTrophiesWon] = useState<number>(0);
  const [showTrophiesWon, setShowTrophiesWon] = useState<boolean>(false);
  const [myNfts, setMyNfts] = useState<{ address: string, image: string, click: () => any; }[]>([]);
  const [offChainKey, setOffChainKey] = useState<string>("");
  const [changedKey, setChangedKey] = useState<string>("");

  useEffect(() => {
    if (socket) {
      console.log(`Loaded off chain key: ${offChainKey}`);
      socket?.emit("recieveOffChainKey", offChainKey);
      socket?.emit("getOffChainData", offChainKey);
    }
  }, [offChainKey]);
  useEffect(() => {
    if (!publicKey) {
      //hacky hacky...
      setOffChainKey(offChainKey => {
        socket.emit("getOffChainKey", offChainKey);
        return offChainKey;
      });
    }
  }, [isPlaying, publicKey]);
  const processOffChainData = (user: any) => {
    console.log("recieved off chain data");
    console.log(user);
    if (user) {
      console.log(user);
      setTotalMass(user.mass);
      setTotalTrophies(user.trophies);
      const myTokens = [
        {
          name: "SpeedPowerUp", num: user.speedPowerUp, use: () => {
            socket.emit("transaction", "SpeedPowerUp");
            let count = loadedPowerUps.get("SpeedPowerUp");
            if (count) {
              loadedPowerUps.set("SpeedPowerUp", count + 1);
            } else {
              loadedPowerUps.set("SpeedPowerUp", 1);
            }
            const newTokens = [...myTokens];
            const index = newTokens.findIndex((value) => value.name === "SpeedPowerUp");
            newTokens[index].num--;
            setMyTokens(newTokens);
          }
        },
        {
          name: "SizePowerUp", num: user.sizePowerUp, use: () => {
            socket.emit("transaction", "SizePowerUp");
            let count = loadedPowerUps.get("SizePowerUp");
            if (count) {
              loadedPowerUps.set("SizePowerUp", count + 1);
            } else {
              loadedPowerUps.set("SizePowerUp", 1);
            }
            const newTokens = [...myTokens];
            const index = newTokens.findIndex((value) => value.name === "SizePowerUp");
            newTokens[index].num--;
            setMyTokens(newTokens);
          }
        },
        {
          name: "Recombine", num: user.recombinePowerUp, use: () => {
            socket.emit("transaction", "Recombine");
            let count = loadedPowerUps.get("Recombine");
            if (count) {
              loadedPowerUps.set("Recombine", count + 1);
            } else {
              loadedPowerUps.set("Recombine", 1);
            }
            const newTokens = [...myTokens];
            const index = newTokens.findIndex((value) => value.name === "Recombine");
            newTokens[index].num--;
            setMyTokens(newTokens);
          }
        },
        {
          name: "PlaceVirus", num: user.placeVirusPowerUp, use: () => {
            socket.emit("transaction", "PlaceVirus");
            let count = loadedPowerUps.get("PlaceVirus");
            if (count) {
              loadedPowerUps.set("PlaceVirus", count + 1);
            } else {
              loadedPowerUps.set("PlaceVirus", 1);
            }
            const newTokens = [...myTokens];
            const index = newTokens.findIndex((value) => value.name === "PlaceVirus");
            newTokens[index].num--;
            setMyTokens(newTokens);
          }
        }
      ];
      setMyTokens(myTokens);
    } else {
      setMyTokens([]);
    }
  };
  useEffect(() => {
    if (publicKey) {
      getMyTokens(publicKey.toBase58()).then(tokens => {
        const myTokens: { name: string, num: number, use: () => any; }[] = [];
        for (const token of tokens) {
          myTokens.push({
            name: token[0], num: token[1], use: () => {
              console.log(token[0]);
              console.log("called");
              swapTokens(token[0], publicKey.toBase58(), 1, signTransaction!).then(() => {
                //should error out and not reach this block
                //socket.emit("loadPowerUp", token[0]);
                let count = loadedPowerUps.get(token[0]);
                if (count) {
                  loadedPowerUps.set(token[0], count + 1);
                } else {
                  loadedPowerUps.set(token[0], 1);
                }
                console.log("called2");
                const newTokens = [...myTokens];
                const index = newTokens.findIndex((value) => value.name === token[0]);
                newTokens[index].num--;
                setMyTokens(newTokens);
              }).catch(err => console.error(err));
            }
          });
        }
        setMyTokens(myTokens);
        getNftsFromWallet(publicKey).then(nfts => {
          const finalNfts: { address: string, image: string, click: () => any; }[] = [];
          for (const nft of nfts) {
            const myImg = document.createElement("img");
            myImg.src = nft[1];

            finalNfts.push({
              address: nft[0], image: nft[1], click: () => {
                if (img && img.src === nft[1]) {
                  img = undefined;
                } else {
                  const newImg = document.createElement("img");
                  newImg.src = nft[1];
                  newImg.style.borderRadius = "9999px";
                  newImg.style.aspectRatio = "square";
                  img = newImg;
                }
              }
            });
          }
          setMyNfts(finalNfts);
        });
        //socket.emit("loadPowerUps", tokens);
      });
      getMassTokens(publicKey.toBase58()).then(massTokens => {
        setTotalMass(massTokens);
      });
      getMyTrophies(publicKey).then(trophies => {
        setTotalTrophies(trophies);
      });
    } else if (offChainKey !== "") {
      if (socket) {
        socket.emit("getOffChainData", offChainKey);
      }
    }
  }, [publicKey, isPlaying, offChainKey]);
  useEffect(() => {
    console.log(`My Wallet address: ${publicKey?.toBase58()}`);
    canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (window.innerWidth > 768) {
      canvas.width = 1100;
      canvas.height = 800;
    } else {
      alert("Site not yet mobile compatible. Things may go wrong!");
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
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
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
    socket.on("getOffChainData", processOffChainData);
    const sendMouse = setInterval(sendMousePos, 1000 / 60);
    return () => {
      socket.disconnect();
      clearInterval(sendMouse);
    };
  }, []);

  useEffect(() => {
    //hacky solution. fix later

    const killPlayer = async ({ mass, powerUps, trophies }: { mass: number, powerUps: [string, number][]; trophies: number; }) => {
      console.log("You died");
      const collectPowerUp = async (name: string, amount: number) => {
        console.log(name);
        const tokenAddress = getAddressByName(name);
        if (publicKey) {
          await sendToken(tokenAddress, publicKey.toBase58(), amount);
        }
      };
      setIsPlaying(false);
      if (publicKey) {
        const tokenAddress = process.env.NEXT_PUBLIC_MASS_TOKEN!;
        console.log(`Adding ${Math.floor(mass)} mass. Mass is rounded down`);
        await sendToken(tokenAddress, publicKey.toBase58(), Math.floor(mass));
      }
      for (const powerUp of powerUps) {
        if (powerUp[1] > 0) {
          await collectPowerUp(powerUp[0], powerUp[1]);
        }
      }
      if (publicKey && trophies > 0) {
        await sendTrophies(publicKey, trophies);
        setTotalTrophies(prevTrophies => prevTrophies + trophies);
      }
      if (trophies > 0) {
        setTrophiesWon(trophies);
        setShowTrophiesWon(true);
      }
    };
    if (socket) {
      socket.on("dead", killPlayer);
    }

  }, [publicKey]);

  const sendMousePos = () => {
    if (mousePos) {
      socket.emit("move", { pos: mousePos, dimensions: [canvas.width, canvas.height], id: socket.id, keys });
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
    //console.log(x, y, window.scrollX, window.scrollY);
    const [adjX, adjY] = [x - canvasRect.left, y - canvasRect.top];
    if (adjX > 0 && adjX < canvas.width && adjY > 0 && adjY < canvas.height) {
      //console.log(canvasRect, { adjX, adjY, x, y });
      return [adjX, adjY];
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
    context.fillStyle = "black";
    context.fillRect(0, 0, 10000, 10000);
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
    context.strokeStyle = "white";
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
  const sendPowerUp = async (name: string) => {
    let count = loadedPowerUps.get(name);
    if (!count || count <= 0) return;

    const tokenAddress = getAddressByName(name);
    if (publicKey) {
      await sendToken(tokenAddress, publicKey.toBase58(), 1);
    }

    if (count > 0) {
      loadedPowerUps.set(name, count - 1);
    }
    const newTokens = [...myTokens];
    const index = newTokens.findIndex((value) => value.name === name);
    newTokens[index].num++;
    setMyTokens(newTokens);
  };
  const spawn = () => {
    const serialized: [string, number][] = Array.from(loadedPowerUps);
    socket.emit("spawn", serialized);
    loadedPowerUps = new Map<string, number>();
    setIsPlaying(true);
  };
  return (
    <div className="w-full h-full flex flex-col justify-start items-center">
      <div className="flex flex-row justify-between items-center w-full p-4">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text p-1 bg-gradient-to-tr from-[#9945FF] to-[#14F195]">Agar.sol</h1>
        <div className="flex flex-row justify-center items-center gap-4">
          <a className="text-lg font-bold hover:underline hover:cursor-pointer" onClick={() => window.location.href = "/load-wallet"}>Claim</a>
          <a className="text-lg font-bold hover:underline hover:cursor-pointer" onClick={() => window.location.href = "/how-to-play"}>How to play?</a>
          <a className="text-lg font-bold hover:underline hover:cursor-pointer" onClick={() => window.location.href = "/shop"}>Shop</a>
          <WalletMultiButtonDynamic />
          <WalletDisconnectButtonDynamic />
          {/* <button onClick={() => fullMintNFT()}>Mint an nft</button> */}
          {/* <button onClick={() => swapTokens(process.env.NEXT_PUBLIC_MASS_TOKEN!, publicKey!.toBase58(), 1, signTransaction!)}>Send some tokens from user</button> */}
          {/* <button onClick={fullMint}>Mint a new token!</button> */}
          {/* <button onClick={() => sendToken(process.env.NEXT_PUBLIC_TROPHY_TOKEN!, "FUcoeKT9Nod5mWxDJJrbq4SycLAqNyxe5eMnmChbZ89p", 1000)}>Send some token</button>
          <button onClick={() => checkBalance(process.env.NEXT_PUBLIC_MASS_TOKEN!)}>Check balance</button> */}
        </div>
      </div>
      <div className="flex flex-col flex-grow justify-center items-center gap-4">
        <div className="flex flex-row justify-center items-center gap-6">
          <div className="flex flex-col justify-center items-center gap-4">
            {publicKey || offChainKey !== "" ? <></> :
              <div className="flex flex-col justify-center items-center gap-2">
                <p className="text-xl text-center">Enter a phrase to save your data or load previous data</p>
                <input
                  className="appearance-none outline-none border bg-black border-white rounded-lg w-96 p-4"
                  onChange={(event: any) => setChangedKey(event.target.value)}
                  value={changedKey}
                  placeholder="Enter a phrase to save your data"
                />
                <button
                  className="py-2 px-4 rounded-md bg-yellow-500  hover:brightness-90 active:brightness-75"
                  onClick={() => {
                    setOffChainKey(changedKey);
                    setChangedKey("");
                  }}
                >
                  Set
                </button>
                <p>If you create a web3 wallet, {`you'll`} be able to load your items into the wallet!</p>
              </div>
            }
            {offChainKey === "" ? <></> : <p className="text-xl text-center">{`Signed in as `}<span className="font-bold underline">{`${offChainKey}`}</span></p>}
            <div className="relative w-auto h-auto border-2 border-white rounded-lg ">
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
                    if (socket && value[0] === socket.id) {
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
              {showTrophiesWon ?
                <div className="absolute flex justify-center items-center top-0 left-0 w-full h-full">
                  <div className="flex flex-col justify-center items-center gap-6 p-4 bg-gray-600 rounded-lg">
                    <p>{`You won ${Math.round(trophiesWon)} trophies!`}</p>
                    <button className="py-4 px-8 rounded-lg bg-yellow-400 hover:brightness-90 active:brightness-75" onClick={() => setShowTrophiesWon(false)}>Close</button>
                  </div>
                </div>
                :
                <></>
              }
              {powerUps && powerUps.length > 0 ?
                <div id="power-ups" className="absolute right-0 bottom-0 h-auto w-auto flex flex-col justify-center items-center gap-2 m-2">
                  {powerUps.map((powerUp, i: number) => {
                    return (
                      <InGamePowerUp {...powerUp} key={i} />
                    );
                  })}
                </div>
                :
                <></>
              }
              {isPlaying ?
                <div className="absolute top-0 left-0 flex flex-row justify-center items-center">
                  <div className="flex py-2 px-4 justify-center items-center w-auto h-auto rounded-lg m-2 bg-gray-600/60 bg-gradient-to-tr from-purple-600 via-blue-600 to-teal-500">
                    <p className="text-center text-xl font-bold text-transparent bg-clip-text p-1 bg-gradient-to-tr from-pink-600 via-orange-600 to-yellow-400">
                      {`$Mass: ${totalMass}`}
                    </p>
                  </div>
                  <div className="flex py-2 px-4 justify-center items-center w-auto h-auto rounded-lg m-2 bg-gray-600/60 bg-gradient-to-tr bg-slate-800">
                    <p className="text-center text-xl font-bold text-transparent bg-clip-text p-1 bg-yellow-400">
                      {`$Trophy: ${totalTrophies}`}
                    </p>
                  </div>
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
            <div className="flex flex-col justify-center items-center gap-2">
              {loadedPowerUps.size > 0 ? <p>Your loaded power ups. Click to reclaim them.</p> : <></>}
              <div className="flex flex-row justify-center items-center gap-4">
                {Array.from(loadedPowerUps).map((value: [string, number], i: number) => (
                  <div className="w-auto h-auto" onClick={() => sendPowerUp(value[0])} key={i}>
                    <InGamePowerUp name={value[0]} num={value[1]} keyString="" use={() => null} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-4">
            {myTokens.length > 0 ? <p className="text-2xl">Inventory</p> : <></>}
            <div className="grid grid-cols-2 place-items-center items-center gap-4">
              {myTokens.map((token, i: number) => (
                <InGamePowerUp {...token} keyString="" key={i} />
              ))}
            </div>
          </div>
          {myNfts && myNfts.length > 0 ?
            <div className="flex flex-col justify-center items-center gap-4">
              <p className="text-2xl">NFT skins</p>
              <div className="grid grid-cols-2 place-items-center items-center gap-4">
                {myNfts.map((nft, i: number) => (
                  <NFTModal {...nft} key={i}>
                    {/* @ts-ignore */}
                    <img src={nft.image} className="rounded-full aspect-square" />
                  </NFTModal>
                ))}
              </div>
            </div>
            :
            <></>
          }
        </div>
      </div>
    </div >
  );
}


function shortenAddress(address: string) {
  return `${address.slice(0, 2)}...${address.slice(address.length - 2, address.length)}`;
}
