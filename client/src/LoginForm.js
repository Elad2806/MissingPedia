import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './Firebase';
import './loginform.css';
import { IoIosMail } from "react-icons/io";
import { FcGoogle } from "react-icons/fc";
import { FaWikipediaW } from "react-icons/fa";

export const LoginForm = ({wikipediaUsername, setWikipediaUsername}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);


  useEffect(() => {
    const handleWikiLogin = async () => {
      // Access the query parameters directly from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get('username');
      const token = urlParams.get('token');

      if (username && token) {
        // Here you can set the username in your component's state
        setWikipediaUsername(username);
        // Optionally, store the token or use it to fetch more user data
        console.log('Wikipedia OAuth login successful', username, token);
      }
    };

    handleWikiLogin();
  }, []); // Empty dependency array to run only once on component mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await addUserToFirestore(userCredential.user);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert(`Authentication error: ${error.message}`);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await addUserToFirestore(userCredential.user);
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert(`Google Sign-In error: ${error.message}`);
    }
  };

  const addUserToFirestore = async (user) => {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        inventory: [],
      });
    } catch (error) {
      console.error('Error adding user to Firestore:', error);
    }
  };

  const handleWikipediaSignIn = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/start_wiki_oauth`);
      const data = await response.json();
      console.log('Wikipedia OAuth data:', data);
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('Wikipedia Sign-In error:', error);
      alert(`Wikipedia Sign-In error: ${error.message}`);
    }
  };

  return (
    <div id="loginSection" className="form-container">
      {showEmailSignIn ? (
        <>
          <form id="loginForm" onSubmit={handleSubmit}>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="input-field"
            />
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="input-field"
            />
            <div className="button-row">
              <button type="submit" id="loginButton" className="primary-button">
                {isSignUp ? 'Sign Up' : 'Login'}
              </button>
              <a className="switch-link" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </a>
            </div>
          </form>
        </>
      ) : (
        <div className="auth-button-row">
    <button className="google-button" onClick={handleGoogleSignIn}>
      <FcGoogle className="google-icon" />
      Sign in with Google
    </button>
    <button className="email-button" onClick={() => setShowEmailSignIn(true)}>
      <IoIosMail className="email-icon" />
      Sign in with email
    </button>
    <button className="wikipedia-button" onClick={handleWikipediaSignIn}>
      <FaWikipediaW className="wikipedia-icon" />
      Sign in with Wikipedia (Soon™)
    </button>
        </div>
      )}
      {wikipediaUsername && (
        <div className="wikipedia-info">
          <h2>Welcome, {wikipediaUsername}!</h2>
        </div>
      )}
    </div>
  );
};
