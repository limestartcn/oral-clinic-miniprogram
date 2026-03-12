// auth.js → 修正存储方式
const TokenKey = 'admin-token';

export function getToken() {
  return localStorage.getItem(TokenKey) || ''; // 确保返回字符串
}

export function setToken(token) {
  localStorage.setItem(TokenKey, token); // 仅存储Token值
}

export function removeToken() {
  localStorage.removeItem(TokenKey);
}