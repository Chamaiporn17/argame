<?php
// game.php - Esports AR Hand Tracking Game
session_start();
require_once 'db.php';

// Check if user is logged in, otherwise redirect to index.php
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Fetch latest high score from database to ensure accuracy
$stmt = $pdo->prepare("SELECT high_score, fullname, player_id FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch();

if ($user) {
    $_SESSION['high_score'] = $user['high_score'];
    $fullname = $user['fullname'];
    $player_id = $user['player_id'];
    $high_score = $user['high_score'];
} else {
    // Fallback
    $fullname = $_SESSION['fullname'];
    $player_id = $_SESSION['player_id'];
    $high_score = $_SESSION['high_score'];
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Esports AR Reaction Test - NEXUS ESPORTS</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Prompt:wght@300;400;500;700&display=swap" rel="stylesheet">
    
    <!-- MediaPipe Hands & Camera CDNs -->
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>

    <style>
        body {
            font-family: 'Prompt', sans-serif;
            background-color: #0d0e12;
            background-image: 
                radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 60%);
        }
        .font-orbitron {
            font-family: 'Orbitron', sans-serif;
        }
        .gaming-grid {
            border: 1px solid rgba(6, 182, 212, 0.15);
            background: linear-gradient(180deg, rgba(13, 14, 18, 0.9) 0%, rgba(6, 10, 15, 0.95) 100%);
        }
        .hud-glow {
            text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
        .hud-glow-pink {
            text-shadow: 0 0 10px rgba(244, 63, 94, 0.5);
        }
        /* Hidden mirrored video for hand analysis */
        #webcam {
            transform: scaleX(-1);
            display: none;
        }
        /* Custom game canvas */
        #gameCanvas {
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.25);
            border: 2px solid rgba(6, 182, 212, 0.3);
            border-radius: 1.5rem;
            background-color: #020617;
        }
    </style>
