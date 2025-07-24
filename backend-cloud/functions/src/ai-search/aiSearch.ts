// import { Router } from 'express';
// import { GoogleAuth } from 'google-auth-library';
// import axios from 'axios';

// const router = Router();

// // 🔧 Replace these values
// const PROJECT_ID = 'nagar-chakshu';
// const LOCATION = 'global'; // ✅ FIXED: Changed from us-central1 to global
// const DATASTORE_ID = 'my-vertex_1753295752913';
// const SERVING_CONFIG_ID = 'default_config';

// router.post('/', async (req, res) => {
//   const userQuery = req.body.message;

//   if (!userQuery) {
//     return res.status(400).json({ error: 'Missing message field' });
//   }

//   try {
//     const auth = new GoogleAuth({
//       scopes: ['https://www.googleapis.com/auth/cloud-platform'],
//     });

//     const client = await auth.getClient();
//     const accessToken = await client.getAccessToken();

//     // ✅ FIXED: Use discoveryengine.googleapis.com instead of aiplatform.googleapis.com
//     const url = `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/dataStores/${DATASTORE_ID}/servingConfigs/${SERVING_CONFIG_ID}:search`;

//     const response = await axios.post(
//       url,
//       {
//         query: userQuery,
//         pageSize: 10, // Optional: limit results
//         // Optional: Add more parameters as needed
//         // queryExpansionSpec: {
//         //   condition: 'AUTO'
//         // },
//         // spellCorrectionSpec: {
//         //   mode: 'AUTO'
//         // }
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken.token}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     return res.status(200).json(response.data);
//   } catch (error: any) {
//     console.error('[Vertex AI Search Error]', {
//       message: error.message,
//       status: error?.response?.status,
//       statusText: error?.response?.statusText,
//       data: error?.response?.data,
//       config: {
//         url: error?.config?.url,
//         method: error?.config?.method
//       }
//     });
    
//     // Return more specific error information
//     if (error?.response?.status === 404) {
//       return res.status(404).json({ 
//         error: 'Data store not found. Please verify your PROJECT_ID, LOCATION, and DATASTORE_ID.' 
//       });
//     } else if (error?.response?.status === 403) {
//       return res.status(403).json({ 
//         error: 'Permission denied. Please check your authentication and API permissions.' 
//       });
//     }
    
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });

// export default router;

import { Router } from 'express';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

const router = Router();

// 🔧 Replace these values
const PROJECT_ID = 'nagar-chakshu';
const LOCATION = 'global';
const DATASTORE_ID = 'my-vertex_1753295752913';
const SERVING_CONFIG_ID = 'default_config';
const GEMINI_LOCATION = 'us-central1'; // Gemini API location

router.post('/', async (req, res) => {
  const userQuery = req.body.message;

  if (!userQuery) {
    return res.status(400).json({ error: 'Missing message field' });
  }

  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Step 1: Search Vertex AI Data Store
    const searchUrl = `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/dataStores/${DATASTORE_ID}/servingConfigs/${SERVING_CONFIG_ID}:search`;

    const searchResponse = await axios.post(
      searchUrl,
      {
        query: userQuery,
        pageSize: 5, // Limit results for better context
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Step 2: Extract and format search results for Gemini
    const searchResults = searchResponse.data.results || [];
    let contextData = '';
    
    if (searchResults.length > 0) {
      contextData = searchResults.map((result:any, index:any) => {
        const data = result.document?.structData || {};
        return `Result ${index + 1}:
Location: ${data.location || 'Not specified'}
Summary: ${data.summary || 'No summary available'}
Advice: ${data.advice || 'No advice available'}
Descriptions: ${data.descriptions ? data.descriptions.join('; ') : 'No descriptions'}
Coordinates: ${data.coordinates ? `${data.coordinates.lat}, ${data.coordinates.lng}` : 'Not available'}
Source City: ${data.source_city || 'Not specified'}
---`;
      }).join('\n');
    } else {
      contextData = 'No relevant information found in the database.';
    }

    // Step 3: Generate AI response using Gemini 2.5 Flash
    const geminiUrl = `https://${GEMINI_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${GEMINI_LOCATION}/publishers/google/models/gemini-2.0-flash-exp:generateContent`;

    const systemPrompt = `You are a helpful city assistant AI that provides information about traffic, road conditions, and city-related queries based on real-time data. 

Your role is to:
1. Answer user questions using the provided search results
2. Give practical advice and recommendations
3. Be conversational and helpful
4. If no relevant data is found, politely inform the user
5. Focus on safety and practical guidance
6. Provide location-specific information when available

Always base your responses on the provided data and be honest if information is not available.`;

    const userPrompt = `User Question: ${userQuery}

Search Results from Database:
${contextData}

Please provide a helpful, conversational response to the user's question based on the search results above. If the data shows any safety concerns or traffic issues, make sure to highlight them clearly.`;

    const geminiResponse = await axios.post(
      geminiUrl,
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Step 4: Extract AI response
    const aiResponse = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response at this time.';

    // Step 5: Return combined response
    return res.status(200).json({
      success: true,
      query: userQuery,
      aiResponse: aiResponse,
      searchResults: searchResults,
      totalResults: searchResponse.data.totalSize || 0,
      // Optional: include raw search data for debugging
      // rawSearchData: searchResponse.data
    });

  } catch (error: any) {
    console.error('[AI Assistant Error]', {
      message: error.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      config: {
        url: error?.config?.url,
        method: error?.config?.method
      }
    });
    
    // Return more specific error information
    if (error?.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Service not found. Please verify your configuration.' 
      });
    } else if (error?.response?.status === 403) {
      return res.status(403).json({ 
        error: 'Permission denied. Please check your authentication and API permissions.' 
      });
    } else if (error?.response?.status === 400) {
      return res.status(400).json({ 
        error: 'Bad request. Please check your request format.',
        details: error?.response?.data 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;