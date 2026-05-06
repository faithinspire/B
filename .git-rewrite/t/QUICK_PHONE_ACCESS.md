# 🚀 Quick Phone Access - 3 Steps

## Step 1: Get URL (30 seconds)
```bash
node scripts/getLocalIP.js
```

Copy the URL shown (e.g., `http://192.168.1.100:3000`)

## Step 2: Start Server (10 seconds)
```bash
npm run dev
```

Wait for "ready - started server on 0.0.0.0:3000"

## Step 3: Open on Phone (5 seconds)
1. Open phone browser
2. Paste the URL
3. Done! 🎉

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't reach server | Check WiFi connection, restart dev server |
| Page loads but blank | Check browser console (F12), refresh page |
| Location not working | Enable location permission, use HTTPS (ngrok) |
| Images not loading | Check `/public/images/braiding-styles/` exists |

## HTTPS for Location (Optional)
```bash
# Install ngrok first
ngrok http 3000
# Use the HTTPS URL on phone
```

---

**That's it!** Your app is now accessible on your phone. 📱
