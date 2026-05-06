# 🌐 ngrok Public URL Setup - Access App from Any Phone

## What is ngrok?

ngrok creates a secure public URL that tunnels to your local development server. This allows anyone with the URL to access your app from any device, anywhere in the world.

## Installation

### Step 1: Download ngrok
Visit: https://ngrok.com/download

Choose your operating system and download.

### Step 2: Install ngrok

**Windows:**
- Extract the zip file
- Add ngrok to your PATH or use the full path

**Mac:**
```bash
brew install ngrok
```

**Linux:**
```bash
sudo apt-get install ngrok
# or
brew install ngrok
```

### Step 3: Verify Installation
```bash
ngrok --version
```

## Setup

### Step 1: Create ngrok Account (Optional but Recommended)
1. Go to https://ngrok.com
2. Sign up for free account
3. Get your auth token from dashboard

### Step 2: Authenticate ngrok (Optional)
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## Running ngrok

### Step 1: Start Your Dev Server
```bash
npm run dev
```

Wait for: `ready - started server on 0.0.0.0:3000`

### Step 2: Start ngrok in Another Terminal
```bash
ngrok http 3000
```

### Step 3: Get Your Public URL

You'll see output like:
```
ngrok                                                       (Ctrl+C to quit)

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        us (United States)
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000
Forwarding                    http://abc123def456.ngrok.io -> http://localhost:3000

Web Interface                 http://127.0.0.1:4040
```

**Your public URL is**: `https://abc123def456.ngrok.io`

## Share with Others

### Send to Team Members
```
Share this URL with anyone:
https://abc123def456.ngrok.io

They can open it on any device, anywhere!
```

### Access on Phone
1. Open phone browser
2. Go to: `https://abc123def456.ngrok.io`
3. App loads on phone!

## Advanced Options

### Custom Subdomain (Paid Feature)
```bash
ngrok http 3000 --subdomain=myapp
# URL: https://myapp.ngrok.io
```

### Custom Region
```bash
ngrok http 3000 --region=eu
# Regions: us, eu, au, ap, sa, jp, in
```

### Multiple Ports
```bash
ngrok http 3000 3001 3002
```

### With Custom Domain (Paid)
```bash
ngrok http 3000 --domain=myapp.ngrok.io
```

## Troubleshooting

### "Connection refused"
- Make sure dev server is running on port 3000
- Check: `npm run dev` is active

### "Too many connections"
- Free tier has connection limits
- Upgrade to paid plan for unlimited

### "Invalid auth token"
- Get new token from https://dashboard.ngrok.com
- Run: `ngrok config add-authtoken YOUR_TOKEN`

### "Port already in use"
- Change port: `ngrok http 3001`
- Or kill process using port 3000

## Security Notes

⚠️ **Important:**
- ngrok URLs are public - anyone with the URL can access
- Don't share sensitive URLs publicly
- Use authentication for sensitive data
- URLs expire when ngrok closes
- Free tier has bandwidth limits

## Workflow

### Terminal 1: Dev Server
```bash
npm run dev
# Runs on http://localhost:3000
```

### Terminal 2: ngrok Tunnel
```bash
ngrok http 3000
# Creates public URL
```

### Terminal 3: Optional - Monitor
```bash
# View ngrok dashboard at http://127.0.0.1:4040
```

## Testing on Multiple Devices

### Device 1 (Your Computer)
```
http://localhost:3000
```

### Device 2 (Phone/Tablet)
```
https://abc123def456.ngrok.io
```

### Device 3 (Another Computer)
```
https://abc123def456.ngrok.io
```

## Keeping URL Stable

### Free Plan
- URL changes each time you restart ngrok
- Good for temporary testing

### Paid Plan
- Static URL available
- Recommended for team testing

## Quick Commands

```bash
# Start ngrok
ngrok http 3000

# Start with specific region
ngrok http 3000 --region=eu

# View dashboard
open http://127.0.0.1:4040

# Stop ngrok
Ctrl+C

# Check status
ngrok status
```

## Example Workflow

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000

# Copy URL from ngrok output
# Share: https://abc123def456.ngrok.io

# On phone browser
# Open: https://abc123def456.ngrok.io
# App loads!
```

## Pricing

### Free Plan
- ✅ Public URL
- ✅ 1 simultaneous connection
- ✅ 40 connections/minute
- ✅ 2 hour session limit
- ❌ No custom domain

### Pro Plan ($12/month)
- ✅ 20 simultaneous connections
- ✅ 600 connections/minute
- ✅ Unlimited session time
- ✅ Custom domain
- ✅ Priority support

### Business Plan ($25/month)
- ✅ 100 simultaneous connections
- ✅ 2000 connections/minute
- ✅ Unlimited session time
- ✅ Multiple custom domains
- ✅ Team management

## Alternatives

If ngrok doesn't work:

### Localtunnel
```bash
npm install -g localtunnel
lt --port 3000
```

### Expose
```bash
npm install -g expose
expose 3000
```

### Cloudflare Tunnel
```bash
brew install cloudflare/cloudflare/cf-cli
cf tunnel
```

---

**Status**: ✅ Ready to Use
**Setup Time**: 5 minutes
**Cost**: Free (with limitations)
**Best For**: Team testing, demos, presentations
