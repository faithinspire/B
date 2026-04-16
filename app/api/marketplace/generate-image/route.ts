import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, category, description } = body;

    if (!productName || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: productName, category' },
        { status: 400 }
      );
    }

    // Use Replicate API for image generation (free tier available)
    // Alternative: Use Hugging Face, Stability AI, or other providers
    const prompt = `Professional product photo of ${productName} for ${category}. ${description || ''}. High quality, well-lit, professional photography, white background, e-commerce style`;

    // Option 1: Using Replicate (requires API key)
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'db21e45d3f7023abc9e53f8e04be30e46434305c601fc55aa58eec22b02eeebb', // Stable Diffusion 3
            input: {
              prompt,
              num_outputs: 1,
              height: 768,
              width: 768,
              scheduler: 'K_EULER',
              num_inference_steps: 50,
              guidance_scale: 7.5,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Replicate API error');
        }

        const prediction = await response.json();

        return NextResponse.json({
          success: true,
          data: {
            imageUrl: prediction.output?.[0] || null,
            predictionId: prediction.id,
            status: prediction.status,
            prompt,
          },
        });
      } catch (err) {
        console.error('Replicate error:', err);
        // Fall through to alternative
      }
    }

    // Option 2: Using Hugging Face Inference API (free tier)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
          {
            headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
            method: 'POST',
            body: JSON.stringify({ inputs: prompt }),
          }
        );

        if (!response.ok) {
          throw new Error('Hugging Face API error');
        }

        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64}`;

        return NextResponse.json({
          success: true,
          data: {
            imageUrl,
            prompt,
            provider: 'huggingface',
          },
        });
      } catch (err) {
        console.error('Hugging Face error:', err);
      }
    }

    // Option 3: Return placeholder with prompt for manual generation
    // This allows braiders to use external tools and upload the image
    return NextResponse.json({
      success: true,
      data: {
        imageUrl: null,
        prompt,
        message: 'AI image generation not configured. Use this prompt with an AI image generator (DALL-E, Midjourney, Stable Diffusion) and upload the generated image.',
        instructions: [
          '1. Copy the prompt below',
          '2. Use an AI image generator (DALL-E, Midjourney, Stable Diffusion, etc.)',
          '3. Generate the image',
          '4. Download and upload to your product',
        ],
      },
    });
  } catch (err) {
    console.error('Image generation error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check generation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get('predictionId');

    if (!predictionId || !process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Missing prediction ID or API token' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch prediction status');
    }

    const prediction = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        status: prediction.status,
        imageUrl: prediction.output?.[0] || null,
        error: prediction.error,
      },
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
