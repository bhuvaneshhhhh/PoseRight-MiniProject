# PoseRight-AI: Your AI-Powered Fitness Companion

PoseRight-AI is a modern web application designed to be a personal fitness coach. It leverages cutting-edge AI and computer vision to provide users with real-time feedback on their exercise form, personalized workout plans, and AI-driven coaching.

This document provides a complete breakdown of the application's architecture, features, and underlying technologies.

---

## Core Technologies

This application is built with a modern, robust, and scalable tech stack.

*   **Language:** **TypeScript** is used throughout the project for type safety, improved developer experience, and code quality.

*   **Framework:** **Next.js 15** (with React 18) serves as the foundation, utilizing the App Router for server-centric routing, Server Components for performance, and a clear project structure.

*   **Styling:**
    *   **Tailwind CSS:** A utility-first CSS framework for rapid and consistent UI development.
    *   **ShadCN UI:** A collection of beautifully designed and accessible React components that are fully customizable. The theme is configured in `src/app/globals.css`.

*   **Generative AI:**
    *   **Genkit:** Google's open-source framework for building production-ready AI-powered features. It orchestrates calls to various AI models and is used for all backend AI logic. It is initialized in `src/ai/genkit.ts`.
    *   **Google Gemini:** The application uses the `gemini-2.5-flash` model for its speed and multimodal capabilities, which power both the AI Coach and the Exercise Identification features.

*   **Real-time Pose Tracking:**
    *   **MediaPipe:** Google's open-source library for live, on-device computer vision tasks. The `PoseLandmarker` task from `@mediapipe/tasks-vision` is used to detect human pose landmarks from the user's webcam feed in real-time.

---

## Feature Breakdown

### 1. User Authentication (Mock-Up)

*   **Files:** `src/app/page.tsx` (Login), `src/app/signup/page.tsx` (Signup), `src/components/auth/*.tsx`
*   **Description:** The application features standard login and signup pages. Currently, the forms are mock-ups that simulate a successful login to demonstrate the UI flow. This is designed to be easily integrated with a service like **Firebase Authentication**.

### 2. Live Workout & Real-Time Pose Correction

*   **Files:** `src/app/(app)/live-workout/page.tsx`, `src/components/live-workout/workout-view.tsx`
*   **Description:** This is the core feature of PoseRight-AI.
    *   **Camera Access:** It requests permission to use the device's webcam via the browser's `navigator.mediaDevices.getUserMedia` API.
    *   **Pose Detection:** Using the **MediaPipe** library, the app processes the video feed in real-time. For each frame, it detects the 3D coordinates of the user's body joints (e.g., shoulders, elbows, knees).
    *   **Skeleton Overlay:** The detected joints are drawn onto a canvas that is overlaid on top of the video feed, creating a "skeleton" that mirrors the user's movements. This provides immediate visual feedback.
    *   **Form Score & AI Feedback (In Progress):** The system analyzes the angles of the user's joints to evaluate their exercise form. For example, it checks knee and back angles during a squat to calculate a "Form Score" and provide corrective text feedback.

### 3. AI-Powered Exercise Identification

*   **Files:** `src/ai/flows/identify-exercise-flow.ts`, `src/components/live-workout/workout-view.tsx`
*   **Description:** This feature enhances the Live Workout page by automatically identifying the exercise being performed.
    *   **Genkit Flow:** A **Genkit** flow named `identifyExerciseFlow` is defined in the backend.
    *   **Data Submission:** Periodically, the pose landmark data captured by MediaPipe is sent from the client to this Genkit flow.
    *   **AI Analysis:** The flow uses the **Gemini** model to analyze the pose data. It compares the user's current pose against a predefined list of exercises (`src/lib/workouts.ts`) and returns the name of the most likely match.
    *   **UI Display:** The identified exercise name is displayed in a card on the Live Workout page, providing real-time, intelligent context.

### 4. Conversational AI Fitness Coach

*   **Files:** `src/app/(app)/ai-coach/page.tsx`, `src/components/ai-coach/chat-interface.tsx`, `src/ai/flows/ai-fitness-coach-questions.ts`
*   **Description:** The app includes a chat interface where users can ask fitness-related questions.
    *   **Genkit Flow:** This feature is powered by the `aiFitnessCoachQuestionsFlow`, which takes a user's question as input.
    *   **AI Response:** It uses the **Gemini** model, prompted to act as an expert fitness coach, to generate a helpful and informative answer.
    *   **Streaming UI:** The chat interface displays the conversation history and shows a loading state while waiting for the AI's response.

### 5. Application Layout & Dashboard

*   **Files:** `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/components/layout/app-sidebar.tsx`
*   **Description:** The application uses a nested layout structure.
    *   **Sidebar Navigation:** A collapsible sidebar allows for easy navigation between the main features: Dashboard, Live Workout, AI Coach, Schedule, and Profile.
    *   **Dashboard:** The main landing page after login, which displays progress charts and fitness tips to motivate the user. The charts are built using **Recharts**.

---

This detailed overview should give you a clear understanding of how PoseRight-AI is built and what each part of the codebase does.
