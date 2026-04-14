const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const util = require('util');
const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- DB 연결 ---
let connection;
function handleDisconnect() {
    connection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'smartpantry'
    });
    connection.connect((err) => {
        if (err) {
            console.log("DB 연결 실패:", err.message);
            setTimeout(handleDisconnect, 5000); 
        } else { console.log("DB 연결 성공! ✅"); }
    });
}
handleDisconnect();

function isLoggedIn(req, res, next) {
    if (req.session.user) { next(); } 
    else { res.redirect('/login'); }
}

const socialLoginVerify = (snsId, provider, name, done) => {
    const idStr = String(snsId);
    const findSql = 'SELECT * FROM users WHERE id = ? AND provider = ?';
    connection.query(findSql, [idStr, provider], (err, results) => {
        if (err) {
            console.error("❌ DB 조회 에러 상세:", err.sqlMessage || err);
            return done(err);
        }
        if (results && results.length > 0) return done(null, results[0]);
        
        const insertSql = 'INSERT IGNORE INTO users (id, provider, name) VALUES (?, ?, ?)';
        connection.query(insertSql, [idStr, provider, name || '유저'], (err) => {
            if (err) {
                console.error("❌ DB 저장 에러 상세:", err.sqlMessage || err);
                return done(err);
            }
            return done(null, { id: idStr, provider: provider, name: name });
        });
    });
};

// ❗ 카카오 전략 - 하나로 통합 및 절대 경로 사용
passport.use(new KakaoStrategy({
    clientID:    process.env.KAKAO_CLIENT_ID,
    clientSecret:process.env.KAKAO_CLIENT_SECRET,
    callbackURL: '/auth/kakao/callback' 
}, (accessToken, refreshToken, profile, done) => {
    // 닉네임 가져오는 방어 코드
    const name = profile.displayName || (profile._json && profile._json.kakao_account && profile._json.kakao_account.profile && profile._json.kakao_account.profile.nickname) || '유저';
    socialLoginVerify(profile.id, 'kakao', name, done);
}));

passport.use(new GoogleStrategy({
    clientID:    process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    socialLoginVerify(profile.id, 'google', profile.displayName, done);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// --- 라우터 ---
app.get('/', isLoggedIn, (req, res) => {
    const userId = req.session.user;
    const userName = req.session.userName || userId;
    connection.query('SELECT * FROM pantry WHERE user_id = ? ORDER BY expiry_date ASC', [userId], (err, items) => {
        res.render('index', { userId: userName, items: items || [] });
    });
});

app.get('/auth/kakao', passport.authenticate('kakao'));
app.get('/auth/kakao/callback', (req, res, next) => {
    passport.authenticate('kakao', (err, user, info) => {
        if (err) {
            console.error("❌ 카카오 인증 에러:", util.inspect(err, {depth: null}));
            return res.status(500).send(`인증 에러: ${err.message || JSON.stringify(err)}`);
        }
        if (!user) return res.redirect('/login');
        req.session.user = user.id;
        req.session.userName = user.name;
        req.session.save(() => res.redirect('/'));
    })(req, res, next);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    req.session.user = req.user.id;
    req.session.userName = req.user.name;
    res.redirect('/');
});

app.get('/login', (req, res) => res.render('login'));
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send("<script>alert('로그아웃 되었습니다.'); location.href='/login';</script>");
});

app.post('/add-item', isLoggedIn, (req, res) => {
    const { item_name, expiry_date, item_emoji } = req.body;
    connection.query('INSERT INTO pantry (user_id, item_name, item_emoji, expiry_date) VALUES (?, ?, ?, ?)', 
    [req.session.user, item_name, item_emoji || '📦', expiry_date], () => res.redirect('/'));
});

app.get('/delete-item/:id', isLoggedIn, (req, res) => {
    connection.query('DELETE FROM pantry WHERE id = ? AND user_id = ?', [req.params.id, req.session.user], () => res.redirect('/'));
});

app.listen(3000, () => console.log('스마트 팬트리 최종 기동! 🚀'));

// 모든 아이템 삭제 라우터
app.post('/delete-all-items', isLoggedIn, (req, res) => {
    const userId = req.session.user;
    connection.query('DELETE FROM pantry WHERE user_id = ?', [userId], (err) => {
        if (err) {
            console.error("전체 삭제 에러:", err);
            return res.status(500).send("삭제 중 에러가 발생했습니다.");
        }
        res.redirect('/'); // 삭제 후 메인 페이지로 이동
    });
});

// --- 이 코드가 server.js에 있어야 합니다 ---
app.post('/delete-all-items', (req, res) => {
    // 세션 확인 (로그인 안 되어 있으면 튕겨내기)
    if (!req.session || !req.session.user) {
        return res.status(401).send("로그인이 필요합니다.");
    }

    const userId = req.session.user;
    const sql = 'DELETE FROM pantry WHERE user_id = ?';

    connection.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("전체 삭제 중 DB 에러:", err);
            return res.status(500).send("DB 오류 발생");
        }
        console.log(`사용자 ${userId}의 모든 데이터를 삭제했습니다.`);
        res.redirect('/'); // 삭제 성공 시 메인 화면으로 리다이렉트
    });
});