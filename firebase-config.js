// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDz-7-z0Z5A3aTHvkeGsm4FSRwVEIP_yzo",
  authDomain: "bhaaglagam.firebaseapp.com",
  projectId: "bhaaglagam",
  storageBucket: "bhaaglagam.firebasestorage.app",
  messagingSenderId: "293261569006",
  appId: "1:293261569006:web:e0002f002c66ff0a5efcff",
  measurementId: "G-KG5142WF0G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);