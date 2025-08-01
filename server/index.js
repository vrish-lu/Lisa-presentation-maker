import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper: Download image and save locally
async function downloadAndSaveImage(imageUrl, filename) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, response.data);
    
    // Return the local URL
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

// Helper: Generate unique filename
function generateImageFilename(prompt, index) {
  const timestamp = Date.now();
  const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `slide_${index}_${sanitizedPrompt}_${timestamp}.jpg`;
}

// Helper: Generate outline with OpenAI
async function generateOutline(topic, numSlides, amountOfText) {
  const prompt = `Generate ${numSlides} professional slide titles for "${topic}".\n\nIMPORTANT: Use ONLY these action verbs: Revolutionizing, Transforming, Accelerating, Empowering, Disrupting, Innovating\n\nBAD examples (NEVER use):\n- "What is ${topic}"\n- "Introduction"\n- "Overview"\n- "How it works"\n- "Applications"\n\nGOOD examples for "${topic}":\n- "Revolutionizing Industry Standards"\n- "Transforming Business Models"\n- "Accelerating Innovation"\n- "Empowering Digital Transformation"\n\nReturn JSON array with ${numSlides} professional titles.`;
  console.log('Generating outline with prompt:', prompt);
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a creative presentation expert who specializes in generating compelling, action-oriented slide titles. You NEVER use generic titles and always focus on impact and innovation. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 200
    });
    const responseText = completion.choices[0]?.message?.content;
    console.log('OpenAI outline response:', responseText);
    if (!responseText) throw new Error('No response from OpenAI');
    
    // Clean the response to remove markdown code blocks
    const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error generating outline:', err);
    return [
      `Introduction to ${topic}`,
      `Key Concepts of ${topic}`,
      `Applications of ${topic}`
    ];
  }
}

// Helper: Generate slide content with OpenAI
async function generateSlideContent(slideTitle, topic, amountOfText, slideIndex = 0) {
  let prompt;
  let maxTokens;
  
  // Special handling for first slide - always one comprehensive paragraph
  if (slideIndex === 0) {
    prompt = `Generate a compelling opening paragraph for the first slide of a professional presentation.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Create a powerful hook that grabs attention\n- Use professional, engaging language with industry-specific terminology\n- Include specific insights, statistics, or compelling facts\n- Make it memorable and thought-provoking\n- Use storytelling elements or surprising statistics\n- Return a JSON object: { paragraphs: string[] (1 comprehensive paragraph, 40-60 words) }`;
    maxTokens = 250;
  } else if (slideIndex === 2) {
    // Special handling for third slide - always generate bullets
    if (amountOfText === 'Extensive') {
      prompt = `Generate professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks, specific examples, and actionable insights\n- Include relevant statistics, case studies, or industry trends\n- Make content engaging and memorable\n- Return a JSON object: { bullets: string[] (4-6 professional bullet points, 8-15 words each) }`;
      maxTokens = 200;
    } else if (amountOfText === 'Detailed') {
      prompt = `Generate detailed professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Include compelling hooks and specific insights\n- Use professional language with concrete examples and industry terminology\n- Make content engaging and actionable with specific benefits\n- Include relevant statistics, case studies, or industry trends\n- Return a JSON object: { bullets: string[] (3-5 professional bullet points, 6-12 words each) }`;
      maxTokens = 180;
    } else if (amountOfText === 'Concise') {
      prompt = `Generate concise professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use engaging hooks and specific insights\n- Keep content clear and impactful with professional terminology\n- Include specific benefits or outcomes\n- Return a JSON object: { bullets: string[] (3-4 professional bullet points, 5-10 words each) }`;
      maxTokens = 150;
    } else {
      // Minimal
      prompt = `Generate minimal professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks and specific insights\n- Keep content clear and engaging with professional language\n- Include specific benefits or key takeaways\n- Return a JSON object: { bullets: string[] (2-3 professional bullet points, 5-8 words each) }`;
      maxTokens = 120;
    }
  } else {
    // For other slides, generate professional paragraphs instead of bullets
    if (amountOfText === 'Extensive') {
      prompt = `Generate professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks, specific examples, and actionable insights\n- Include relevant statistics, case studies, or industry trends\n- Make content engaging and memorable\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 20-30 words each) }`;
      maxTokens = 200;
    } else if (amountOfText === 'Detailed') {
      prompt = `Generate detailed professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Include compelling hooks and specific insights\n- Use professional language with concrete examples and industry terminology\n- Make content engaging and actionable with specific benefits\n- Include relevant statistics, case studies, or industry trends\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 15-25 words each) }`;
      maxTokens = 180;
    } else if (amountOfText === 'Concise') {
      prompt = `Generate concise professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use engaging hooks and specific insights\n- Keep content clear and impactful with professional terminology\n- Include specific benefits or outcomes\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 20-35 words each) }`;
      maxTokens = 200;
    } else {
      // Minimal
      prompt = `Generate minimal professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks and specific insights\n- Keep content clear and engaging with professional language\n- Include specific benefits or key takeaways\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 20-35 words each) }`;
      maxTokens = 200;
    }
  }
  
  console.log('Generating slide content with prompt:', prompt);
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional presentation expert specializing in creating compelling, engaging content with powerful hooks and actionable insights. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: maxTokens
    });
    const responseText = completion.choices[0]?.message?.content;
    console.log('OpenAI slide content response:', responseText);
    if (!responseText) throw new Error('No response from OpenAI');
    
    // Clean the response to remove markdown code blocks
    const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    
    // Handle different response formats based on slide index
    let bullets;
    if (slideIndex === 2) {
      // For third slide, use bullets directly
      bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
    } else {
      // For other slides, convert paragraphs to bullets for compatibility with existing frontend
      const paragraphs = Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [];
      bullets = paragraphs.map(paragraph => paragraph.trim());
    }
    
    // Adjust the number of paragraphs/bullets based on amount of text
    let maxParagraphs;
    if (slideIndex === 0) {
      maxParagraphs = 1; // Always one paragraph for slide one
    } else if (slideIndex === 2) {
      // For third slide, adjust number of bullets
      if (amountOfText === 'Extensive') {
        maxParagraphs = 6;
      } else if (amountOfText === 'Detailed') {
        maxParagraphs = 5;
      } else if (amountOfText === 'Concise') {
        maxParagraphs = 4;
      } else {
        maxParagraphs = 3;
      }
    } else if (amountOfText === 'Extensive') {
      maxParagraphs = 2; // Reduced from 3 to 2
    } else if (amountOfText === 'Detailed') {
      maxParagraphs = 2;
    } else if (amountOfText === 'Concise') {
      maxParagraphs = 1;
    } else {
      maxParagraphs = 2;
    }
    
    return {
      bullets: bullets.slice(0, maxParagraphs)
    };
  } catch (err) {
    console.error('Error generating slide content:', err);
    return {
      bullets: slideIndex === 0 ? ['Sample professional opening paragraph for slide one.'] : ['Sample professional paragraph 1', 'Sample professional paragraph 2']
    };
  }
}

