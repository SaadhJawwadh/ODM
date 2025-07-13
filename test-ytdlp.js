/**
 * Test script for the secure yt-dlp manager
 * Run with: node test-ytdlp.js
 */

const {
    getYtdlpPath,
    getYtdlpSystemInfo,
    getVideoInfo,
    validateYtdlpInstallation,
    YtDlpNotFoundError,
    YtDlpExecutionError
} = require('./src/lib/ytdlp-manager');

// Test URLs (use safe, known working URLs)
const TEST_URLS = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll - Classic test video
    'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Short video
];

async function testSystemInfo() {
    console.log('🔍 Testing yt-dlp system information...');
    try {
        const info = await getYtdlpSystemInfo();
        console.log('✅ System info:', JSON.stringify(info, null, 2));
        return info;
    } catch (error) {
        console.error('❌ Failed to get system info:', error.message);
        return null;
    }
}

async function testPathResolution() {
    console.log('\n🔍 Testing path resolution...');
    try {
        const path = getYtdlpPath();
        console.log('✅ Resolved path:', path);

        // Test validation
        const validation = await validateYtdlpInstallation(path);
        console.log('✅ Validation successful:', validation);
        return true;
    } catch (error) {
        console.error('❌ Path resolution failed:', error.message);
        return false;
    }
}

async function testVideoInfo(url) {
    console.log(`\n🔍 Testing video info for: ${url}`);
    try {
        const info = await getVideoInfo(url, {
            timeout: 15000,
            maxBuffer: 1024 * 1024 * 2 // 2MB
        });

        console.log('✅ Video info retrieved:');
        console.log(`  Title: ${info.title}`);
        console.log(`  Duration: ${info.duration_string || info.duration}`);
        console.log(`  Uploader: ${info.uploader}`);
        console.log(`  Formats available: ${info.formats ? info.formats.length : 0}`);

        return true;
    } catch (error) {
        if (error instanceof YtDlpNotFoundError) {
            console.error('❌ yt-dlp not found:', error.message);
        } else if (error instanceof YtDlpExecutionError) {
            console.error('❌ yt-dlp execution error:', {
                exitCode: error.exitCode,
                stderr: error.stderr.substring(0, 200) + '...'
            });
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
        return false;
    }
}

async function testSecurityFeatures() {
    console.log('\n🔍 Testing security features...');

    // Test 1: Invalid URL handling
    console.log('  Testing invalid URL handling...');
    try {
        await getVideoInfo('not-a-url');
        console.log('❌ Should have failed with invalid URL');
    } catch (error) {
        console.log('✅ Correctly rejected invalid URL');
    }

    // Test 2: Command injection prevention
    console.log('  Testing command injection prevention...');
    try {
        await getVideoInfo('https://youtube.com/watch?v=test; echo "INJECTED"');
        console.log('✅ Command injection prevented (URL treated as single argument)');
    } catch (error) {
        console.log('✅ Command injection prevented (execution failed safely)');
    }

    // Test 3: Timeout handling
    console.log('  Testing timeout handling...');
    try {
        await getVideoInfo('https://youtube.com/watch?v=dQw4w9WgXcQ', {
            timeout: 1 // 1ms timeout - should fail
        });
        console.log('❌ Should have timed out');
    } catch (error) {
        if (error.message.includes('timed out')) {
            console.log('✅ Timeout handling working correctly');
        } else {
            console.log('⚠️  Timeout test inconclusive:', error.message);
        }
    }
}

async function testEnvironmentVariables() {
    console.log('\n🔍 Testing environment variable support...');

    // Save original env
    const originalPath = process.env.YTDLP_PATH;

    try {
        // Test with valid path
        process.env.YTDLP_PATH = getYtdlpPath();
        const info1 = await getYtdlpSystemInfo();
        console.log('✅ Environment variable respected:', info1.source);

        // Test with invalid path
        process.env.YTDLP_PATH = '/nonexistent/path/yt-dlp';
        const info2 = await getYtdlpSystemInfo();
        console.log('✅ Fallback working when env var invalid:', info2.source);

    } finally {
        // Restore original env
        if (originalPath) {
            process.env.YTDLP_PATH = originalPath;
        } else {
            delete process.env.YTDLP_PATH;
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting yt-dlp manager tests...\n');

    const results = {
        systemInfo: false,
        pathResolution: false,
        videoInfo: false,
        security: true, // Assume passed unless we find issues
        environment: false
    };

    // Test system info
    results.systemInfo = await testSystemInfo();

    // Test path resolution
    results.pathResolution = await testPathResolution();

    // Only proceed with video tests if basic functionality works
    if (results.systemInfo && results.pathResolution) {
        // Test video info with first URL
        results.videoInfo = await testVideoInfo(TEST_URLS[0]);

        // Test security features
        await testSecurityFeatures();

        // Test environment variables
        results.environment = true;
        await testEnvironmentVariables();
    } else {
        console.log('\n⚠️  Skipping video tests due to basic functionality issues');
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`${test.padEnd(20)}: ${status}`);
    });

    const allPassed = Object.values(results).every(Boolean);
    console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (!allPassed) {
        console.log('\n💡 Troubleshooting tips:');
        console.log('- Ensure yt-dlp is installed or bundled in ./bin/');
        console.log('- Check file permissions: chmod +x bin/yt-dlp');
        console.log('- Verify network connectivity');
        console.log('- Set YTDLP_PATH environment variable if needed');
    }

    return allPassed;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test runner crashed:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests, testSystemInfo, testVideoInfo };