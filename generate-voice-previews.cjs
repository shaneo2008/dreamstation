// One-time script to generate voice preview MP3s for all 29 Cartesia voices
// Run: node generate-voice-previews.js
// Then upload the output files to S3: fancast-tts-previews/Cartesia Previews/

const fs = require('fs');
const path = require('path');
const https = require('https');

const CARTESIA_API_KEY = 'sk_car_KqVMgE3b3vEDWFaTkuZVdk';
const SAMPLE_TEXT = 'Once upon a time, in a land far away, a young hero set off on an adventure. Would they find what they were looking for?';
const OUTPUT_DIR = path.join(__dirname, 'voice-previews');

const VOICES = [
  { id: 'c961b81c-a935-4c17-bfb3-ba2239de8c2f', name: 'Kyle' },
  { id: '0ad65e7f-006c-47cf-bd31-52279d487913', name: 'Rupert' },
  { id: '26403c37-80c1-4a1a-8692-540551ca2ae5', name: 'Marian' },
  { id: '79f8b5fb-2cc8-479a-80df-29f7a7cf1a3e', name: 'Theo' },
  { id: '8985388c-1332-4ce7-8d55-789628aa3df4', name: 'Robyn' },
  { id: '1463a4e1-56a1-4b41-b257-728d56e93605', name: 'Hugo' },
  { id: '86e30c1d-714b-4074-a1f2-1cb6b552fb49', name: 'Carson' },
  { id: '87286a8d-7ea7-4235-a41a-dd9fa6630feb', name: 'Henry' },
  { id: 'a167e0f3-df7e-4d52-a9c3-f949145efdab', name: 'Blake' },
  { id: 'ee7ea9f8-c0c1-498c-9279-764d6b56d189', name: 'Oliver' },
  { id: '6cb8801d-259a-4bdc-978f-b45808d58cd3', name: 'Jeremy' },
  { id: '729651dc-c6c3-4ee5-97fa-350da1f88600', name: 'Jake' },
  { id: 'e00d0e4c-a5c8-443f-a8a3-473eb9a62355', name: 'Zeke' },
  { id: '6ccbfb76-1fc6-48f7-b71d-91ac6298247b', name: 'Tessa' },
  { id: '57dcab65-68ac-45a6-8480-6c4c52ec1cd1', name: 'Kira' },
  { id: '71a7ad14-091c-4e8e-a314-022ece01c121', name: 'Charlotte' },
  { id: 'f31cc6a7-c1e8-4764-980c-60a361443dd1', name: 'Olivia' },
  { id: 'a5def41e-2e73-433f-92f7-5f1d99fef05d', name: 'Madison' },
  { id: 'f786b574-daa5-4673-aa0c-cbe3e8534c02', name: 'Katie' },
  { id: 'cccc21e8-5bcf-4ff0-bc7f-be4e40afc544', name: 'Avery' },
  { id: '32b3f3c5-7171-46aa-abe7-b598964aa793', name: 'Daisy' },
  { id: 'e3827ec5-697a-4b7c-9704-1a23041bbc51', name: 'Dottie' },
  { id: '56b87df1-594d-4135-992c-1112bb504c59', name: 'Lexi' },
  { id: '79743797-2087-422f-8dc7-86f9efca85f1', name: 'Fran' },
  { id: '34575e71-908f-4ab6-ab54-b08c95d6597d', name: 'Joey' },
  { id: 'e13cae5c-ec59-4f71-b0a6-266df3c9bb8e', name: 'Lulu' },
  { id: 'bfd3644b-d561-4b1c-a01f-d9af98cb67c0', name: 'Matt' },
  { id: 'd7862948-75c3-4c7c-ae28-2959fe166f49', name: 'Caspian' },
];

async function generateVoice(voice) {
  const payload = JSON.stringify({
    model_id: 'sonic-2',
    transcript: SAMPLE_TEXT,
    voice: {
      mode: 'id',
      id: voice.id,
    },
    output_format: {
      container: 'mp3',
      encoding: 'mp3',
      sample_rate: 44100,
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cartesia.ai',
      path: '/tts/bytes',
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': CARTESIA_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', (chunk) => errBody += chunk);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${errBody}`)));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const outputPath = path.join(OUTPUT_DIR, `${voice.name}.mp3`);
        fs.writeFileSync(outputPath, buffer);
        resolve(outputPath);
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Generating ${VOICES.length} voice previews...\n`);

  for (const voice of VOICES) {
    process.stdout.write(`  ${voice.name.padEnd(12)}`);
    try {
      const outPath = await generateVoice(voice);
      const size = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`✅  ${size} KB`);
    } catch (err) {
      console.log(`❌  ${err.message}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! Files saved to: ${OUTPUT_DIR}`);
  console.log('\nUpload all files to S3:');
  console.log('  Bucket: fancast-tts-previews');
  console.log('  Folder: Cartesia Previews/');
}

main();
