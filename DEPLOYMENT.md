# C Compiler Studio — Production Deployment Guide

This guide provides step-by-step instructions for deploying the C Compiler Web Application to production environments.

---

## 1. Architecture Overview for Deployment

The web application consists of three integrated layers:
1. **Existing C Compiler**: Native executable (`ccompiler`) generated with Flex, Bison, and C99/GCC.
2. **Backend API Service**: Node.js & Express service in TypeScript providing safe process spawning, rate-limiting, and phase output parsing.
3. **Frontend Web Portal**: React 18 SPA built with Vite, TypeScript, Tailwind CSS, and Monaco Editor.

Because the backend executes a native binary (`ccompiler`) and optionally compiles with a host C backend (`gcc`/`clang`), **the backend must be deployed in an environment with a Linux C toolchain or inside a Docker container.** Static hosts (like plain Vercel or GitHub Pages) cannot execute native C binaries alone.

---

## 2. Deployment Option A: Unified Container (Recommended)

This is the simplest and most robust production deployment. A single container hosts the C compiler binary, the Express backend, and serves the static production frontend.

### Supported Platforms:
- **Render** (Web Service, Docker runtime)
- **Railway**
- **Fly.io**
- **DigitalOcean App Platform** (Docker runtime)
- **AWS App Runner / ECS**

### Step-by-Step Instructions (e.g. Render):

1. **Push your repository to GitHub / GitLab**.
2. **Log into Render** (https://render.com) and click **New +** -> **Web Service**.
3. **Connect your repository**.
4. Choose **Docker** as the Environment / Runtime. Render will automatically detect the root [`Dockerfile`](Dockerfile).
5. Configure Environment Variables:
   - `PORT`: `5001` (or let Render set it dynamically)
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `*`
6. Click **Create Web Service**.
7. Render runs the multi-stage Docker build:
   - Builds `ccompiler` with GCC, Flex, and Bison.
   - Builds frontend with Vite (`frontend/dist`).
   - Builds backend with TypeScript (`backend/dist`).
   - Starts `node dist/server.js` as an unprivileged user on port 5001.
8. Once deployed, navigate to your public Render URL (`https://your-service.onrender.com`). You will see the full frontend running and communicating with the real compiler!

---

## 3. Deployment Option B: Decoupled (Vercel Frontend + Render Backend)

If you prefer hosting the frontend on Vercel's global CDN:

### Part 1: Deploy Backend Container on Render / Fly.io
1. Deploy the backend using the Dockerfile as outlined in Option A.
2. Note your public backend URL, e.g. `https://compiler-api.onrender.com`.

### Part 2: Deploy Frontend on Vercel
1. Log into **Vercel** (https://vercel.com) and click **Add New** -> **Project**.
2. Import your repository.
3. Configure the Project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://compiler-api.onrender.com`
5. Click **Deploy**.
6. On your backend host (Render), set `CORS_ORIGIN` to your Vercel domain (`https://your-app.vercel.app`) to secure API requests.

---

## 4. Local Production Run

To build and run the full production application locally:

### 1. Build the Entire Stack
```bash
# In the repository root:
npm run build
```
This automatically compiles:
- The native compiler: `make` -> `ccompiler`
- The backend: `cd backend && npm run build` -> `backend/dist`
- The frontend: `cd frontend && npm run build` -> `frontend/dist`

### 2. Start the Production Server
```bash
npm start
```
The server will start on `http://localhost:5001`.
Open your browser to `http://localhost:5001`. Express automatically serves the production frontend bundle and handles `/api` compilation requests.

---

## 5. Production Smoke Tests

After deploying, verify that your service is healthy using these smoke tests:

### Test 1: Health Check
```bash
curl -i https://your-service.onrender.com/api/health
```
**Expected Response**: `HTTP 200 OK`
```json
{
  "status": "healthy",
  "service": "c-compiler-backend",
  "compilerBinaryReady": true
}
```

### Test 2: Compiler Capabilities
```bash
curl -i https://your-service.onrender.com/api/compiler/info
```
**Expected Response**: `HTTP 200 OK` with 6 supported phases and grammar features.

### Test 3: Compilation Execution
```bash
curl -X POST https://your-service.onrender.com/api/compile \
  -H "Content-Type: application/json" \
  -d '{"sourceCode": "int main() { int x = 5; return 0; }"}'
```
**Expected Response**: `HTTP 200 OK` with `success: true`, extracted tokens, parse tree, symbol table, and Three-Address Code.

### Test 4: Rate Limiting & Error Protection
```bash
curl -X POST https://your-service.onrender.com/api/compile \
  -H "Content-Type: application/json" \
  -d '{"sourceCode": ""}'
```
**Expected Response**: `HTTP 400 Bad Request` with message: `"Source code cannot be empty"`.
