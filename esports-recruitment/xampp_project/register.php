<?php
// register.php - Register Page for Player Accounts
session_start();
require_once 'db.php';

// If user is already logged in, redirect to the AR game
if (isset($_SESSION['user_id'])) {
    header("Location: game.php");
    exit();
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullname = trim($_POST['fullname']);
    $email = trim($_POST['email']);
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    if (!empty($fullname) && !empty($email) && !empty($username) && !empty($password)) {
        
        // 1. Check if username or email already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = :username OR email = :email");
        $stmt->execute(['username' => $username, 'email' => $email]);
        if ($stmt->fetchColumn() > 0) {
            $error = "ชื่อผู้ใช้หรืออีเมลนี้ได้รับการลงทะเบียนแล้ว!";
        } else {
            // 2. Generate a unique Esports Player ID (e.g., NXS-8429)
            $is_unique = false;
            $player_id = '';
            while (!$is_unique) {
                $random_num = rand(10000, 99999);
                $player_id = "NXS-" . $random_num;
                
                // Verify uniqueness
                $check_stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE player_id = :player_id");
                $check_stmt->execute(['player_id' => $player_id]);
                if ($check_stmt->fetchColumn() == 0) {
                    $is_unique = true;
                }
            }

            // 3. Encrypt the password using password_hash
            $hashed_password = password_hash($password, PASSWORD_BCRYPT);

            // 4. Insert into database
            try {
                $insert_stmt = $pdo->prepare("INSERT INTO users (player_id, username, password, fullname, email, high_score) VALUES (:player_id, :username, :password, :fullname, :email, 0)");
                $insert_stmt->execute([
                    'player_id' => $player_id,
                    'username' => $username,
                    'password' => $hashed_password,
                    'fullname' => $fullname,
                    'email' => $email
                ]);

                // Store in session to automatically pre-fill login or show success info
                $_SESSION['reg_success'] = "ลงทะเบียนสมัครเป็นนักกีฬาสำเร็จ! ได้รับรหัสประจำตัวโปรเพลเยอร์เรียบร้อย";
                $_SESSION['last_registered_username'] = $username;
                $_SESSION['last_registered_player_id'] = $player_id;

                header("Location: index.php");
                exit();
            } catch (PDOException $e) {
                $error = "เกิดข้อผิดพลาดในการลงทะเบียน: " . $e->getMessage();
            }
        }
    } else {
        $error = "กรุณากรอกข้อมูลให้ครบทุกช่อง!";
    }
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - สมัครคัดเลือกนักกีฬาอีสปอร์ต</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800;900&family=Prompt:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Prompt', sans-serif;
            background-color: #0d0e12;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(244, 63, 94, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(0, 242, 254, 0.05) 0%, transparent 40%);
        }
        .font-orbitron {
            font-family: 'Orbitron', sans-serif;
        }
        .neon-border-rose {
            box-shadow: 0 0 15px rgba(244, 63, 94, 0.3);
            border: 1px solid rgba(244, 63, 94, 0.5);
        }
        .neon-button-rose {
            background: linear-gradient(135deg, #be123c 0%, #f43f5e 100%);
            box-shadow: 0 0 15px rgba(244, 63, 94, 0.4);
            transition: all 0.3s ease;
        }
        .neon-button-rose:hover {
            box-shadow: 0 0 25px rgba(244, 63, 94, 0.8);
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
                <a href="index.php" class="font-orbitron font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 hover:opacity-80 transition">
                    NEXUS ESPORTS
                </a>
            </div>
            <a href="index.php" class="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center">
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                กลับไปหน้าล็อกอิน
            </a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-md mx-auto px-6 py-12 flex-grow flex items-center justify-center w-full">
        <div class="bg-gray-950/80 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md w-full">
            
            <div class="mb-8 text-center">
                <span class="inline-block bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest font-orbitron mb-3">
                    REGISTRATION PROTOCOL
                </span>
                <h2 class="text-3xl font-black text-white tracking-wide">ลงทะเบียนนักกีฬา</h2>
                <p class="text-xs text-gray-400 mt-2">กรอกข้อมูลให้ถูกต้องเพื่อลงทะเบียนรับรหัส Player ID และเข้าทำการคัดตัว</p>
            </div>

            <!-- Error Notification -->
            <?php if ($error): ?>
                <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center">
                    <svg class="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
            <?php endif; ?>

            <!-- Registration Form -->
            <form action="register.php" method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">ชื่อ - นามสกุล (Full Name)</label>
                    <input type="text" name="fullname" required placeholder="เช่น สมชาย ยอดนักเล่น"
                        class="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition duration-200">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">อีเมลผู้ใช้งาน (Email)</label>
                    <input type="email" name="email" required placeholder="เช่น playerone@nexus.com"
                        class="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition duration-200">
                </div>

                <div class="border-t border-gray-900/60 my-4 pt-4"></div>

                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Username (ชื่อล็อกอิน)</label>
                    <input type="text" name="username" required placeholder="ภาษาอังกฤษหรือตัวเลขอย่างน้อย 4 ตัว"
                        class="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition duration-200">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Password (รหัสผ่าน)</label>
                    <input type="password" name="password" required placeholder="รหัสผ่านเข้าใช้งาน"
                        class="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition duration-200">
                </div>

                <div class="pt-2">
                    <button type="submit" class="w-full py-3.5 rounded-xl font-orbitron font-bold tracking-wider text-white uppercase neon-button-rose cursor-pointer">
                        CREATE ATHLETE PROFILE
                    </button>
                </div>
            </form>

            <div class="mt-6 text-center text-sm text-gray-500">
                <span>มีบัญชีอยู่แล้ว? </span>
                <a href="index.php" class="text-cyan-400 font-bold hover:underline">เข้าสู่ระบบ</a>
            </div>

        </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-900 bg-black/60 py-6 text-center text-xs text-gray-500">
        <p>© 2026 NEXUS ESPORTS CLUB. ALL RIGHTS RESERVED. POWERED BY AR TESTING TECHNOLOGY.</p>
    </footer>

</body>
</html>
