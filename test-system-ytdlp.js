#!/usr/bin/env node

/**
 * Test script for system yt-dlp configuration
 * This script tests the system yt-dlp integration
 */

const { systemYtDlpManager, getEngineStatus } = require('./src/lib/system-ytdlp-config.ts');

async function testSystemYtDlp() {
    console.log('🧪 Testing System yt-dlp Configuration\n');

    try {
        // Test 1: Get engine status
        console.log('1. Getting engine status...');
        const status = await getEngineStatus();
        console.log('✅ Status:', JSON.stringify(status, null, 2));

        // Test 2: Get best engine
        console.log('\n2. Getting best engine...');
        const engine = await systemYtDlpManager.getBestEngine();
        console.log('✅ Best engine:', JSON.stringify(engine, null, 2));

        // Test 3: Test yt-dlp command
        console.log('\n3. Testing yt-dlp command...');
        const result = await systemYtDlpManager.executeYtDlpCommand(['--version'], { timeout: 10000 });
        console.log('✅ Command result:', JSON.stringify(result, null, 2));

        // Test 4: Test video info
        console.log('\n4. Testing video info extraction...');
        const videoInfo = await systemYtDlpManager.executeYtDlpCommand([
            '--dump-json',
            '--no-warnings',
            '--no-playlist',
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        ], { timeout: 30000 });

        if (videoInfo.success) {
            const info = JSON.parse(videoInfo.stdout);
            console.log('✅ Video info extracted successfully');
            console.log('   Title:', info.title);
            console.log('   Duration:', info.duration);
            console.log('   Formats:', info.formats?.length || 0);
        } else {
            console.log('❌ Video info extraction failed:', videoInfo.stderr);
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    testSystemYtDlp();
}

module.exports = { testSystemYtDlp };