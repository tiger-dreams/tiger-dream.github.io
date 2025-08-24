require('dotenv').config();

async function testGeminiAPI() {
    const apiKey = process.env.GEMINI_API_KEY;
    const baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    console.log('🔍 Testing Gemini API...');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
    
    try {
        const response = await fetch(`${baseURL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Create a short Twitter post about screenshot annotation tools.'
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 0.7
                }
            })
        });

        console.log('Response Status:', response.status);
        
        const data = await response.json();
        console.log('Full Response:', JSON.stringify(data, null, 2));
        
        if (data.candidates && data.candidates[0]) {
            console.log('\n✅ Success! Generated content:');
            console.log(data.candidates[0].content.parts[0].text);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testGeminiAPI();