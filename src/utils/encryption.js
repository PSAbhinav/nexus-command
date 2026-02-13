import CryptoJS from 'crypto-js';

const SALT_KEY = 'nexus_cmd_salt_v1';
const AUTH_KEY = 'nexus_cmd_auth';
const VERIFY_KEY = 'nexus_cmd_verify';
const VERIFY_PHRASE = 'NEXUSCOMMAND_VERIFIED';

function deriveKey(password, salt) {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000,
        hasher: CryptoJS.algo.SHA256
    }).toString();
}

export function setupAccount(email, password) {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = deriveKey(password, salt);
    const hashedPassword = CryptoJS.SHA256(password + salt).toString();
    const verifyToken = CryptoJS.AES.encrypt(VERIFY_PHRASE, key).toString();

    const authData = {
        email,
        hashedPassword,
        salt,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem(SALT_KEY, salt);
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    localStorage.setItem(VERIFY_KEY, verifyToken);

    return key;
}

export function verifyPassword(password) {
    const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (!authData) return null;

    const { salt, hashedPassword } = authData;
    const testHash = CryptoJS.SHA256(password + salt).toString();

    if (testHash !== hashedPassword) return null;

    const key = deriveKey(password, salt);

    try {
        const verifyToken = localStorage.getItem(VERIFY_KEY);
        const decrypted = CryptoJS.AES.decrypt(verifyToken, key).toString(CryptoJS.enc.Utf8);
        if (decrypted !== VERIFY_PHRASE) return null;
    } catch {
        return null;
    }

    return key;
}

export function hasAccount() {
    return localStorage.getItem(AUTH_KEY) !== null;
}

export function getAccountEmail() {
    const authData = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    return authData.email || '';
}

export function encrypt(data, key) {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, key).toString();
}

export function decrypt(ciphertext, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) return null;
        return JSON.parse(decryptedStr);
    } catch {
        return null;
    }
}

export function changePassword(oldPassword, newPassword) {
    const oldKey = verifyPassword(oldPassword);
    if (!oldKey) return false;

    const allData = getAllEncryptedData(oldKey);
    const authData = JSON.parse(localStorage.getItem(AUTH_KEY));

    const newSalt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const newKey = deriveKey(newPassword, newSalt);
    const newHashedPassword = CryptoJS.SHA256(newPassword + newSalt).toString();
    const newVerifyToken = CryptoJS.AES.encrypt(VERIFY_PHRASE, newKey).toString();

    authData.hashedPassword = newHashedPassword;
    authData.salt = newSalt;

    localStorage.setItem(SALT_KEY, newSalt);
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    localStorage.setItem(VERIFY_KEY, newVerifyToken);

    reEncryptAllData(allData, newKey);
    return newKey;
}

function getAllEncryptedData(key) {
    const dataKeys = ['nexus_finance', 'nexus_tasks', 'nexus_health', 'nexus_goals', 'nexus_settings'];
    const data = {};
    dataKeys.forEach(dk => {
        const encrypted = localStorage.getItem(dk);
        if (encrypted) {
            data[dk] = decrypt(encrypted, key);
        }
    });
    return data;
}

function reEncryptAllData(data, newKey) {
    Object.entries(data).forEach(([dk, value]) => {
        if (value !== null) {
            localStorage.setItem(dk, encrypt(value, newKey));
        }
    });
}

export function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 'weak', color: '#ff1744', width: '25%' };
    if (score <= 3) return { level: 'fair', color: '#ff9100', width: '50%' };
    if (score <= 4) return { level: 'good', color: '#ffea00', width: '75%' };
    return { level: 'strong', color: '#00e676', width: '100%' };
}

export function deleteAccount() {
    localStorage.clear();
}
