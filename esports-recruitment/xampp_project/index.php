<?php
// index.php - Login and Esports Landing Page
session_start();
require_once 'db.php';

// If user is already logged in, redirect to the AR game
if (isset($_SESSION['user_id'])) {
    header("Location: game.php");
    exit();
}

$error = '';
$success_message = '';

// Check if redirected from register.php with automatic password prefill or register success
if (isset($_SESSION['reg_success'])) {
    $success_message = $_SESSION['reg_success'];
    unset($_SESSION['reg_success']);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    if (!empty($username) && !empty($password)) {
        // Fetch user from database
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Authentication successful, store user details in Session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['player_id'] = $user['player_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['fullname'] = $user['fullname'];
            $_SESSION['high_score'] = $user['high_score'];
            
            header("Location: game.php");
            exit();
        } else {
            $error = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!";
        }
    } else {
        $error = "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน!";
    }
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Esports Recruitment - ค้นหานักกีฬาดาวรุ่งระดับโลก</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800;900&family=Prompt:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Prompt', sans-serif;
            background-color: #0d0e12;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(0, 242, 254, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(255, 0, 128, 0.05) 0%, transparent 40%);
        }
        .font-orbitron {
            font-family: 'Orbitron', sans-serif;
        }
        .neon-border {
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
            border: 1px solid rgba(6, 182, 212, 0.5);
        }
        .neon-text-cyan {
            text-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
        }
        .neon-text-rose {
            text-shadow: 0 0 8px rgba(244, 63, 94, 0.6);
        }
        .neon-button-cyan {
            background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
            transition: all 0.3s ease;
        }
        .neon-button-cyan:hover {
            box-shadow: 0 0 25px rgba(6, 182, 212, 0.8);
            transform: translateY(-2px);
        }
    </style>
</head>
<body class="min-h-screen text-gray-200 flex flex-col justify-between">

    <!-- Header Section -->
    <header class="border-b border-gray-800 bg-gray-950/60 backdrop-blur-md py-4 px-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center font-orbitron font-black text-xl text-white">
                    E
                </div>
                <span class="font-orbitron font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
                    NEXUS ESPORTS
                </span>
            </div>
            <div class="text-xs font-orbitron text-cyan-400 font-semibold uppercase tracking-widest px-3 py-1 bg-cyan-950/40 rounded-full border border-cyan-800/40">
                ● STATUS: RECRUITING ACTIVE
            </div>
        </div>
    </header>

    <!-- Main Content Grid -->
    <main class="max-w-7xl mx-auto px-6 py-12 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        
        <!-- Left Side: Esports Recruitment Info -->
        <div class="lg:col-span-7 space-y-6">
            <span class="inline-block bg-pink-500/10 text-pink-500 border border-pink-500/30 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest font-orbitron">
                Global Tryout & Recruitment 2026
            </span>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                ก้าวข้ามขีดจำกัด <br>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
                    สู่นักกีฬามืออาชีพ
                </span>
            </h1>
            <p class="text-gray-400 text-lg leading-relaxed max-w-xl">
                โครงการเฟ้นหาดาวรุ่ง Esports สู่เวทีระดับโลก! โอกาสสุดท้ายในการเข้าสู่สังกัดยักษ์ใหญ่อย่าง <strong class="text-cyan-400">NEXUS ESPORTS</strong> 
                เราไม่จำกัดระดับหรือประเภทเกม แต่เรามองหาผู้เล่นที่มีปฏิกิริยาตอบสนองเฉียบคม (Reaction Speed) และสมาธิอันเหนือชั้น 
            </p>
            
            <div class="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm space-y-4 max-w-xl">
                <h3 class="font-orbitron font-bold text-cyan-400 flex items-center text-lg">
                    <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 mr-2 animate-ping"></span>
                    AR REACTION TESTING MODULE
                </h3>
                <p class="text-sm text-gray-300">
                    ผู้สมัครทุกคนต้องผ่านระบบการทดสอบสายตาและประสาทสัมผัสแบบ AR Hand-Tracking โดยใช้กล้องเว็บแคมในการจับการเคลื่อนไหวเพื่อทดสอบคะแนนเพื่อใช้ประกอบการสมัครและเซ็นสัญญาโปรเพลเยอร์!
                </p>
            </div>
        </div>

        <!-- Right Side: Login Box -->
        <div class="lg:col-span-5">
            <div class="bg-gray-950/80 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                
                <!-- Background decoration in login card -->
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
                <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>

                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-white tracking-wide">เข้าสู่ระบบคัดตัว</h2>
                    <p class="text-sm text-gray-400 mt-1">กรอกข้อมูลผู้ใช้เพื่อเข้าทดสอบความเร็วตอบสนอง</p>
                </div>

                <!-- Message Alerts -->
                <?php if ($error): ?>
                    <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center">
                        <svg class="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <span><?= htmlspecialchars($error) ?></span>
                    </div>
                <?php endif; ?>

                <?php if ($success_message): ?>
                    <div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex flex-col space-y-2">
                        <div class="flex items-center font-bold">
                            <svg class="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span><?= htmlspecialchars($success_message) ?></span>
                        </div>
                        <?php if (isset($_SESSION['last_registered_username'])): ?>
                            <div class="bg-black/40 p-2.5 rounded-lg text-xs space-y-1 border border-emerald-500/20">
                                <div><span class="text-gray-400">ชื่อผู้ใช้:</span> <span class="font-mono text-cyan-400 font-bold"><?= htmlspecialchars($_SESSION['last_registered_username']) ?></span></div>
                                <?php if (isset($_SESSION['last_registered_player_id'])): ?>
                                    <div><span class="text-gray-400">Player ID:</span> <span class="font-mono text-pink-400 font-bold"><?= htmlspecialchars($_SESSION['last_registered_player_id']) ?></span></div>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

                <!-- Form -->
                <form action="index.php" method="POST" class="space-y-5">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Username (ชื่อผู้ใช้)</label>
                        <input type="text" name="username" required
                            placeholder="กรอกชื่อผู้ใช้งานของคุณ"
                            value="<?= isset($_SESSION['last_registered_username']) ? htmlspecialchars($_SESSION['last_registered_username']) : '' ?>"
                            class="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200">
                    </div>

                    <div>
                        <div class="flex justify-between mb-2">
                            <label class="block text-xs font-bold uppercase tracking-widest text-gray-400">Password (รหัสผ่าน)</label>
                        </div>
                        <input type="password" name="password" required
                            placeholder="กรอกรหัสผ่านของคุณ"
                            class="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200">
                    </div>

                    <button type="submit" class="w-full py-3.5 rounded-xl font-orbitron font-bold tracking-wider text-white uppercase neon-button-cyan cursor-pointer">
                        LOGIN ACCESS
                    </button>
                </form>

                <div class="mt-8 pt-6 border-t border-gray-900 text-center">
                    <p class="text-sm text-gray-400">ยังไม่ได้สมัครเป็นโปรเพลเยอร์ในระบบ?</p>
                    <a href="register.php" class="inline-block mt-3 px-6 py-2.5 border border-pink-500/50 hover:bg-pink-500/10 hover:border-pink-500 text-pink-400 text-sm font-bold rounded-xl transition duration-300">
                        ลงทะเบียนโปรเพลเยอร์ (Register)
                    </a>
                </div>

            </div>
        </div>

    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-900 bg-black/60 py-6 text-center text-xs text-gray-500">
        <p>© 2026 NEXUS ESPORTS CLUB. ALL RIGHTS RESERVED. POWERED BY AR TESTING TECHNOLOGY.</p>
    </footer>

</body>
</html>
