import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const devices = [
      { name: 'iphone', width: 1170, height: 2532 },
      { name: 'ipad', width: 1536, height: 2048 },
      { name: 'android', width: 1080, height: 2400 }
    ];

    // Initialize the new JSZip instance
    const zip = new JSZip();

    await Promise.all(devices.map(async (device) => {
      const processedImage = await sharp(buffer)
        .resize({
          width: device.width - 120, 
          height: device.height - 120,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: 60, bottom: 60, left: 60, right: 60,
          background: '#18181b'
        })
        .png()
        .toBuffer();

      // Add each processed image directly to the zip memory object
      zip.file(`${device.name}-frame.png`, processedImage);
    }));

    // Generate the final zip buffer
    const zipBuffer = await zip.generateAsync({ 
      type: 'uint8array', 
      compression: 'DEFLATE', 
      compressionOptions: { level: 9 } 
    });

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