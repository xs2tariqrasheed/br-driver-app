// import * as Speech from "expo-speech";

// // Simple state management
// let isInitialized = false;
// let isSpeaking = false;
// let currentUtterance: Speech.SpeechOptions | null = null;

// // Check if speech is available
// const isSpeechAvailable = () => {
//   try {
//     return Speech && typeof Speech.speak === "function";
//   } catch {
//     return false;
//   }
// };

// export const speechManager = {
//   async initialize() {
//     if (isInitialized || !isSpeechAvailable()) return;

//     try {
//       // Pre-load speech with a silent utterance to initialize the engine
//       await Speech.speak("", {
//         language: "en-US",
//         pitch: 1.0,
//         rate: 1.0,
//         volume: 0.0, // Silent for initialization
//         onDone: () => {
//           isInitialized = true;
//         },
//       });
//     } catch (error) {
//       console.warn("Speech initialization failed:", error);
//       isInitialized = true; // Continue anyway
//     }
//   },

//   async speak(text: string) {
//     if (!isSpeechAvailable()) {
//       console.warn("Speech not available, skipping:", text);
//       return;
//     }

//     // Stop any current speech
//     if (isSpeaking) {
//       await this.stop();
//     }

//     isSpeaking = true;
//     currentUtterance = {
//       language: "en-US",
//       pitch: 1.0,
//       rate: 1.0,
//       volume: 1.0,
//       onDone: () => {
//         isSpeaking = false;
//         currentUtterance = null;
//       },
//       onStopped: () => {
//         isSpeaking = false;
//         currentUtterance = null;
//       },
//     };

//     try {
//       await Speech.speak(text, currentUtterance);
//     } catch (error) {
//       console.warn("Speech failed:", error);
//       isSpeaking = false;
//       currentUtterance = null;
//     }
//   },

//   async stop() {
//     if (isSpeaking && isSpeechAvailable()) {
//       try {
//         await Speech.stop();
//         isSpeaking = false;
//         currentUtterance = null;
//       } catch (error) {
//         console.warn("Stop speech failed:", error);
//       }
//     }
//   },

//   isCurrentlySpeaking(): boolean {
//     return isSpeaking;
//   },
// };
