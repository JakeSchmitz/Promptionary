const API_BASE_URL = 'http://localhost:3000/api';

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    console.log('Sending request to backend:', `${API_BASE_URL}/generate-image`);
    console.log('Request payload:', { prompt });
    
    const response = await fetch(`${API_BASE_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error response from backend:', error);
      throw new Error(error.details || 'Failed to generate image');
    }

    const data = await response.json();
    console.log('Success response from backend:', data);
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    // Return a more reliable placeholder image
    return 'https://placehold.co/1024x1024/png?text=Image+Generation+Failed';
  }
}; 