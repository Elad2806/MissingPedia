import React from "react";
import "./Footer.css"; // Optional, for external styling

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>
          &copy; 2024 MissingPedia. Made by Elad David. Mail for contact: eladd.wikimedia@gmail.com
          <br />
          <a href="https://github.com/Elad2806/MissingPedia" target="_blank" rel="noopener noreferrer">
            Visit the GitHub Repository
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
