# 🚀 Emojora Clipper API (Free Microservice)

This is a free Node.js microservice that extracts and trims YouTube MP4 clips for `emojora.com`.

---

## ⚡ Deployment to Render.com (100% Free)

### Step 1: Create a GitHub Repository
1. Upload the files inside this `emojora-clipper-api` folder (`server.js`, `package.json`) to a new repository on your GitHub account (e.g. name it `emojora-clipper-api`).

### Step 2: Deploy on Render
1. Go to [https://render.com](https://render.com) and Sign In (Free).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `emojora-clipper-api`.
4. Choose **Free Plan**.
5. Set:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Click **Create Web Service**.

### Step 3: Connect to `emojora.com`
1. Once deployed, Render will give you a URL like: `https://emojora-clipper.onrender.com`
2. Open your `index.php` file on `emojora.com`.
3. Set line 614:
   ```javascript
   let MICROSERVICE_API_URL = "https://emojora-clipper.onrender.com";
   ```
4. Save & Upload `index.php`.

Done! Now when users click **"Download Clip"**, the microservice will process and stream the exact trimmed `.mp4` clip directly to the browser on `emojora.com` without any popups, external websites, or errors!
