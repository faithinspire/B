#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

function main() {
  const localIP = getLocalIP();
  const port = process.env.PORT || 3000;
  const url = `http://${localIP}:${port}`;
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           📱 PHONE ACCESS SETUP - BRAIDLY APP              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('✅ Local IP Address:', localIP);
  console.log('✅ Port:', port);
  console.log('✅ Full URL:', url);
  
  console.log('\n📋 Instructions:');
  console.log('1. Make sure your phone is on the same WiFi network');
  console.log('2. Open your phone browser and go to:', url);
  console.log('3. You should see the Braidly app');
  
  console.log('\n⚠️  Important:');
  console.log('- Both devices must be on the same network');
  console.log('- If using a VPN, disable it on your phone');
  console.log('- Make sure your firewall allows port', port);
  
  console.log('\n💡 Tips:');
  console.log('- For HTTPS on phone, use ngrok: ngrok http 3000');
  console.log('- For testing location features, use Chrome DevTools');
  console.log('- Check browser console for any errors\n');
  
  // Write to file for reference
  const setupFile = path.join(process.cwd(), 'PHONE_ACCESS_URL.txt');
  fs.writeFileSync(setupFile, `Braidly Phone Access\n\nURL: ${url}\nIP: ${localIP}\nPort: ${port}\n\nGenerated: ${new Date().toISOString()}`);
  console.log('📄 URL saved to: PHONE_ACCESS_URL.txt\n');
}

main();
