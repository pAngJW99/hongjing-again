"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const MIN_X = 31;
const MAX_X = 88;
const SIGN_X = 48;
const NOTE_X = 58;

export default function Home() {
  const [playerX, setPlayerX] = useState(37);
  const [started, setStarted] = useState(false);
  const [trainGone, setTrainGone] = useState(false);
  const [noteFound, setNoteFound] = useState(false);
  const [stampFound, setStampFound] = useState(false);
  const [message, setMessage] = useState("按 A / D 或方向键，在站台上走一走");
  const [soundOn, setSoundOn] = useState(false);
  const keys = useRef(new Set<string>());
  const audio = useRef<AudioContext | null>(null);

  const move = useCallback((amount: number) => {
    setStarted(true);
    setPlayerX((value) => Math.min(MAX_X, Math.max(MIN_X, value + amount)));
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
        event.preventDefault();
        keys.current.add(event.key.toLowerCase());
        setStarted(true);
      }
      if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        window.dispatchEvent(new Event("hongjing-interact"));
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(32, now - previous);
      previous = now;
      if (keys.current.has("arrowleft") || keys.current.has("a")) move(-delta * 0.012);
      if (keys.current.has("arrowright") || keys.current.has("d")) move(delta * 0.012);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [move]);

  useEffect(() => {
    const timer = window.setTimeout(() => setTrainGone(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const interact = useCallback(() => {
    if (!noteFound && Math.abs(playerX - NOTE_X) < 4.5) {
      setNoteFound(true);
      setMessage("便签：如果不知道往哪里走，就先去有风的地方。");
      return;
    }
    if (!stampFound && Math.abs(playerX - SIGN_X) < 4.5) {
      setStampFound(true);
      setMessage("地点邮戳已收集：回到宏景");
      return;
    }
    setMessage("这里有风、蝉鸣，还有列车远去的声音。");
  }, [noteFound, playerX, stampFound]);

  useEffect(() => {
    window.addEventListener("hongjing-interact", interact);
    return () => window.removeEventListener("hongjing-interact", interact);
  }, [interact]);

  useEffect(() => {
    if (Math.abs(playerX - NOTE_X) < 4.5 && !noteFound) {
      setMessage("按 E 或点击“查看”，拾起发光的星形便签");
    } else if (Math.abs(playerX - SIGN_X) < 4.5 && !stampFound) {
      setMessage("按 E 或点击“查看”，读一读站牌");
    } else if (playerX > 83) {
      setMessage("右边的路通往宏景城区");
    }
  }, [noteFound, playerX, stampFound]);

  const toggleSound = () => {
    if (soundOn) {
      audio.current?.close();
      audio.current = null;
      setSoundOn(false);
      return;
    }
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = 0.025;
    gain.connect(context.destination);
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = 4620;
    const tremolo = context.createOscillator();
    const tremoloGain = context.createGain();
    tremolo.frequency.value = 11;
    tremoloGain.gain.value = 0.7;
    tremolo.connect(tremoloGain).connect(gain.gain);
    oscillator.connect(gain);
    oscillator.start();
    tremolo.start();
    audio.current = context;
    setSoundOn(true);
  };

  return (
    <main className="game-shell">
      <section className="game" aria-label="宏景火车站互动场景">
        <div className="scene" style={{ "--player-x": `${playerX}%` } as CSSProperties}>
          <div className={`train-motion ${trainGone ? "departed" : ""}`} aria-hidden="true" />

          <div className="paper paper-one" />
          <div className="paper paper-two" />
          <div className="paper paper-three" />

          {!noteFound && (
            <button
              className="star-note"
              aria-label="星形便签"
              onClick={() => {
                setPlayerX(NOTE_X);
                setNoteFound(true);
                setMessage("便签：如果不知道往哪里走，就先去有风的地方。");
              }}
            >
              ★
            </button>
          )}

          <div className="visitor" aria-label="游客">
            <span className="ponytail" />
            <span className="head" />
            <span className="body" />
            <span className="backpack" />
            <span className="legs" />
          </div>

          <div className="wind-lines" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>

        <header className="topbar">
          <div className="title-lockup">
            <small>A区 · 序章</small>
            <strong>宏景火车站</strong>
          </div>
          <button className="sound-button" onClick={toggleSound}>
            {soundOn ? "环境声：开" : "环境声：关"}
          </button>
        </header>

        <div className="collection">
          <span className={stampFound ? "collected" : ""}>
            {stampFound ? "◉" : "○"} 回到宏景
          </span>
          <span className={noteFound ? "collected" : ""}>
            {noteFound ? "★" : "☆"} 星形便签
          </span>
        </div>

        <div className="dialogue" role="status">
          <span>{message}</span>
          <button onClick={interact}>查看 E</button>
        </div>

        {!started && (
          <div className="tutorial">
            <span>←</span>
            <p>左右移动</p>
            <span>→</span>
          </div>
        )}

        <nav className="touch-controls" aria-label="移动控制">
          <button onPointerDown={() => move(-1.4)}>←</button>
          <button onPointerDown={() => move(1.4)}>→</button>
          <button onClick={interact}>查看</button>
        </nav>
      </section>
    </main>
  );
}
