# Nagar-Chakshu: Agentic AI for Urban Intelligence

> Built during **Google Cloud Agentic AI Day Hackathon**


---

## 📌 Problem Statement

**Managing City Data Overload**

A bustling metropolis like Bengaluru generates millions of scattered data points every minute — from traffic updates and civic issues to cultural events. This data is:

* **Noisy**: multiple duplicate posts about the same issue.
* **Siloed**: spread across social media, apps, and websites.
* **Ephemeral**: becomes outdated almost instantly.

**The challenge is not just reporting news, but finding the *signal in the noise* and creating a *living pulse of the city*.**

---

## 🌟 Objective

To build an **agentic AI-powered platform** that:

1. **Fuses disparate data**: Ingests real-time information from social media, user reports, and APIs, then synthesizes them into clean summaries.
2. **Enables multimodal citizen reporting**: Users can submit geo-tagged photos/videos; Gemini analyzes them, categorizes the event, and maps it automatically.
3. **Creates a predictive & agentic layer**: Forecasts traffic surges, civic issues, and provides **AI-driven alerts**.
4. **Visualizes the urban pulse**: Real-time map-based dashboard with sentiment analysis to show the city’s live mood.

---

## 🚀 Features

* **Multimodal Data Ingestion**: Collects text, images, videos, GPS from user reports & platforms like Reddit, Telegram, X.
* **AI-Powered Summarization & Categorization**: Uses **Gemini 2.5 Flash** to merge duplicates, remove noise, and classify events.
* **Context-Aware AI Chatbot**: Users can ask *“What’s happening near me?”* and get real-time AI summaries.
* **City Sentiment & Pulse Score**: Computes a live *Urban Pulse Index (0–100)* based on complaints, traffic, and sentiment.
* **Location-Based Visualization & Alerts**: Personalized, location-aware notifications with clustering on Google Maps.
* **Feedback-Driven Learning**: User upvotes refine future summaries for accuracy and trust.
* **Predictive Intelligence**: Time-series forecasting for urban events like power outages or traffic jams.
* **Emergency Auto-Escalation**: Detects critical incidents and escalates them to authorities automatically.
* **Multilingual & Voice Support**: Inclusive reporting with regional languages (Kannada, Hindi, Tamil, etc.).
* **Future Scope**: AR integration for real-time overlays of civic issues + multi-persona AI assistants.

---

## 🗷️ Architecture

The system is built as an **Agentic AI pipeline** with specialized agents:

* **Data Ingestion** → Social APIs (X, Reddit, Telegram) + Citizen Reports
* **Processing & Summarization** → Gemini 2.5 Flash + Vertex AI Agents
* **Categorization & Forecasting** → Vertex AI Forecasting, Cloud Vision, Sentiment Analysis
* **Storage** → Firebase Firestore, Realtime DB, Cloud Storage
* **Visualization** → React.js frontend + Map-based dashboard
* **Notifications & Personalization** → Firebase Messaging, GeoFire, Maps SDK

---

## 🛠️ Tech Stack

### **Google Cloud & AI**

* **Vertex AI** → Agents, Forecasting, Multimodal analysis
* **Gemini 2.5 Flash** → Summarization, categorization, sentiment analysis
* **Pub/Sub** → Event scheduling & orchestration
* **Compute Engine** → Hosting custom AI agents
* **Cloud Run & Functions** → Serverless backend & APIs

### **Firebase**

* **Firestore & Realtime Database** → Data storage & live updates
* **Firebase Auth** → Secure authentication
* **Firebase Storage** → User media (photos/videos)
* **Firebase Cloud Messaging (FCM)** → Personalized notifications
* **Firebase Extensions & App Check** → Security & scalability

### **Frontend & Integration**

* **Next.js** → Web dashboard & reporting UI
* **Google Maps SDK & GeoFire** → Location intelligence & clustering
* **APIs** → Reddit, Telegram, X, Apify

---

## 📂 Repository Structure

```
Nagar-Chakshu/
│── frontend/          # Next.js app (map & dashboard UI)
│── backend/           # Firebase Functions (TypeScript + Express)
│── agents/            # Vertex AI & Gemini agent configs
│── docs/              # Architecture diagrams & project reports
│── README.md          # This file
```

---

## 🔧 Setup & Installation

1. **Clone the repository**

```bash
git clone https://github.com/Adbhut07/Nagar-Chakshu.git
cd Nagar-Chakshu
```

2. **Install dependencies**

```bash
npm install  
```

3. **Firebase setup**

* Add your Firebase project config in `.env.local` (frontend) and `firebase.json` (backend).
* Enable **Auth, Firestore, Storage, Messaging** in Firebase Console.

4. **Google Cloud setup**

* Enable **Vertex AI, Cloud Functions, Pub/Sub, Compute Engine, Maps API**.
* Add service account credentials to `.env` or GCP Secret Manager.

5. **Run locally**

```bash
npm run dev
```

---

## 📊 Impact

* **Agentic Personalization** → Learns user behavior & preferences.
* **Narrative Event Evolution** → Threads real-time storylines of civic events.
* **Urban Pulse Score** → Quantifies city’s live “mood index”.
* **Feedback-Aware Learning Loop** → System improves continuously.
* **True Multimodal Intelligence** → Goes beyond text by understanding images, videos, and sentiment.

---

## Resources

* 🔗 GitHub Repo: [Nagar-Chakshu](https://github.com/Adbhut07/Nagar-Chakshu)
