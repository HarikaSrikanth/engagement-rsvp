const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Create canvas (16:9 aspect ratio)
const width = 1200;
const height = 630;
const canvas = Canvas.createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background gradient
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Title
ctx.font = 'bold 60px Arial';
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.fillText('💍 Engagement Invitation 💍', width / 2, 150);

// Subtitle
ctx.font = '36px Arial';
ctx.fillStyle = '#ffffff';
ctx.fillText('Srikanth & Harika', width / 2, 230);

// Event details
ctx.font = '24px Arial';
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.fillText('📅 July 3, 2026 • 10:00 AM', width / 2, 320);
ctx.fillText('📍 The Farm At Coddle Creek, Mooresville, NC', width / 2, 370);

// Link at bottom with background
const linkText = 'https://HarikaSrikanth.github.io/engagement-rsvp';
ctx.font = 'bold 20px Arial';
ctx.fillStyle = '#000000';
ctx.globalAlpha = 0.2;
ctx.fillRect(0, height - 80, width, 80);
ctx.globalAlpha = 1;
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.fillText(linkText, width / 2, height - 30);

// Save image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'preview.png'), buffer);
console.log('Preview image created: preview.png');
