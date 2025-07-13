const fs = require('fs');
const path = require('path');

// Simple favicon generation script
// This creates basic favicon files from the SVG

const publicDir = path.join(__dirname, '..', 'public');

// Create a simple ICO file content (minimal 16x16 icon)
const createIcoFile = () => {
    // This is a minimal ICO file structure
    const icoHeader = Buffer.from([
        0x00, 0x00, // Reserved
        0x01, 0x00, // Type (1 = ICO)
        0x01, 0x00, // Number of images
        0x10, 0x00, // Width (16)
        0x10, 0x00, // Height (16)
        0x00, 0x00, // Color count
        0x00, 0x00, // Reserved
        0x01, 0x00, // Color planes
        0x20, 0x00, // Bits per pixel
        0x40, 0x00, 0x00, 0x00, // Size of image data
        0x16, 0x00, 0x00, 0x00  // Offset to image data
    ]);

    // Simple 16x16 blue icon data (minimal PNG-like data)
    const iconData = Buffer.alloc(64, 0x3b); // Blue color
    for (let i = 0; i < 64; i += 4) {
        iconData[i] = 0x3b;     // Blue
        iconData[i + 1] = 0x82; // Green
        iconData[i + 2] = 0xf6; // Red
        iconData[i + 3] = 0xff; // Alpha
    }

    return Buffer.concat([icoHeader, iconData]);
};

// Create a simple PNG-like file (simplified)
const createPngFile = (size) => {
    // This is a simplified approach - in production you'd use a proper PNG library
    const header = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A // PNG signature
    ]);

    // Simple blue square data
    const data = Buffer.alloc(size * size * 4, 0);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 0x3b;     // Blue
        data[i + 1] = 0x82; // Green
        data[i + 2] = 0xf6; // Red
        data[i + 3] = 0xff; // Alpha
    }

    return Buffer.concat([header, data]);
};

// Generate favicon files
try {
    console.log('Generating favicon files...');

    // Create favicon.ico
    const icoData = createIcoFile();
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoData);
    console.log('✓ Created favicon.ico');

    // Create PNG files (simplified)
    const png16 = createPngFile(16);
    fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
    console.log('✓ Created favicon-16x16.png');

    const png32 = createPngFile(32);
    fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
    console.log('✓ Created favicon-32x32.png');

    const png180 = createPngFile(180);
    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
    console.log('✓ Created apple-touch-icon.png');

    console.log('All favicon files generated successfully!');
} catch (error) {
    console.error('Error generating favicon files:', error);
}