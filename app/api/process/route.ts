import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert the uploaded File into a Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Define our target device dimensions
    const devices = [
      { name: 'iphone', width: 1170, height: 2532 },
      { name: 'ipad', width: 1536, height: 2048 },
      { name: 'android', width: 1080, height: 2400 }
    ];

    // Initialize the zip archiver
    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(passThrough);

    // Process all device frames concurrently
    await Promise.all(devices.map(async (device) => {
      // 1. Resize the image to fit inside the frame
      // 2. Extend it with a dark border to simulate the device hardware
      const processedImage = await sharp(buffer)
        .resize({
          width: device.width - 120, 
          height: device.height - 120,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: 60, bottom: 60, left: 60, right: 60,
          background: '#18181b' // Dark zinc color
        })
        .png()
        .toBuffer();

      // Add the processed image buffer to the zip file
      archive.append(processedImage, { name: `${device.name}-frame.png` });
    }));

    // Finalize the zip file
    archive.finalize();

    // Collect the streaming zip data into a single Buffer for Next.js
    const chunks: Buffer[] = [];
    for await (const chunk of passThrough) {
      chunks.push(chunk as Buffer);
    }
    const zipBuffer = Buffer.concat(chunks);

    // Return the downloadable zip file to the frontend
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="framed-screenshots.zip"',
      },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}