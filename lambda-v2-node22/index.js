// ⚠️ THIS IS FOR NEW LAMBDA (Node 22) ONLY
// DO NOT MODIFY PRODUCTION LAMBDA (Node 18)
// Version: 2.0 - Volume normalization + Line spacing + Speed reduction

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1' });

// Max concurrent ffmpeg processes for normalization
const NORMALIZATION_BATCH_SIZE = 10;

exports.handler = async (event) => {
    const startTime = Date.now();
    console.log('🎵 Lambda Audio Concatenation Started (v2 - Node 22)');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Lambda Function URLs wrap HTTP body in event.body as a string
        const payload = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : event;

        // Extract parameters from the payload
        const {
            bucketName,
            audioFiles,
            outputKey,
            productionId,
            userId,
            pauseAfterValues // NEW: For line spacing
        } = payload;

        if (!bucketName || !audioFiles || !outputKey) {
            throw new Error('Missing required parameters: bucketName, audioFiles, or outputKey');
        }

        console.log(`📥 Processing ${audioFiles.length} audio files for concatenation`);
        console.log(`📦 Bucket: ${bucketName}`);
        console.log(`🎯 Output key: ${outputKey}`);

        // Create temporary directory
        const tempDir = '/tmp/audio-concat';
        // Clean any leftover files from previous warm invocations
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempDir, { recursive: true });

        // Download all audio files from S3
        const localFiles = [];
        for (let i = 0; i < audioFiles.length; i++) {
            const audioFile = audioFiles[i];
            const localPath = path.join(tempDir, `audio_${i.toString().padStart(3, '0')}.wav`);

            console.log(`⬇️ Downloading ${audioFile.s3Key || audioFile.key} to ${localPath}`);

            const params = {
                Bucket: bucketName,
                Key: audioFile.s3Key || audioFile.key
            };

            const command = new GetObjectCommand(params);
            const data = await s3.send(command);
            const chunks = [];
            for await (const chunk of data.Body) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(localPath, buffer);

            localFiles.push({
                path: localPath,
                speaker: audioFile.speaker,
                lineIndex: audioFile.lineIndex,
                pauseAfter: audioFile.pauseAfter // Also accept per-file pause values
            });
        }

        console.log(`✅ Downloaded ${localFiles.length} files successfully`);

        // ========================================
        // FIX 2: VOLUME NORMALIZATION (BATCHED)
        // ========================================
        console.log('🔊 Starting volume normalization...');
        const normalizedFiles = [];

        // Process in batches to avoid overwhelming Lambda CPU
        for (let batchStart = 0; batchStart < localFiles.length; batchStart += NORMALIZATION_BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + NORMALIZATION_BATCH_SIZE, localFiles.length);
            const batch = localFiles.slice(batchStart, batchEnd);

            console.log(`  Normalizing batch ${Math.floor(batchStart / NORMALIZATION_BATCH_SIZE) + 1}: files ${batchStart + 1}-${batchEnd} of ${localFiles.length}`);

            const batchPromises = batch.map((file, batchIndex) => {
                const i = batchStart + batchIndex;
                const normalizedPath = path.join(tempDir, `normalized_${i.toString().padStart(3, '0')}.wav`);

                return runFFmpeg([
                    '-i', file.path,
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                    '-ar', '44100',
                    '-ac', '2',
                    '-y',
                    normalizedPath
                ]).then(() => ({
                    path: normalizedPath,
                    speaker: file.speaker,
                    lineIndex: file.lineIndex,
                    pauseAfter: file.pauseAfter
                }));
            });

            const batchResults = await Promise.all(batchPromises);
            normalizedFiles.push(...batchResults);
        }

        console.log(`✅ Volume normalization completed for ${normalizedFiles.length} files`);

        // ========================================
        // FIX 3: LINE SPACING (SILENCE INSERTION)
        // ========================================
        console.log('⏸️ Creating silence files for line spacing...');

        // Create concat list with silence between files
        const concatList = [];
        let silenceCount = 0;

        for (let i = 0; i < normalizedFiles.length; i++) {
            // Add the audio file
            concatList.push(`file '${normalizedFiles[i].path}'`);

            // Add silence after (except for last file)
            if (i < normalizedFiles.length - 1) {
                // Priority: per-file pauseAfter > pauseAfterValues array > default
                const pauseDuration = normalizedFiles[i].pauseAfter
                    || (pauseAfterValues && pauseAfterValues[i])
                    || 0.5; // Default 0.5 seconds

                const silencePath = path.join(tempDir, `silence_${i.toString().padStart(3, '0')}.wav`);

                // Generate silence file
                await runFFmpeg([
                    '-f', 'lavfi',
                    '-i', `anullsrc=r=44100:cl=stereo`,
                    '-t', pauseDuration.toString(),
                    '-c:a', 'pcm_s16le',
                    '-y',
                    silencePath
                ]);

                concatList.push(`file '${silencePath}'`);
                silenceCount++;
            }
        }

        console.log(`✅ Created ${silenceCount} silence files`);

        // Create file list for FFmpeg concat
        const fileListPath = path.join(tempDir, 'filelist.txt');
        const fileListContent = concatList.join('\n');

        fs.writeFileSync(fileListPath, fileListContent);
        console.log('✅ Created FFmpeg concat file list');

        // Output file path
        const outputPath = path.join(tempDir, 'concatenated.wav');

        // Run FFmpeg concatenation with speed reduction
        console.log('🎬 Starting final FFmpeg concatenation...');
        await runFFmpeg([
            '-f', 'concat',
            '-safe', '0',
            '-i', fileListPath,
            '-af', 'atempo=0.9', // Slow down to 90% speed (bedtime pacing)
            '-c:a', 'pcm_s16le',
            '-y',
            outputPath
        ]);

        console.log('✅ FFmpeg concatenation completed');

        // Verify output file exists and has content
        if (!fs.existsSync(outputPath)) {
            throw new Error('FFmpeg did not create output file');
        }

        const outputStats = fs.statSync(outputPath);
        console.log(`📁 Output file size: ${(outputStats.size / 1024).toFixed(1)} KB`);

        // Upload concatenated file to S3
        console.log('⬆️ Uploading concatenated file to S3...');
        const outputBuffer = fs.readFileSync(outputPath);

        const uploadParams = {
            Bucket: bucketName,
            Key: outputKey,
            Body: outputBuffer,
            ContentType: 'audio/wav',
            Metadata: {
                'production-id': productionId || '',
                'user-id': userId || '',
                'audio-files-count': audioFiles.length.toString(),
                'created-at': new Date().toISOString(),
                'node-version': '22',
                'volume-normalized': 'true',
                'spacing-applied': 'true'
            }
        };

        const uploadCommand = new PutObjectCommand(uploadParams);
        await s3.send(uploadCommand);
        console.log('✅ Upload completed');

        // Clean up temporary files
        console.log('🧹 Cleaning up temporary files...');
        fs.rmSync(tempDir, { recursive: true, force: true });

        // Return success response in format expected by n8n workflow
        const response = {
            success: true,
            message: `Successfully concatenated ${audioFiles.length} audio files with normalization and spacing`,
            finalAudioUrl: `https://${bucketName}.s3.eu-west-1.amazonaws.com/${outputKey}`,
            fileSizeKB: Math.round(outputStats.size / 1024),
            processingTimeMs: Date.now() - startTime,
            outputKey: outputKey,
            bucketName: bucketName,
            audioFilesProcessed: audioFiles.length,
            volumeNormalized: true,
            spacingApplied: true,
            nodeVersion: 22,
            processedAt: new Date().toISOString()
        };

        console.log('🎉 Lambda v2 execution completed successfully');
        console.log(`⏱️ Total processing time: ${response.processingTimeMs}ms`);
        return response;

    } catch (error) {
        console.error('❌ Lambda execution failed:', error);

        // Best-effort cleanup
        try {
            fs.rmSync('/tmp/audio-concat', { recursive: true, force: true });
        } catch (cleanupErr) {
            // Ignore cleanup errors
        }

        return {
            success: false,
            error: error.message,
            stack: error.stack,
            processingTimeMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            nodeVersion: 22
        };
    }
};

// Helper function to run FFmpeg
function runFFmpeg(args) {
    return new Promise((resolve, reject) => {
        console.log('🎬 FFmpeg command:', 'ffmpeg', args.join(' '));

        const ffmpeg = spawn('/opt/bin/ffmpeg', args);

        let stdout = '';
        let stderr = '';

        ffmpeg.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                console.error('❌ FFmpeg failed with code:', code);
                console.error('FFmpeg stderr:', stderr.slice(-500)); // Last 500 chars only
                reject(new Error(`FFmpeg failed with exit code ${code}: ${stderr.slice(-500)}`));
            }
        });

        ffmpeg.on('error', (error) => {
            console.error('❌ FFmpeg spawn error:', error);
            reject(error);
        });
    });
}
