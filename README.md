# SimpleSplit (Vue + Vercel)

不囉嗦的分帳網頁，專攻「一人先付，大家平分」的情境。使用 Vue 3（CDN 版）打造，方便直接靜態部署到 Vercel 並公開在 GitHub。

## 功能與 Feature Toggles
- Quick Add (Toggle ON/OFF)：ON 時顯示預設標籤（如「🍱 午餐 $100」）；OFF 時只能手動輸入品項與金額。假設：記帳時間由 10s 縮短至 3s。
- One-Click Split (Toggle ON/OFF)：ON 時出現「AA制」核取方塊，勾選自動除以人數；OFF 時使用者需自行輸入每人金額。假設：錯誤率降至 0%。
- 分帳結果：顯示每筆「朋友共付金額」、AA 使用率等摘要。

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

## 部署到 Vercel
1) 將此專案推上 GitHub 公開倉庫。  
2) 在 Vercel 建立新專案，選擇該倉庫。  
3) Build Command：`npm run build` 不需要，選擇「Other」並留空；Output Directory 可填根目錄或 `./`。  
4) 完成後即可取得公開網址（純前端無伺服器端）。  
5) 若未來加入後端或 API Key，請在 Vercel 的 Project Settings → Environment Variables 設定。

## Security Design (最簡版)
- A&A (身份驗證)：預期使用 JWT，確保「誰欠誰」。前端可攜帶 JWT 呼叫後端 API；需設定過期時間與簽名檢查。
- SCA (軟體成分分析)：前端若採用 npm 打包，開發流程加上 `npm audit`；GitHub 倉庫開啟 Dependabot alerts，以確保金額計算套件（如 `decimal.js`）無已知漏洞。
- Secret Management (密鑰管理)：資料庫或第三方服務的 API Key 放在 `.env`，不入版控；部署到 Vercel 時透過 GitHub Secrets 或 Vercel 環境變數注入。

## 待辦/延伸
- 加入簡單的 JWT 驗證流程示例（前端 token 注入）。  
- 引入型別檢查（TypeScript）與單元測試（Vitest）驗證計算邏輯。  
- 設計基本 E2E（Playwright）以驗證 Feature Toggle 流程。
