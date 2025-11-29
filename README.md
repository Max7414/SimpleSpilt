# SimpleSplit (Vue + Vercel)

不囉嗦的分帳網頁，專攻「一人先付，大家平分」的情境。使用 Vue 3（CDN 版）打造，方便直接靜態部署到 Vercel 並公開在 GitHub。

## 功能與 Feature Toggles
- Quick Add (Toggle ON/OFF)：ON 時顯示預設標籤（如「🍱 午餐 $100」）；OFF 時只能手動輸入品項與金額。假設：記帳時間由 10s 縮短至 3s。
- One-Click Split (Toggle ON/OFF)：ON 時出現「AA制」核取方塊，勾選自動除以人數；OFF 時使用者需自行輸入每人金額。假設：錯誤率降至 0%。
- 分帳結果：顯示每筆「朋友共付金額」、AA 使用率等摘要。
- JWT 登入/註冊：輸入 email / 密碼後呼叫 `/api/login` 或 `/api/register` 取得簽章 JWT，登入後才能新增與查看分帳紀錄；登出會清空快取紀錄。
- Serverless：`/api/login`、`/api/register`、`/api/entries` 使用 Supabase (REST) + `SUPABASE_SERVICE_KEY` 儲存 profiles/entries，JWT 以 `JWT_SECRET` 簽章。

## 專案架構
- `index.html`：載入 Vue、佈局與元件掛載點。
- `styles.css`：簡潔深色主題與互動樣式。
- `script.js`：Vue 狀態與邏輯；含 Quick Add、AA 制、摘要計算。

## 開發與啟動
1) 直接開啟 `index.html`（靜態即可運作）。  
2) 若需本地伺服器，可使用任意靜態伺服器，例如：
```bash
python3 -m http.server 5173
# 然後瀏覽 http://localhost:5173
```
3) 登入/註冊：於首頁「Account · JWT」區塊輸入 email 與密碼，點擊登入或註冊後即可使用分帳功能並查看紀錄（登入後自動載入歷程）。
4) 環境變數（Vercel 或 `.env.local`）：`JWT_SECRET`、`SUPABASE_URL`、`SUPABASE_SERVICE_KEY`。  
5) 要求資料表（Supabase SQL）：  
```sql
create extension if not exists "uuid-ossp";
create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null
);
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  item text,
  total numeric,
  participants int,
  per_person numeric,
  aa bool,
  friend_owes numeric,
  created_at timestamptz default now()
);
```

## 部署到 Vercel
1) 將此專案推上 GitHub 公開倉庫。  
2) 在 Vercel 建立新專案，選擇該倉庫。  
3) Build Command 留空（靜態）；Output Directory 用根目錄。  
4) 在 Project Settings → Environment Variables：`JWT_SECRET=<隨機字串>`、`SUPABASE_URL=<你的 supabase url>`、`SUPABASE_SERVICE_KEY=<service_role key>`。  
5) 部署後登入/註冊會取得簽章 JWT，分帳紀錄讀寫走 `/api/entries`（Supabase）。

## Security Design (最簡版)
- A&A (身份驗證)：使用 JWT，確保「誰欠誰」。正式簽章由 `/api/login` 透過 `JWT_SECRET` 產生，需在後端驗證簽章、過期時間與撤銷清單。
- SCA (軟體成分分析)：前端若採用 npm 打包，開發流程加上 `npm audit`；GitHub 倉庫開啟 Dependabot alerts，以確保金額計算套件（如 `decimal.js`）無已知漏洞。
- Secret Management (密鑰管理)：資料庫或第三方服務的 API Key 放在 `.env`，不入版控；部署到 Vercel 時透過 GitHub Secrets 或 Vercel 環境變數注入。

## 待辦/延伸
- 加入簡單的 JWT 驗證流程示例（前端 token 注入）。  
- 引入型別檢查（TypeScript）與單元測試（Vitest）驗證計算邏輯。  
- 設計基本 E2E（Playwright）以驗證 Feature Toggle 流程。
