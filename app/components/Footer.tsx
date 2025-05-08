"use client";

import React, { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaTwitter, FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";

// Interface for contact form data
interface ContactForm {
  email: string;
  message: string;
}

const Footer: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({ email: "", message: "" });
  const [formStatus, setFormStatus] = useState<string>("");

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Integrate with SurrealDB here
      console.log("Form submitted:", formData);
      setFormStatus("Message sent successfully!");
      setFormData({ email: "", message: "" });
    } catch (error) {
      setFormStatus("Error sending message!");
    }
  };

  // Animation variants for icons
  const iconVariants = {
    hover: { scale: 1.2, rotate: 10, transition: { duration: 0.3 } },
  };

  return (
    <footer className="blog-footer-container">
      <div className="blog-footer-content">
        {/* Logo and Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="blog-footer-brand"
        >
          <h2 className="blog-footer-logo">Blog Platform</h2>
          <p className="blog-footer-description">
            A platform to share your stories and ideas with the world.
          </p>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="blog-footer-links"
        >
          <h3 className="blog-footer-links-title">Useful Links</h3>
          <ul className="blog-footer-links-list">
            <li>
              <Link href="/about" className="blog-footer-link">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/blogs" className="blog-footer-link">
                Blogs
              </Link>
            </li>
            <li>
              <Link href="/contact" className="blog-footer-link">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="blog-footer-link">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="blog-footer-contact"
        >
          <h3 className="blog-footer-contact-title">Quick Contact</h3>
          <form onSubmit={handleSubmit} className="blog-footer-form">
            <input
              type="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="blog-footer-input"
              required
              aria-label="Email address"
            />
            <textarea
              placeholder="Your Message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="blog-footer-textarea"
              rows={3}
              required
              aria-label="Message"
            />
            <button type="submit" className="blog-footer-button">
              Send
            </button>
            {formStatus && <p className="blog-footer-form-status">{formStatus}</p>}
          </form>
        </motion.div>

        {/* Social Media */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="blog-footer-social"
        >
          <h3 className="blog-footer-social-title">Follow Us</h3>
          <div className="blog-footer-social-icons">
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              variants={iconVariants}
              whileHover="hover"
              className="blog-footer-social-icon"
            >
              <FaTwitter />
            </motion.a>
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              variants={iconVariants}
              whileHover="hover"
              className="blog-footer-social-icon"
            >
              <FaGithub />
            </motion.a>
            <motion.a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              variants={iconVariants}
              whileHover="hover"
              className="blog-footer-social-icon"
            >
              <FaLinkedin />
            </motion.a>
            <motion.a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              variants={iconVariants}
              whileHover="hover"
              className="blog-footer-social-icon"
            >
              <FaInstagram />
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Copyright */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="blog-footer-copyright"
      >
        <p>© {new Date().getFullYear()} Blog Platform. All rights reserved.</p>
      </motion.div>
    </footer>
  );
};

export default Footer;