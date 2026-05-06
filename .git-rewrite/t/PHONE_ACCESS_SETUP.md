# 📱 Phone Access Setup - Braidly App

## Quick Start

### Step 1: Get Your Local IP Address

Run this command in your terminal:

```bash
node scripts/getLocalIP.js
```

This will output:
- Your local IP address (e.g., `192.168.1.100`)
- The port (default: `3000`)
- Full URL to access on phone

### Step 2: Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Step 3: Access on Your Phone

1. Make sure your phone is on the **same WiFi network** as your computer
2. Open your phone's browser
3. Enter the URL from Step 1 (e.g., `http://192.168.1.100:3000`)
4. You should see the Braidly app

## Requirements

- ✅ Phone and computer on same WiFi network
- ✅ Development server running (`npm run dev`)
- ✅ Firewall allows port 3000
- ✅ No VPN on phone (or VPN on both devices)

## Troubleshooting

### "Cannot reach the server"
- Check both devices are on same WiFi
- Verify firewall isn't blocking port 3000
- Try pinging the IP: `ping 192.168.1.100`
- Restart the dev server

### "Page loads but features don't work"
- Check browser console for errors (F12)
- Verify environment variables are set
- Check network tab for failed API calls
- Ensure Supabase is accessible

### "Location features not working"
- Phone must have location permission enabled
- HTTPS is required for location on some phones
- Use ngrok for HTTPS (see below)

## Advanced Setup: HTTPS with ngrok

For testing location features on phone, you may need HTTPS:

1. Install ngrok: https://ngrok.com/download
2. Start dev server: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL from ngrok output
5. Access on phone using the ngrok URL

Example:
```
ngrok http 3000
# Output: https://abc123.ngrok.io
# Use this URL on your phone
```

## Testing Checklist

- [ ] App loads on phone
- [ ] Navigation works
- [ ] Can log in
- [ ] Can view braiders
- [ ] Can make a booking
- [ ] Can send messages
- [ ] Location sharing works (if applicable)
- [ ] Images load correctly
- [ ] Responsive design looks good

## Network Diagram

```
┌─────────────────────────────────────────┐
│         Your WiFi Network               │
├─────────────────────────────────────────┤
│                                         │
│  Computer              Phone            │
│  ┌──────────────┐    ┌──────────────┐  │
│  │ Dev Server   │    │ Browser      │  │
│  │ :3000        │◄──►│ :3000        │  │
│  │ 192.168.1.100│    │ (same IP)    │  │
│  └──────────────┘    └──────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Environment Variables

Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key
```

## Performance Tips

1. **Reduce animations** on phone for better performance
2. **Close other apps** to free up memory
3. **Use 4G/5G** if WiFi is slow
4. **Clear browser cache** if seeing old content
5. **Use Chrome DevTools** for debugging

## Security Notes

⚠️ **Important**: This setup is for local development only!

- Don't expose your local IP to the internet
- Don't use this for production
- Use ngrok or proper hosting for production
- Keep your API keys secure

## Getting Help

If you encounter issues:

1. Check the browser console (F12 → Console tab)
2. Check the terminal where `npm run dev` is running
3. Verify network connectivity
4. Try a different phone or browser
5. Restart both dev server and phone browser

---

**Last Updated**: March 2026
**Braidly Version**: 1.0.0
