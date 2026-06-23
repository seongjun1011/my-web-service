CREATE DATABASE IF NOT EXISTS smartpantry;
USE smartpantry;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255),
    name          VARCHAR(100),
    nickname      VARCHAR(100),
    profile_image VARCHAR(500),
    is_agreed     TINYINT(1) DEFAULT 0,
    is_admin      TINYINT(1) DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_accounts (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    provider         ENUM('kakao','google','naver') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_provider (provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ingredients (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL UNIQUE,
    category            VARCHAR(100),
    emoji               VARCHAR(10) DEFAULT '📦',
    storage_type        ENUM('room','cold','frozen') DEFAULT 'cold',
    default_expiry_days INT
);

CREATE TABLE IF NOT EXISTS pantry (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    ingredient_id BIGINT,
    item_name     VARCHAR(100) NOT NULL,
    item_emoji    VARCHAR(10) DEFAULT '📦',
    expiry_date   DATE,
    category      VARCHAR(20) DEFAULT '냉장',
    quantity      DECIMAL(10,2) DEFAULT 1.00,
    unit          VARCHAR(50),
    status        ENUM('available','used','expired','deleted') DEFAULT 'available',
    source        ENUM('manual','receipt','camera') DEFAULT 'manual',
    FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- 요리 완료 시 사용 처리되어 pantry에서 삭제된 식재료 기록 (낭비 통계용)
CREATE TABLE IF NOT EXISTS used_ingredient_logs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    item_name   VARCHAR(100) NOT NULL,
    item_emoji  VARCHAR(10) DEFAULT '📦',
    category    VARCHAR(20),
    quantity    DECIMAL(10,2),
    unit        VARCHAR(20) DEFAULT '개',
    expiry_date DATE,
    used_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipes (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    cooking_time INT,
    difficulty   ENUM('easy','normal','hard') DEFAULT 'easy',
    image_url    VARCHAR(500),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id     BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    amount        DECIMAL(10,2),
    unit          VARCHAR(50),
    is_required   TINYINT(1) DEFAULT 1,
    FOREIGN KEY (recipe_id)     REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    recipe_id           BIGINT,
    recommendation_type ENUM('db_match','llm_generated') NOT NULL,
    input_ingredients   TEXT,
    match_score         DECIMAL(5,2),
    llm_response        JSON,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE IF NOT EXISTS notices (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    message    TEXT NOT NULL,
    is_active  TINYINT(1) DEFAULT 1,
    push_sent  TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    endpoint      TEXT NOT NULL,
    p256dh        TEXT NOT NULL,
    auth          TEXT NOT NULL,
    endpoint_hash VARCHAR(64) GENERATED ALWAYS AS (SHA2(endpoint, 256)) STORED UNIQUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_recipes (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    recipe_name VARCHAR(200) NOT NULL,
    recipe_json JSON NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 영수증/식재료 촬영 스캔 로그 (이미지 포함) — 기존에 코드에서만 쓰이고 스키마에 빠져 있던 테이블 보강
CREATE TABLE IF NOT EXISTS scan_logs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    mode        ENUM('food','receipt') DEFAULT 'food',
    source      VARCHAR(50),
    image_data  MEDIUMTEXT,
    item_count  INT DEFAULT 0,
    items_json  JSON,
    status      ENUM('success','failed') DEFAULT 'success',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 항목별 동의 현황 (필수: terms, age14, privacy, pantry_data / 선택: camera, push, marketing)
CREATE TABLE IF NOT EXISTS user_consents (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    consent_type    ENUM('terms','age14','privacy','pantry_data','camera','push','marketing') NOT NULL,
    agreed          TINYINT(1) NOT NULL DEFAULT 0,
    consent_version VARCHAR(30) NOT NULL,
    agreed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_consent (user_id, consent_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 동의 변경/철회 이력 (분쟁 대비 보존용, UPDATE 없이 누적 INSERT)
CREATE TABLE IF NOT EXISTS user_consent_history (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    consent_type    ENUM('terms','age14','privacy','pantry_data','camera','push','marketing') NOT NULL,
    previous_value  TINYINT(1),
    new_value       TINYINT(1) NOT NULL,
    consent_version VARCHAR(30) NOT NULL,
    changed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 기존에 is_agreed=1로 가입된 회원은 필수 항목을 동의 완료로 간주하고 마이그레이션
-- (선택 항목 camera/push/marketing은 행을 만들지 않아 미동의 상태로 시작됨)
INSERT IGNORE INTO user_consents (user_id, consent_type, agreed, consent_version, agreed_at)
SELECT id, t.consent_type, 1, t.ver, COALESCE(created_at, NOW())
FROM users
CROSS JOIN (
    SELECT 'terms' AS consent_type, 'terms_v1' AS ver UNION ALL
    SELECT 'age14', 'age14_v1' UNION ALL
    SELECT 'privacy', 'privacy_v1' UNION ALL
    SELECT 'pantry_data', 'pantry_v1'
) t
WHERE is_agreed = 1;
