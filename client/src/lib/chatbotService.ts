import { v4 as uuidv4 } from 'uuid';

// Types for chatbot API
export interface ChatbotRequest {
  message: string;
  context: {
    user_id: string;
  };
  session_id: string;
}

export interface ChatbotResponse {
  data: {
    message: string;
    status: string;
    final_response: string;
  };
}

// Generate a unique session ID
export const generateSessionId = (): string => {
  return uuidv4();
};

// Send message to chatbot API
export const sendChatMessage = async (
  message: string,
  userId: string,
  sessionId: string
): Promise<ChatbotResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
  
  if (!apiUrl) {
    throw new Error('Chatbot API URL not configured');
  }

  const requestBody: ChatbotRequest = {
    message,
    context: {
      user_id: userId,
    },
    session_id: sessionId,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chatbot API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};
