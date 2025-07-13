#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const binDir = path.join(process.cwd(), 'bin');

function getPlatformInfo() {
    const platform = process.platform;

    if (platform === 'win32') {
        return {
            name: 'yt-dlp.exe',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
        };
    }

    if (platform === 'linux') {
        return {
            name: 'yt-dlp',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
        };
    }

    if (platform === 'darwin') {
        return {
            name: 'yt-dlp_macos',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        };
    }

    throw new Error(`Unsupported platform: ${platform}`);
}

function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirects
                return downloadFile(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function installViaPython() {
    console.log('🐍 Attempting to install yt-dlp via Python pip...');

    const pipCommands = [
        'pip3 install yt-dlp',
        'pip install yt-dlp',
        'python3 -m pip install yt-dlp',
        'python -m pip install yt-dlp'
    ];

    for (const cmd of pipCommands) {
        try {
            console.log(`   Trying: ${cmd}`);
            execSync(cmd, { stdio: 'pipe' });
            console.log(`✅ Successfully installed yt-dlp via ${cmd}`);

            // Verify installation
            try {
                execSync('python3 -m yt_dlp --version', { stdio: 'pipe' });
                console.log('✅ Python3 yt-dlp verification successful');
                return true;
            } catch (e) {
                try {
                    execSync('python -m yt_dlp --version', { stdio: 'pipe' });
                    console.log('✅ Python yt-dlp verification successful');
                    return true;
                } catch (e2) {
                    console.log('⚠️  Installation succeeded but verification failed');
                }
            }
        } catch (error) {
            console.log(`   Failed: ${cmd}`);
        }
    }

    return false;
}

async function downloadBinary() {
    console.log('📥 Attempting to download yt-dlp binary...');

    try {
        const platformInfo = getPlatformInfo();

        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true });
        }

        const binaryPath = path.join(binDir, platformInfo.name);

        console.log(`   Downloading from: ${platformInfo.url}`);
        console.log(`   Saving to: ${binaryPath}`);

        await downloadFile(platformInfo.url, binaryPath);

        if (process.platform !== 'win32') {
            fs.chmodSync(binaryPath, 0o755);
        }

        console.log('✅ Binary downloaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Binary download failed:', error.message);
        return false;
    }
}

async function createRequirementsTxt() {
    console.log('📝 Creating requirements.txt for Python dependencies...');

    const requirementsPath = path.join(process.cwd(), 'requirements.txt');
    const requirements = `yt-dlp>=2023.1.6
`;

    fs.writeFileSync(requirementsPath, requirements);
    console.log('✅ requirements.txt created');
}

async function createDockerfile() {
    console.log('🐳 Creating Dockerfile with yt-dlp support...');

    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    const dockerfileContent = `FROM node:18-alpine

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Install yt-dlp
RUN pip3 install yt-dlp

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
`;

    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('✅ Dockerfile created');
}

async function createDockerCompose() {
    console.log('🐳 Creating docker-compose.yml...');

    const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
    const dockerComposeContent = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./temp:/app/temp
    restart: unless-stopped
`;

    fs.writeFileSync(dockerComposePath, dockerComposeContent);
    console.log('✅ docker-compose.yml created');
}

async function main() {
    console.log('🚀 Setting up yt-dlp for deployment...\n');

    const strategies = [
        { name: 'Python pip installation', fn: installViaPython },
        { name: 'Binary download', fn: downloadBinary }
    ];

    let success = false;

    for (const strategy of strategies) {
        console.log(`\n📋 Trying strategy: ${strategy.name}`);
        try {
            const result = await strategy.fn();
            if (result) {
                console.log(`✅ Strategy "${strategy.name}" succeeded!\n`);
                success = true;
                break;
            }
        } catch (error) {
            console.error(`❌ Strategy "${strategy.name}" failed:`, error.message);
        }
    }

    if (!success) {
        console.log('⚠️  No installation strategy succeeded. Creating deployment files...\n');
    }

    // Create additional deployment files
    await createRequirementsTxt();
    await createDockerfile();
    await createDockerCompose();

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps for deployment:');
    console.log('   1. For Docker: docker-compose up --build');
    console.log('   2. For Vercel: Ensure Python runtime is enabled');
    console.log('   3. For Railway: Add Python buildpack');
    console.log('   4. For Heroku: Add Python buildpack');
    console.log('   5. For manual deployment: pip install -r requirements.txt');

    if (success) {
        console.log('\n✅ yt-dlp is ready for use!');
    } else {
        console.log('\n⚠️  Please manually install yt-dlp on your deployment platform.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, installViaPython, downloadBinary };