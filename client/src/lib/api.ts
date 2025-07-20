import { Report } from "@/types/report";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://us-central1-nagar-chakshu.cloudfunctions.net/api";
const REPORTS_ENDPOINT = `${API_BASE_URL}/api/reports`;

export async function submitReport(data: Report) {
  try {
    console.log('Submitting report to:', REPORTS_ENDPOINT);
    console.log('Report data:', data);
    
    const res = await fetch(REPORTS_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // Add any required headers here
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to submit report: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log('Report submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('Submit report error:', error);
    throw error;
  }
}
