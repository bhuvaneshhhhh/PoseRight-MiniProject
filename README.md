# PoseRight-AI: Your AI-Powered Fitness Companion

<p align="center">
  <img src="https://storage.googleapis.com/static.aifor.dev/pose-right-ai.png" alt="PoseRight-AI Banner" width="800">
</p>

<p align="center">
  <strong>PoseRight-AI</strong> is a cutting-edge web application that acts as your personal fitness coach. It leverages the power of real-time computer vision and generative AI to analyze your exercise form, provide immediate corrective feedback, and offer personalized fitness advice.
</p>

---

## ✨ Features

- **Live Pose Correction**: Get real-time visual feedback and a 'Form Score' on your exercises using your webcam. The app overlays a skeleton on your body and analyzes joint angles to ensure you're performing moves correctly and safely.
- **AI Exercise Identification**: Don't know what exercise you're doing? The app can automatically identify the exercise you are performing from a predefined list.
- **AI Fitness Coach**: A conversational chatbot, powered by Google Gemini, ready to answer all your questions about fitness, nutrition, and workout routines.
- **Personalized Routine & Diet Plans**: Generate tailored 7-day workout routines and diet plans based on your fitness level, goals, and dietary preferences.
- **Interactive Dashboard**: Track your weekly activity and progress with beautiful, intuitive charts.
- **Customizable Schedules**: Plan your workouts for the week with a simple drag-and-drop style interface.
- **Text-to-Speech Feedback**: Receive critical form corrections as spoken audio, so you don't have to look at the screen.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Generative AI**: [Google Genkit](https://firebase.google.com/docs/genkit) with the [Google Gemini](https://deepmind.google/technologies/gemini/) family of models.
- **Pose Detection**: [Google's MediaPipe](https://developers.google.com/mediapipe) (`PoseLandmarker`)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) (Mocked, ready for integration)
- **Database**: [Firestore](https://firebase.google.com/docs/firestore) (Mocked, ready for integration)

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)

### Setup & Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/poseright-ai.git
    cd poseright-ai
    ```

2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set Up Environment Variables:**
    To run the AI features, you need a Google AI API key.

    -   Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
    -   Create a new file named `.env.local` in the root of the project.
    -   Add your API key to the `.env.local` file:
        ```env
        GEMINI_API_KEY=your_api_key_here
        ```

### Running the Application

The application consists of two main parts that need to run concurrently: the Next.js frontend and the Genkit AI backend.

1.  **Start the Next.js Frontend:**
    In your terminal, run the following command to start the web application:
    ```bash
    pnpm run dev
    ```
    The app will be available at `http://localhost:9002`.

2.  **Start the Genkit AI Backend:**
    Open a **second terminal window** and run the following command to start the AI service:
    ```bash
    pnpm run genkit:watch
    ```
    This will start the Genkit development server, which automatically reloads when you make changes to your AI flows. The Next.js app communicates with this service for all generative AI features.

    You should now have a fully functional local development environment!

---

## 🏗️ Project Structure

A brief overview of the key directories in the project:

-   **/src/app**: Contains all the pages and layouts for the Next.js application, following the App Router structure.
-   **/src/components**: Shared React components used across the application (e.g., UI elements, charts, forms).
-   **/src/ai**: The heart of the AI functionality.
    -   **/src/ai/flows**: Contains all the Genkit flows that define the logic for interacting with the Gemini models.
-   **/src/lib**: Contains shared utilities, constants, and library-specific code.
    -   `poses.ts`: Defines the angle rules and stages for each exercise.
    -   `exercises.ts`: A list of available exercises for routine generation.
-   **/src/firebase**: Firebase configuration and hooks for easy integration.

## 📄 License

This project is open-source and available under the MIT License.