// Helper: Generate image with Ideogram ONLY (no fallback)
async function generateIdeogramImage(prompt, style, slideIndex = 0) {
  try {
    console.log(`Generating image for: ${prompt} with style: ${style}`);
    // You may want to keep your generateProfessionalPrompt logic here if you have it
    const ideogramPrompt = prompt; // Or use generateProfessionalPrompt(prompt, style) if defined
    const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY;
    if (!IDEOGRAM_API_KEY) {
      throw new Error('No Ideogram API key found');
    }
    // Call Ideogram API with correct headers and payload
    const response = await axios.post('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      prompt: ideogramPrompt,
      rendering_speed: 'TURBO',
      quality: 'standard'
    }, {
      headers: {
        'Api-Key': IDEOGRAM_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    // Extract the image URL from the correct response path
    const imageUrl = response.data?.data?.[0]?.url;
    if (imageUrl) {
      console.log('Ideogram API successful, downloading image...');
      const filename = generateImageFilename(prompt, slideIndex);
      const localUrl = await downloadAndSaveImage(imageUrl, filename);
      if (localUrl) {
        console.log(`Ideogram image saved locally: ${localUrl}`);
        return localUrl;
      } else {
        throw new Error('Failed to download Ideogram image');
      }
    } else {
      throw new Error('No image_url in Ideogram API response');
    }
  } catch (err) {
    console.error('Error generating Ideogram image:', err);
    // Return null if anything fails
    return null;
  }
}

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  const { title, outline, theme, amountOfText, slideCount, imageSource, imageStyle } = req.body;
  try {
    // If outline is empty or not provided, generate it with GPT
    const numSlides = outline && outline.length ? outline.length : (slideCount || 5);
    const outlineTitles = outline && outline.length && outline[0].title
      ? outline.map(s => s.title)
      : await generateOutline(title, numSlides, amountOfText);

    // Generate paragraphs for each slide
    const slides = await Promise.all(outlineTitles.map(async (slideTitle, idx) => {
      const content = await generateSlideContent(slideTitle, title, amountOfText, idx);
      let imageUrl;
      if (imageSource !== 'None') {
        imageUrl = await generateIdeogramImage(slideTitle + ' ' + (imageStyle || ''), imageStyle, idx);
      }
      
      // Determine layout: first slide always left image, others random
      let layout;
      if (idx === 0) {
        layout = 'image-left'; // First slide always left image
        console.log(`Slide ${idx + 1}: First slide - layout set to ${layout}`);
      } else {
        // Randomly select from: image-left, image-right, image-bottom, text-only
        const layoutOptions = ['image-left', 'image-right', 'image-bottom', 'text-only'];
        const randomIndex = Math.floor(Math.random() * layoutOptions.length);
        layout = layoutOptions[randomIndex];
        console.log(`Slide ${idx + 1}: Random layout selected - ${layout} (index: ${randomIndex})`);
      }
      
      return {
        id: `slide-${idx + 1}`,
        title: slideTitle,
        bullets: content.bullets,
        layout: layout,
        theme,
        image: imageUrl ? {
          url: imageUrl,
          alt: slideTitle,
          source: imageSource,
          style: imageStyle
        } : undefined
      };
    }));
    
    // Log the layouts for debugging
    console.log('Generated slides with layouts:');
    slides.forEach((slide, index) => {
      console.log(`Slide ${index + 1}: ${slide.title} - Layout: ${slide.layout}`);
    });
    
    res.json({
      slides,
      meta: {
        title,
        theme,
        amountOfText,
        imageSource,
        imageStyle
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate slides', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// POST /api/generate-image
app.post('/api/generate-image', async (req, res) => {
  const { prompt, style, slideIndex = 0 } = req.body;
  try {
    const imageUrl = await generateIdeogramImage(prompt, style, slideIndex);
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate image', details: err.message });
  }
});
