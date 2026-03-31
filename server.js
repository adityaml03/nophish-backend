const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { RandomForestClassifier } = require('ml-random-forest');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🧠 LOAD THE PRE-TRAINED MODEL
// ==========================================
console.log("⏳ Loading Pre-trained AI Model from disk...");
let rf;
try {
  const modelData = JSON.parse(fs.readFileSync('pretrained_model.json', 'utf8'));
  rf = RandomForestClassifier.load(modelData);
  console.log("✅ Pre-trained Model Loaded Successfully!");
} catch (err) {
  console.error("❌ ERROR: Could not find 'pretrained_model.json'. Did you run 'node train.js' first?");
  process.exit(1);
}

// Must be exactly the same as the training script
function extractFeatures(url) {
  const lowerUrl = url.toLowerCase();
  const length = url.length;
  // Fixed the Regex syntax errors here!
  const numDots = (url.match(/\./g) || []).length;
  const numHyphens = (url.match(/-/g) || []).length;
  const numSlashes = (url.match(/\//g) || []).length;
  const hasIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(url) ? 1 : 0;
  const isHttps = url.startsWith('https') ? 1 : 0;
  
  const badWords = const badWords = ['login', 'verify', 'update', 'secure', 'account', 'auth', 'billing', 'refund', 'download', 'free', 'torrent', 'stream', 'movie', 'watch', 'apk', 'crack'];
  const hasBadWord = badWords.some(word => lowerUrl.includes(word)) ? 1 : 0;

  return [length, numDots, numHyphens, numSlashes, hasIp, isHttps, hasBadWord];
}

// Add a simple homepage to test if the server is awake!
app.get('/', (req, res) => {
  res.send("NoPhish AI Server is Awake and Running!");
});

app.post('/analyze', (req, res) => {
  const { websiteUrl } = req.body;
  if (!websiteUrl) return res.status(400).json({ error: "No URL provided" });
  
  console.log(`\n🔍 Analyzing: ${websiteUrl}`);

  const features = extractFeatures(websiteUrl);
  const prediction = rf.predict([features])[0]; 

  const phishingScore = prediction === 1 ? 0.85 : 0.05;
  console.log(`🤖 Pre-trained AI Prediction: ${prediction === 1 ? 'PHISHING' : 'SAFE'}`);

  res.json({ phishingScore: phishingScore });
});

// USE DYNAMIC PORT FOR RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`📍 Listening on port ${PORT}`);
});