</head>
<body class="min-h-screen text-gray-200 flex flex-col justify-between">

    <!-- Navbar -->
    <header class="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md py-4 px-6 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center font-orbitron font-black text-xl text-white shadow-lg">
                    E
                </div>
                <span class="font-orbitron font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
                    NEXUS ESPORTS
                </span>
            </div>
            
            <div class="flex items-center space-x-6">
                <!-- User Profile Info -->
                <div class="hidden md:flex items-center space-x-3 bg-gray-900/60 px-4 py-2 rounded-xl border border-gray-800">
                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div class="text-xs text-left">
                        <div class="font-bold text-gray-300"><?= htmlspecialchars($fullname) ?></div>
                        <div class="font-mono text-cyan-400 font-semibold"><?= htmlspecialchars($player_id) ?></div>
                    </div>
                </div>

                <!-- Logout Button -->
                <a href="logout.php" class="px-5 py-2 border border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500 text-rose-400 text-xs font-orbitron font-bold tracking-wider rounded-xl transition duration-300">
                    LOGOUT
                </a>
            </div>
        </div>
    </header>

    <!-- Main Game Section -->
    <main class="max-w-7xl mx-auto px-6 py-8 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Side: Instructions & Statistics -->
        <div class="lg:col-span-4 space-y-6">
            
            <!-- Game Rule Box -->
            <div class="gaming-grid rounded-2xl p-6 border border-gray-800 space-y-4 shadow-xl">
                <h3 class="font-orbitron font-bold text-cyan-400 text-lg flex items-center border-b border-gray-800 pb-3">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    AR TESTING PROTOCOL
                </h3>
                <ul class="space-y-3 text-sm text-gray-400">
                    <li class="flex items-start">
                        <span class="text-cyan-400 mr-2 font-bold font-orbitron">01.</span>
                        <span>อนุญาตการเข้าถึง <strong>กล้องเว็บแคม (Webcam)</strong> เพื่อเปิดระบบ Hand Tracking จับตำแหน่งมือ</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-cyan-400 mr-2 font-bold font-orbitron">02.</span>
                        <span>ใช้ <strong>ปลายนิ้วชี้ (Index Fingertip)</strong> เพื่อเลื่อนตำแหน่งควบคุมเป้าคัดตัวบนหน้าจอ</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-cyan-400 mr-2 font-bold font-orbitron">03.</span>
                        <span>เคลื่อนไหวนิ้วชี้ไปชน <strong>"ดาวปฏิกิริยา (Action Stars)"</strong> เพื่อเก็บแต้มให้ได้มากที่สุดในเวลา 30 วินาที</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-pink-500 mr-2 font-bold font-orbitron">04.</span>
                        <span>คะแนนล่าสุดที่สูงกว่าคะแนนเดิมจะถูกบันทึกเป็น High Score ใหม่ลงฐานข้อมูลของคุณทันที</span>
                    </li>
                </ul>
            </div>

            <!-- Stats Box -->
            <div class="gaming-grid rounded-2xl p-6 border border-gray-800 shadow-xl space-y-4">
                <h4 class="font-orbitron font-bold text-gray-300 text-sm tracking-wider uppercase">ATHLETE PROFILE STATS</h4>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gray-950/60 p-4 rounded-xl border border-gray-900 text-center">
                        <div class="text-xs text-gray-500 uppercase tracking-widest font-orbitron">CURRENT HIGH</div>
                        <div id="highScoreText" class="text-3xl font-orbitron font-black text-pink-500 mt-1 hud-glow-pink"><?= htmlspecialchars($high_score) ?></div>
                    </div>
                    <div class="bg-gray-950/60 p-4 rounded-xl border border-gray-900 text-center">
                        <div class="text-xs text-gray-500 uppercase tracking-widest font-orbitron">PLAYER ID</div>
                        <div class="text-lg font-orbitron font-bold text-cyan-400 mt-2 tracking-wide"><?= htmlspecialchars($player_id) ?></div>
                    </div>
                </div>

                <div class="bg-gray-950/40 p-4 rounded-xl border border-gray-900 flex justify-between items-center text-sm">
                    <span class="text-gray-400">สถานะนักกีฬา:</span>
                    <span id="rankBadge" class="font-bold text-cyan-400 font-orbitron">
                        <?php 
                        if ($high_score >= 30) echo "S-RANK CHRONO";
                        elseif ($high_score >= 20) echo "A-RANK ASSASSIN";
                        elseif ($high_score >= 10) echo "B-RANK STRIKER";
                        else echo "ROOKIE";
                        ?>
                    </span>
                </div>
            </div>

            <!-- Developer Log console emulator -->
            <div class="bg-black/80 rounded-2xl p-4 border border-gray-900 font-mono text-xs text-cyan-500/70 space-y-1 h-36 overflow-y-auto" id="logConsole">
                <div>[SYSTEM] Initializing telemetry data...</div>
                <div>[SYSTEM] Camera driver ready.</div>
                <div>[SYSTEM] MediaPipe Hand Engine initialized.</div>
                <div>[SYSTEM] Waiting for athlete confirmation...</div>
            </div>

        </div>

        <!-- Right Side: Game Canvas & Webcam Stream -->
        <div class="lg:col-span-8 flex flex-col items-center space-y-6">
            
            <!-- Game UI Display Header (Score, Time) -->
            <div class="w-full flex justify-between items-center bg-gray-900/40 px-6 py-4 rounded-2xl border border-gray-800/60 backdrop-blur-sm">
                <div>
                    <div class="text-xs uppercase tracking-widest text-gray-500 font-orbitron">LIVE SCORE</div>
                    <div id="liveScore" class="text-4xl font-orbitron font-black text-cyan-400 tracking-wider hud-glow">0</div>
                </div>
                
                <div class="text-center">
                    <div class="text-xs uppercase tracking-widest text-gray-500 font-orbitron">TIME REMAINING</div>
                    <div id="timerText" class="text-4xl font-orbitron font-black text-rose-500 tracking-wider hud-glow-pink">30s</div>
                </div>

                <div>
                    <button id="startGameBtn" class="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-orbitron font-bold uppercase tracking-wider rounded-xl transition shadow-lg cursor-pointer">
                        START TRIAL
                    </button>
                </div>
            </div>

            <!-- AR Gaming Container -->
            <div class="relative w-full max-w-[640px] aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border border-gray-800">
                <!-- Mirrored raw webcam stream (hidden from direct rendering, processed by MediaPipe) -->
                <video id="webcam" autoplay playsinline></video>
                
                <!-- Main Game Canvas where mirrored camera frame, stars, targets, and hand skeleton are drawn -->
                <canvas id="gameCanvas" class="w-full h-full object-cover"></canvas>

                <!-- Webcam Loading and Permision Overlay -->
                <div id="cameraPrompt" class="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div class="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
                    <h4 class="font-orbitron font-bold text-white text-lg">กำลังเชื่อมต่อกล้องเว็บแคม...</h4>
                    <p class="text-xs text-gray-400 max-w-sm">
                        กรุณากด "อนุญาต (Allow)" เพื่อให้ระบบใช้งานกล้อง และนำใบหน้ากับมือเข้าสู่ขอบเขตการสแกนระบบ AR
                    </p>
                </div>

                <!-- Game Over Screen Overlay -->
                <div id="gameOverScreen" class="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 space-y-6 hidden">
                    <span class="px-4 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-500 font-orbitron text-xs font-bold uppercase tracking-widest rounded-full animate-pulse">
                        TRIAL COMPLETE
                    </span>
                    <h3 class="text-5xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
                        GAME OVER
                    </h3>
                    <div class="space-y-1">
                        <p class="text-gray-400 text-sm">คะแนนทดสอบการปฏิกิริยา (Reaction Score)</p>
                        <p id="finalScore" class="text-6xl font-orbitron font-black text-white">0</p>
                    </div>
                    <div id="scoreSavedMsg" class="text-sm font-semibold text-emerald-400 flex items-center justify-center">
                        <!-- Filled dynamically by AJAX result -->
                    </div>
                    <div class="flex space-x-4">
                        <button id="restartBtn" class="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold uppercase tracking-wide rounded-xl transition cursor-pointer">
                            RETRY TRIAL
                        </button>
                    </div>
                </div>
            </div>

        </div>

    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-900 bg-black/60 py-6 text-center text-xs text-gray-500">
        <p>© 2026 NEXUS ESPORTS CLUB. ALL RIGHTS RESERVED. POWERED BY AR TESTING TECHNOLOGY.</p>
    </footer>

    <!-- Game Script & MediaPipe Implementation -->
    <script>
        // DOM Elements
        const videoElement = document.getElementById('webcam');
        const canvasElement = document.getElementById('gameCanvas');
        const canvasCtx = canvasElement.getContext('2d');
        const startBtn = document.getElementById('startGameBtn');
        const restartBtn = document.getElementById('restartBtn');
        const cameraPrompt = document.getElementById('cameraPrompt');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const liveScoreText = document.getElementById('liveScore');
        const finalScoreText = document.getElementById('finalScore');
        const timerText = document.getElementById('timerText');
        const highScoreText = document.getElementById('highScoreText');
        const rankBadge = document.getElementById('rankBadge');
        const scoreSavedMsg = document.getElementById('scoreSavedMsg');
        const logConsole = document.getElementById('logConsole');

        // Game Configuration & State
        let gameActive = false;
        let gameScore = 0;
        let timeRemaining = 30; // 30 seconds game round
        let gameTimer = null;
        let handTracked = false;

        // Target Star Coordinates and size
        let star = {
            x: 0,
            y: 0,
            radius: 20,
            glow: 15,
            hue: 180 // Cyan star
        };

        // Hand Position trackers
        let pointerFinger = { x: 0, y: 0, isDetected: false };

        // Logger Helper
        function logToConsole(message) {
            const time = new Date().toLocaleTimeString();
            logConsole.innerHTML += `<div>[${time}] ${message}</div>`;
            logConsole.scrollTop = logConsole.scrollHeight;
        }

        // 1. Initialize Canvas Size (Maintain 4:3 Aspect Ratio)
        function resizeCanvas() {
            canvasElement.width = 640;
            canvasElement.height = 480;
        }
        resizeCanvas();

        // 2. Spawn a target star at a random location on the canvas
        function spawnStar() {
            const padding = 50;
            star.x = Math.floor(Math.random() * (canvasElement.width - padding * 2)) + padding;
            star.y = Math.floor(Math.random() * (canvasElement.height - padding * 2)) + padding;
            star.hue = Math.floor(Math.random() * 360); // Random colors!
        }
        spawnStar(); // Initial spawn

        // 3. Setup MediaPipe Hands Integration
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,                 // Track only 1 hand for game focus
            modelComplexity: 1,             // 1 means high precision, low CPU overhead
            minDetectionConfidence: 0.6,    // Detection confidence threshold
            minTrackingConfidence: 0.5      // Tracking confidence threshold
        });

        // Callback function fired every time MediaPipe analyzes a frame
        hands.onResults(onResults);

        function onResults(results) {
            // Hide camera loader on first frame analysis
            if (cameraPrompt) {
                cameraPrompt.classList.add('hidden');
            }

            // Clear Canvas
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // Draw Mirror Webcam Image as Canvas Background
            canvasCtx.save();
            canvasCtx.translate(canvasElement.width, 0);
            canvasCtx.scale(-1, 1); // Mirror video so that left/right feels natural to the player
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.restore();

            // Overlay subtle futuristic scan lines
            drawScanLines();

            pointerFinger.isDetected = false;

            // Check if any hands are detected in the webcam stream
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                handTracked = true;
                const landmarks = results.multiHandLandmarks[0];

                /*
                    MediaPipe Hand Landmark Indices:
                    - 0: WRIST (ข้อมือ)
                    - 4: THUMB_TIP (ปลายนิ้วโป้ง)
                    - 8: INDEX_FINGER_TIP (ปลายนิ้วชี้)  <-- We use index 8 for collision
                    - 12: MIDDLE_FINGER_TIP (ปลายนิ้วกลาง)
                    - 16: RING_FINGER_TIP (ปลายนิ้วนาง)
                    - 20: PINKY_TIP (ปลายนิ้วก้อย)
                */
                const indexTip = landmarks[8];

                // Convert normalized landmarks (0.0 to 1.0) into canvas coordinate values
                // Since the video is mirrored horizontally, we flip the X landmark as well: (1 - x)
                const px = (1 - indexTip.x) * canvasElement.width;
                const py = indexTip.y * canvasElement.height;

                pointerFinger.x = px;
                pointerFinger.y = py;
                pointerFinger.isDetected = true;

                // Draw Hand Landmarks Skeletal Mesh
                drawHandSkeleton(landmarks);

                // Draw a beautiful targeting cursor on the index fingertip
                drawTargetCursor(px, py);

                // If game is active, perform Collision Detection
                if (gameActive) {
                    checkCollision(px, py);
                }
            } else {
                if (handTracked) {
                    handTracked = false;
                    logToConsole("LOST TRACKING: กรุณาวางมือลงในขอบเขตสแกนของกล้อง");
                }
            }

            // Draw current active target star
            if (gameActive) {
                drawStar();
            }
        }

        // Draw HUD Scan Lines for Cyberpunk Atmosphere
        function drawScanLines() {
            canvasCtx.fillStyle = "rgba(6, 182, 212, 0.03)";
            for (let i = 0; i < canvasElement.height; i += 4) {
                canvasCtx.fillRect(0, i, canvasElement.width, 1.5);
            }
        }

        // Draw Skeletal Joints connecting key hand coordinates
        function drawHandSkeleton(landmarks) {
            canvasCtx.lineWidth = 3;
            canvasCtx.strokeStyle = "rgba(244, 63, 94, 0.6)"; // Pink joints
            canvasCtx.fillStyle = "rgba(6, 182, 212, 0.9)";   // Cyan node joints

            // Quick function to draw joint connections
            function drawLine(pt1, pt2) {
                const x1 = (1 - landmarks[pt1].x) * canvasElement.width;
                const y1 = landmarks[pt1].y * canvasElement.height;
                const x2 = (1 - landmarks[pt2].x) * canvasElement.width;
                const y2 = landmarks[pt2].y * canvasElement.height;

                canvasCtx.beginPath();
                canvasCtx.moveTo(x1, y1);
                canvasCtx.lineTo(x2, y2);
                canvasCtx.stroke();
            }

            // Draw finger joint linkages
            // Index Finger Link (5-6-7-8)
            drawLine(5, 6); drawLine(6, 7); drawLine(7, 8);
            // Thumb Link (1-2-3-4)
            drawLine(1, 2); drawLine(2, 3); drawLine(3, 4);
            // Middle Finger Link (9-10-11-12)
            drawLine(9, 10); drawLine(10, 11); drawLine(11, 12);
            // Ring Finger Link (13-14-15-16)
            drawLine(13, 14); drawLine(14, 15); drawLine(15, 16);
            // Pinky Link (17-18-19-20)
            drawLine(17, 18); drawLine(18, 19); drawLine(19, 20);
            // Wrist connections
            drawLine(0, 1); drawLine(0, 5); drawLine(0, 17);
            drawLine(5, 9); drawLine(9, 13); drawLine(13, 17);

            // Draw tiny circles at each joint node
            landmarks.forEach((landmark, index) => {
                const x = (1 - landmark.x) * canvasElement.width;
                const y = landmark.y * canvasElement.height;
                
                canvasCtx.beginPath();
                canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);
                canvasCtx.fill();
            });
        }

        // Draw Custom Cursor over Index Fingertip
        function drawTargetCursor(x, y) {
            // Draw outer neon ring
            canvasCtx.strokeStyle = "#06b6d4";
            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 15, 0, 2 * Math.PI);
            canvasCtx.stroke();

            // Draw center point
            canvasCtx.fillStyle = "#f43f5e";
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
            canvasCtx.fill();

            // Crosshair ticks
            canvasCtx.beginPath();
            canvasCtx.moveTo(x - 22, y); canvasCtx.lineTo(x - 12, y);
            canvasCtx.moveTo(x + 12, y); canvasCtx.lineTo(x + 22, y);
            canvasCtx.moveTo(x, y - 22); canvasCtx.lineTo(x, y - 12);
            canvasCtx.moveTo(x, y + 12); canvasCtx.lineTo(x, y + 22);
            canvasCtx.stroke();
        }

        // Draw Interactive Glow Star
        function drawStar() {
            canvasCtx.shadowBlur = star.glow;
            canvasCtx.shadowColor = `hsl(${star.hue}, 100%, 50%)`;
            canvasCtx.fillStyle = `hsl(${star.hue}, 100%, 65%)`;

            // Draw beautiful Star shape on Canvas
            canvasCtx.beginPath();
            const cx = star.x;
            const cy = star.y;
            const spikes = 5;
            const outerRadius = star.radius;
            const innerRadius = star.radius / 2;
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            canvasCtx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                canvasCtx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                canvasCtx.lineTo(x, y);
                rot += step;
            }
            canvasCtx.lineTo(cx, cy - outerRadius);
            canvasCtx.closePath();
            canvasCtx.fill();
            
            // Reset shadows for standard drawing optimization
            canvasCtx.shadowBlur = 0;
        }

        // collision detection (Chrono Collision logic)
        function checkCollision(px, py) {
            const dx = px - star.x;
            const dy = py - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If distance between fingertip and star center is less than the radius boundary
            if (distance < (star.radius + 15)) {
                gameScore++;
                liveScoreText.innerText = gameScore;
                
                // Visual Spark effect at current position before spawning elsewhere
                logToConsole(`SUCCESS: ปฏิกิริยาสำเร็จ! +1 แต้ม (Score: ${gameScore})`);
                
                // Relocate Star
                spawnStar();
            }
        }

        // 4. Start webcam video feed and tie it to camera utils
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                // Pipe webcam frame into MediaPipe Hands
                await hands.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });

        // Initialize webcam
        camera.start().then(() => {
            logToConsole("CAMERA: การทำงานกล้องเชื่อมต่อสำเร็จ");
        }).catch(err => {
            logToConsole("ERROR: ไม่สามารถเชื่อมต่อกล้องเว็บแคมได้! " + err);
            alert("ไม่สามารถเข้าถึงกล้องเว็บแคมได้ กรุณาอนุมัติสิทธิ์การใช้กล้อง");
        });

        // 5. Game Loop & Session Controls
        function startGame() {
            if (gameActive) return;

            logToConsole("GAME: เริ่มต้นการคัดตัวจับเวลา 30 วินาที... สู้เพื่อเกียรติยศ!");
            gameActive = true;
            gameScore = 0;
            timeRemaining = 30;

            liveScoreText.innerText = gameScore;
            timerText.innerText = timeRemaining + "s";
            
            startBtn.classList.add('opacity-50', 'pointer-events-none');
            gameOverScreen.classList.add('hidden');

            spawnStar();

            // Set countdown interval timer
            gameTimer = setInterval(() => {
                timeRemaining--;
                timerText.innerText = timeRemaining + "s";

                if (timeRemaining <= 0) {
                    endGame();
                }
            }, 1000);
        }

        function endGame() {
            clearInterval(gameTimer);
            gameActive = false;
            startBtn.classList.remove('opacity-50', 'pointer-events-none');
            
            logToConsole(`GAME OVER: หมดเวลา! คุณทำคะแนนทดสอบปฏิกิริยาไปได้ทั้งหมด ${gameScore} คะแนน`);
            
            // Show Game Over Modal
            finalScoreText.innerText = gameScore;
            gameOverScreen.classList.remove('hidden');

            // Send score to server via fetch (AJAX)
            saveScore(gameScore);
        }

        // 6. Update High Score to database via AJAX/Fetch API
        function saveScore(score) {
            scoreSavedMsg.innerHTML = `<span class="text-cyan-400">กำลังเชื่อมต่อข้อมูลผู้เซ็นสัญญา...</span>`;
            
            fetch('update_score.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: score })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    if (data.updated) {
                        scoreSavedMsg.innerHTML = `
                            <div class="flex flex-col items-center space-y-1 text-emerald-400">
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>NEW RECORD! บันทึกสถิติใหม่สำเร็จ</span>
                                </div>
                                <span class="text-xs text-gray-400">สถิติสูงสุดใหม่: ${data.new_high_score} แต้ม</span>
                            </div>`;
                        // Update UI values immediately
                        highScoreText.innerText = data.new_high_score;
                        highScoreText.classList.add('scale-110');
                        setTimeout(() => highScoreText.classList.remove('scale-110'), 300);
                        
                        // Update Rank badge
                        updateRankBadge(data.new_high_score);
                        logToConsole(`DATABASE: อัปเดตสถิติใหม่สูงสุดในเซิร์ฟเวอร์: ${data.new_high_score} แต้ม`);
                    } else {
                        scoreSavedMsg.innerHTML = `<span class="text-gray-400 text-xs">คุณต้องทำคะแนนให้สูงกว่า ${data.current_high} แต้มเพื่อทุบสถิติเดิม</span>`;
                        logToConsole(`DATABASE: สถิติสูงสุดยังเป็น ${data.current_high} แต้ม (คะแนนปัจจุบันคือ ${score})`);
                    }
                } else {
                    scoreSavedMsg.innerHTML = `<span class="text-rose-400 text-xs">Error: ${data.message}</span>`;
                }
            })
            .catch(error => {
                console.error('Error saving score:', error);
                scoreSavedMsg.innerHTML = `<span class="text-rose-400 text-xs">เซิร์ฟเวอร์ไม่ตอบสนอง ไม่สามารถบันทึกสถิติได้</span>`;
            });
        }

        function updateRankBadge(score) {
            if (score >= 30) {
                rankBadge.innerText = "S-RANK CHRONO";
                rankBadge.className = "font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 font-orbitron";
            } else if (score >= 20) {
                rankBadge.innerText = "A-RANK ASSASSIN";
                rankBadge.className = "font-bold text-pink-500 font-orbitron";
            } else if (score >= 10) {
                rankBadge.innerText = "B-RANK STRIKER";
                rankBadge.className = "font-bold text-cyan-400 font-orbitron";
            } else {
                rankBadge.innerText = "ROOKIE";
                rankBadge.className = "font-bold text-gray-400 font-orbitron";
            }
        }

        // Event Listeners
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', () => {
            gameOverScreen.classList.add('hidden');
            startGame();
        });
    </script>
</body>
</html>
