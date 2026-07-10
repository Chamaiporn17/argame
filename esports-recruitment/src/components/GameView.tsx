import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, Trophy, LogOut, RefreshCw, Terminal, Play, Zap, ShieldCheck } from 'lucide-react';
import { GameStar } from '../types';

interface GameViewProps {
  token: string;
  user: any;
  onLogout: () => void;
  onScoreUpdated: (newHighScore: number) => void;
}

export default function GameView({ token, user, onLogout, onScoreUpdated }: GameViewProps) {
  // Game states
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [highScore, setHighScore] = useState(user.high_score);
  const [gameOver, setGameOver] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaveStatus, setScoreSaveStatus] = useState<string | null>(null);

  // System states
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingMediaPipe, setLoadingMediaPipe] = useState(true);
  const [trackingActive, setTrackingActive] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false); // Mouse fallback
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Initializing reaction telemetry interface...',
    '[SYSTEM] Requesting MediaPipe Hands resources via CDN...',
  ]);

  // Refs for tracking and rendering
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const starRef = useRef<GameStar>({ x: 300, y: 200, radius: 20, hue: 180 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const activeCameraRef = useRef<any>(null);

  // Log message helper
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`].slice(-8)); // keep last 8 logs
  };

  // Determine Rank Badge
  const getRankBadge = (scoreValue: number) => {
    if (scoreValue >= 30) return { label: 'S-RANK CHRONO', class: 'text-[#00f0ff] font-black tracking-wider drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]' };
    if (scoreValue >= 20) return { label: 'A-RANK ASSASSIN', class: 'text-[#ff00e5] font-bold tracking-wider' };
    if (scoreValue >= 10) return { label: 'B-RANK STRIKER', class: 'text-[#7000ff] font-bold tracking-wider' };
    return { label: 'ROOKIE PROSPECT', class: 'text-gray-400 font-semibold' };
  };

  // Dynamic MediaPipe Scripts Loading
  useEffect(() => {
    let active = true;

    const loadScripts = async () => {
      try {
        // Load Camera Utils
        if (!(window as any).Camera) {
          const cameraScript = document.createElement('script');
          cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
          cameraScript.crossOrigin = 'anonymous';
          document.head.appendChild(cameraScript);
          await new Promise((res) => { cameraScript.onload = res; });
        }

        // Load Hands Engine
        if (!(window as any).Hands) {
          const handsScript = document.createElement('script');
          handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
          handsScript.crossOrigin = 'anonymous';
          document.head.appendChild(handsScript);
          await new Promise((res) => { handsScript.onload = res; });
        }

        if (active) {
          setLoadingMediaPipe(false);
          addLog('MEDIAPIPE: Hands models and tracking libraries compiled successfully.');
          addLog('CAMERA: Requesting permission to access webcam stream...');
        }
      } catch (err) {
        if (active) {
          addLog('ERROR: MediaPipe CDN failed. Switching default to mouse simulation.');
          setSimulationMode(true);
          setLoadingMediaPipe(false);
        }
      }
    };

    loadScripts();

    return () => {
      active = false;
    };
  }, []);

  // WebCam and MediaPipe initialization
  useEffect(() => {
    if (loadingMediaPipe || simulationMode) return;

    let hands: any = null;
    let camera: any = null;

    try {
      const HandsClass = (window as any).Hands;
      const CameraClass = (window as any).Camera;

      if (!HandsClass || !CameraClass) {
        addLog('WARNING: MediaPipe libraries missing from window scope. Using simulator fallback.');
        setSimulationMode(true);
        return;
      }

      // Initialize Hands
      hands = new HandsClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(handleResults);

      // Initialize Camera
      if (videoRef.current) {
        camera = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        camera.start()
          .then(() => {
            setCameraActive(true);
            activeCameraRef.current = camera;
            addLog('CAMERA: Webcam stream connection active.');
          })
          .catch((err: any) => {
            addLog('ERROR: Camera access blocked or missing. Switching to simulator mode.');
            setSimulationMode(true);
          });
      }
    } catch (e: any) {
      addLog(`ERROR: Init failure (${e.message}). Switching to simulator.`);
      setSimulationMode(true);
    }

    return () => {
      if (camera) {
        try {
          camera.stop();
        } catch (e) {}
      }
      if (hands) {
        try {
          hands.close();
        } catch (e) {}
      }
    };
  }, [loadingMediaPipe, simulationMode]);

  // Main rendering loop (runs on requestAnimationFrame for mouse simulation, or triggered by hands.onResults)
  const handleResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video background
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // Mirrored for interactive natural mapping
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // Draw Cyberpunk HUD elements
    drawHUD(ctx);

    let pointerX = 0;
    let pointerY = 0;
    let detected = false;

    // If MediaPipe detects a hand
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      if (!trackingActive) {
        setTrackingActive(true);
        addLog('MEDIAPIPE: Athlete hand coordinates detected successfully.');
      }

      const landmarks = results.multiHandLandmarks[0];
      // Landmark 8 represents the Index Finger Tip
      const indexTip = landmarks[8];

      // Translate coordinates and mirror horizontally
      pointerX = (1 - indexTip.x) * canvas.width;
      pointerY = indexTip.y * canvas.height;
      detected = true;

      // Draw hand skeletal lines
      drawSkeleton(ctx, landmarks, canvas.width, canvas.height);

      // Draw targeting reticle on fingertip
      drawPointer(ctx, pointerX, pointerY);
    } else {
      if (trackingActive) {
        setTrackingActive(false);
        addLog('MEDIAPIPE: Hand connection lost.');
      }
    }

    // Check collision and draw star
    if (isPlaying) {
      if (detected) {
        checkStarCollision(pointerX, pointerY);
      }
      drawStar(ctx, starRef.current.x, starRef.current.y, 5, starRef.current.radius, starRef.current.radius / 2, starRef.current.hue);
    }
  };

  // Canvas drawing Helpers
  const drawHUD = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Grid scanner overlay lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.height; i += 10) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  };

  // Draw hand skeleton nodes
  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any, width: number, height: number) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.7)'; // Sleek purple joints
    ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';   // Sleek cyan vertices

    const getCoord = (idx: number) => {
      return {
        x: (1 - landmarks[idx].x) * width,
        y: landmarks[idx].y * height,
      };
    };

    const drawLink = (pt1: number, pt2: number) => {
      const c1 = getCoord(pt1);
      const c2 = getCoord(pt2);
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();
    };

    // Draw connections
    drawLink(5, 6); drawLink(6, 7); drawLink(7, 8); // Index Finger
    drawLink(1, 2); drawLink(2, 3); drawLink(3, 4); // Thumb
    drawLink(9, 10); drawLink(10, 11); drawLink(11, 12); // Middle Finger
    drawLink(13, 14); drawLink(14, 15); drawLink(15, 16); // Ring Finger
    drawLink(17, 18); drawLink(18, 19); drawLink(19, 20); // Pinky
    drawLink(0, 1); drawLink(0, 5); drawLink(0, 17); // Wrist attachments
    drawLink(5, 9); drawLink(9, 13); drawLink(13, 17);

    // Draw little circles at each joint
    landmarks.forEach((_: any, idx: number) => {
      const pt = getCoord(idx);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Draw targeting circle and crosshair
  const drawPointer = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Reticle
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#ff00e5';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(x - 22, y); ctx.lineTo(x - 12, y);
    ctx.moveTo(x + 12, y); ctx.lineTo(x + 22, y);
    ctx.moveTo(x, y - 22); ctx.lineTo(x, y - 12);
    ctx.moveTo(x, y + 12); ctx.lineTo(x, y + 22);
    ctx.stroke();
  };

  // Draw bright, glowing, colorful target stars
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    hue: number
  ) => {
    ctx.shadowBlur = 15;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;

    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  // Star repositioning on collision or start
  const spawnStar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const padding = 60;
    const randomX = Math.floor(Math.random() * (canvas.width - padding * 2)) + padding;
    const randomY = Math.floor(Math.random() * (canvas.height - padding * 2)) + padding;
    const randomHue = Math.floor(Math.random() * 360);

    starRef.current = {
      x: randomX,
      y: randomY,
      radius: 20,
      hue: randomHue,
    };
  };

  // Collision checking math
  const checkStarCollision = (pointerX: number, pointerY: number) => {
    const star = starRef.current;
    const dx = pointerX - star.x;
    const dy = pointerY - star.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Collision limit: Star radius + reticle radius
    if (distance < star.radius + 15) {
      setScore((prev) => {
        const next = prev + 1;
        addLog(`COLLISION: Target acquired! Score: ${next}`);
        return next;
      });
      spawnStar();
    }
  };

  // Fallback simulator loop (standard mouse event interaction)
  useEffect(() => {
    if (!simulationMode || !isPlaying) return;

    let frameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    addLog('SIMULATOR: Mouse motion loop active.');

    const drawLoop = () => {
      // Clear
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid HUD background
      drawHUD(ctx);

      // Read mouse coordinates
      const px = mousePosRef.current.x;
      const py = mousePosRef.current.y;

      // Draw synthetic camera frame simulator details
      ctx.font = '10px Courier New';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.fillText('[SIMULATED LIVE WEBCAM HUD OVERLAY]', 20, 30);
      ctx.fillText(`CURSOR: [X:${Math.round(px)}, Y:${Math.round(py)}]`, 20, 45);

      // Draw targeting cursor over pointer
      drawPointer(ctx, px, py);

      // Check collision and draw star
      checkStarCollision(px, py);
      drawStar(ctx, starRef.current.x, starRef.current.y, 5, starRef.current.radius, starRef.current.radius / 2, starRef.current.hue);

      frameId = requestAnimationFrame(drawLoop);
    };

    drawLoop();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [simulationMode, isPlaying]);

  // Initial draw loop for preview container
  useEffect(() => {
    if (isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawHUD(ctx);

    ctx.font = '14px Orbitron, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS "START TRIAL" TO BEGIN REACTION PROTOCOL', canvas.width / 2, canvas.height / 2);
  }, [isPlaying, simulationMode, loadingMediaPipe]);

  // Start the Game Trial
  const startGame = () => {
    if (isPlaying) return;

    addLog('GAME: Starting 30-second trial. React fast!');
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setScoreSaveStatus(null);
    setIsPlaying(true);
    spawnStar();

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // End of game trigger
  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    addLog('GAME OVER: Trial expired.');
  };

  // Save the latest score via AJAX to Node Server
  useEffect(() => {
    if (!gameOver) return;

    const saveScoreOnServer = async () => {
      setSavingScore(true);
      setScoreSaveStatus('กำลังส่งคะแนนไปยังศูนย์จัดสถิติ...');

      try {
        const response = await fetch('/api/save-score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ score }),
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          if (data.updated) {
            setScoreSaveStatus('NEW HIGH SCORE! สถิติใหม่เซฟลงฐานข้อมูลสำเร็จ');
            setHighScore(data.new_high_score);
            onScoreUpdated(data.new_high_score);
          } else {
            setScoreSaveStatus(`เซฟคะแนนสำเร็จ (สถิติสูงสุดยังคงเดิมที่ ${data.current_high} แต้ม)`);
          }
        } else {
          setScoreSaveStatus('ไม่สามารถจัดเก็บสถิติได้: ' + (data.message || 'Error'));
        }
      } catch (err) {
        setScoreSaveStatus('ข้อผิดพลาดการเชื่อมต่อฐานข้อมูล');
      } finally {
        setSavingScore(false);
      }
    };

    saveScoreOnServer();
  }, [gameOver, score, token]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Account for canvas CSS scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mousePosRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 flex-grow flex flex-col space-y-6">
      
      {/* Game Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0f18] p-5 rounded-lg border border-[#1a2333] gap-4">
        <div className="text-left">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#00f0ff] font-mono">
            CONNECTED ATHLETE PROFILE
          </div>
          <h2 className="text-xl font-bold text-white mt-1">{user.fullname}</h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{user.player_id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setSimulationMode(!simulationMode);
              addLog(`MODE: Switched control model to ${!simulationMode ? 'Mouse Simulator' : 'Webcam AR tracking'}`);
            }}
            className={`px-4 py-2 border rounded-sm text-xs font-mono font-bold uppercase tracking-widest cursor-pointer transition ${
              simulationMode
                ? 'bg-transparent border-[#7000ff] text-[#7000ff] hover:bg-[#7000ff]/10'
                : 'bg-transparent border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10'
            }`}
          >
            {simulationMode ? '⌨️ SWITCH TO WEBCAM' : '🖱️ PLAY WITH MOUSE'}
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-transparent border border-[#ff0000]/50 hover:bg-[#ff0000]/10 text-[#ff0000] text-xs font-mono font-bold uppercase tracking-widest rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            DISCONNECT
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Game HUD and Diagnostics */}
        <div className="lg:col-span-4 space-y-6 text-left">
          
          {/* Reaction protocol detail */}
          <div className="p-5 bg-[#0a0f18] border border-[#1a2333] rounded-lg space-y-4">
            <h3 className="font-mono font-bold text-[#7000ff] text-xs tracking-[0.2em] uppercase border-b border-[#1a2333] pb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#7000ff]" />
              AR TESTING HUD RULES
            </h3>
            <ul className="space-y-3 text-xs text-gray-400 leading-relaxed font-sans">
              <li className="flex gap-2">
                <span className="text-[#00f0ff] font-mono font-bold">01.</span>
                <span>ขยับมือ (นิ้วชี้) หรือเลื่อนเมาส์ชี้ชนดวงดาวหลากสีให้ทัน เพื่อรับแต้ม **+1 แต้มต่อดวง**</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#00f0ff] font-mono font-bold">02.</span>
                <span>เวลาจำกัดรอบละ **30 วินาที** คัดกรองความว่องไวอย่างเข้มข้นที่สุด</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#7000ff] font-mono font-bold">03.</span>
                <span>สถิติที่ทำได้จะจัดเก็บบนคลาวด์/เซิร์ฟเวอร์ และอัปเดต High Score ของนักกีฬาทันที</span>
              </li>
            </ul>
          </div>

          {/* Stats Box */}
          <div className="p-5 bg-[#0a0f18] border border-[#1a2333] rounded-lg space-y-4">
            <h4 className="font-mono font-black uppercase tracking-[0.2em] text-[#7000ff] text-xs">ATHLETE EVALUATION</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded-sm border border-[#1a2333] border-r-2 border-r-[#00f0ff] text-center">
                <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block">PERSONAL HIGH</span>
                <span className="text-3xl font-mono font-black text-[#00f0ff] mt-1 block tracking-wider drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                  {highScore}
                </span>
              </div>
              <div className="bg-black/40 p-4 rounded-sm border border-[#1a2333] border-r-2 border-r-[#7000ff] text-center">
                <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block">PLAYER ID</span>
                <span className="text-xs font-mono font-bold text-[#7000ff] mt-3 block overflow-hidden text-ellipsis whitespace-nowrap" title={user.player_id}>
                  {user.player_id}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-black/40 rounded-sm border border-[#1a2333] flex justify-between items-center text-xs">
              <span className="text-gray-400">ระดับยศความคล่องแคล่ว:</span>
              <span className={`font-mono text-xs font-bold ${getRankBadge(highScore).class}`}>
                {getRankBadge(highScore).label}
              </span>
            </div>
          </div>

          {/* Diagnostic Log Output Emulator */}
          <div className="p-4 bg-black/90 rounded-lg border border-[#1a2333] shadow-lg space-y-3">
            <div className="flex justify-between items-center text-[10px] text-[#00f0ff]/80 font-mono uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                SYSTEM DIAGNOSTIC LOGS
              </span>
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
            </div>
            <div className="font-mono text-[10px] text-[#00f0ff]/70 space-y-1.5 h-36 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {logs.map((log, index) => (
                <div key={index} className="leading-normal">{log}</div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Render Canvas & Camera Stream */}
        <div className="lg:col-span-8 flex flex-col space-y-4 items-center w-full">
          
          {/* Game stats tracker banner */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-center bg-[#0a0f18] p-5 rounded-lg border border-[#1a2333] gap-4">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">REACTION SCORE</span>
              <span className="text-3xl font-mono font-black text-[#00f0ff] block leading-tight drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                {score}
              </span>
            </div>

            <div className="text-center w-full sm:w-auto">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">CLOCK LIMIT</span>
              <div className={`mt-1 bg-black/60 px-4 py-1.5 border border-[#ff0000] text-[#ff0000] text-sm font-mono font-bold flex items-center justify-center space-x-2 ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>
                <div className="w-2 h-2 bg-[#ff0000] rounded-full animate-ping"></div>
                <span className="font-bold tracking-widest">{timeLeft < 10 ? `0${timeLeft}` : timeLeft}:00</span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <button
                onClick={startGame}
                disabled={isPlaying}
                className="w-full sm:w-auto px-8 py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/90 disabled:opacity-40 disabled:pointer-events-none text-black font-mono font-black text-xs uppercase tracking-widest rounded-sm transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                START TRIAL
              </button>
            </div>
          </div>

          {/* Core Interactive AR Stage Area */}
          <div className="relative w-full max-w-[640px] aspect-[4/3] rounded-lg overflow-hidden bg-[#111827] border border-[#1a2333] shadow-[0_0_30px_rgba(0,240,255,0.15)]">
            
            {/* Hidden Raw Mirrored Video for MediaPipe Hand Detection */}
            <video
              ref={videoRef}
              id="webcam"
              autoPlay
              playsinline
              muted
              className="absolute pointer-events-none w-px h-px opacity-0"
            ></video>

            {/* Core Interactive Star-catching Canvas */}
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              className="w-full h-full object-cover cursor-crosshair"
            ></canvas>

            {/* Loading MediaPipe & Cam Permission Box */}
            {!simulationMode && loadingMediaPipe && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-[#00f0ff]/20 border-t-[#00f0ff] animate-spin"></div>
                <h4 className="font-mono font-bold text-white text-sm uppercase tracking-wider">กำลังดาวน์โหลดโมเดล MediaPipe...</h4>
                <p className="text-xs text-gray-400 max-w-sm">
                  ระบบกำลังรวบรวมไลบรารีสแกนกระดูกข้อมือและพิกัดความละเอียดสูงผ่าน CDN
                </p>
              </div>
            )}

            {/* Requesting camera permissions */}
            {!simulationMode && !loadingMediaPipe && !cameraActive && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <CameraIcon className="w-12 h-12 text-[#00f0ff] animate-bounce" />
                <h4 className="font-mono font-bold text-white text-sm uppercase tracking-wider">กำลังเชื่อมต่อกับกล้องหลัก...</h4>
                <p className="text-xs text-gray-400 max-w-sm">
                  กรุณากด "อนุญาต (Allow)" สิทธิ์กล้องเว็บแคม เพื่อทำการคัดเลือกผ่านระบบสแกนประสาทสัมผัสมือ
                </p>
              </div>
            )}

            {/* Game Over Screen Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6 space-y-6">
                <span className="px-3 py-1 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-mono text-xs font-semibold uppercase tracking-widest rounded-sm animate-pulse">
                  TRIAL REPORT COMPLETE
                </span>
                
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans">
                  หมดเวลาการทดสอบ
                </h3>

                <div className="bg-[#0a0f18] p-4 border border-[#1a2333] rounded-lg w-full max-w-xs space-y-1">
                  <p className="text-gray-400 text-xs">แต้มความไวที่ทำได้</p>
                  <p className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-white drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                    {score}
                  </p>
                </div>

                {/* Score saving and record feedback */}
                <div className="text-xs font-mono font-semibold text-emerald-400 flex items-center justify-center gap-1.5 h-6">
                  {savingScore ? (
                    <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-400 animate-spin rounded-full"></div>
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{scoreSaveStatus}</span>
                </div>

                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/95 text-black font-mono font-black text-xs uppercase tracking-widest rounded-sm transition shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  RETRY TRIAL
                </button>
              </div>
            )}

          </div>

          {/* Mouse simulation hint info */}
          {simulationMode && !gameOver && (
            <div className="text-xs text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-4 py-2 rounded-lg text-center max-w-lg">
              📢 <strong>อยู่ในโหมดจำลองเมาส์ (Mouse Simulation Mode)</strong>: ปลายเป้าทดสอบจะเคลื่อนที่ตามเคอร์เซอร์เมาส์ของคุณ เลื่อนเมาส์ไปแตะดาวภายในกล่อง Canvas เพื่อเก็บคะแนน!
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
