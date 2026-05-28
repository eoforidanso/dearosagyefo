/**
 * Backend API Integration for Letters Page
 * This file provides functions to fetch letters from the backend API
 * and dynamically populate the frontend letters page.
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://api.dearosagyefo.com/api'; // Update with your production API URL

/**
 * Fetch all public letters from the backend
 * @param {Object} options - Filter options (category, author, search)
 * @returns {Promise<Array>} Array of letter objects
 */
async function fetchLetters(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.category) params.append('category', options.category);
    if (options.author) params.append('author', options.author);
    if (options.search) params.append('search', options.search);
    
    const url = `${API_BASE_URL}/public/letters${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const letters = await response.json();
    return letters;
  } catch (error) {
    console.error('Error fetching letters:', error);
    return [];
  }
}

/**
 * Fetch a single letter by ID
 * @param {number|string} letterId - The letter ID
 * @returns {Promise<Object>} Letter object
 */
async function fetchLetter(letterId) {
  try {
    const response = await fetch(`${API_BASE_URL}/public/letters/${letterId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const letter = await response.json();
    return letter;
  } catch (error) {
    console.error('Error fetching letter:', error);
    return null;
  }
}

/**
 * Fetch all categories with letter counts
 * @returns {Promise<Array>} Array of category objects
 */
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/public/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const categories = await response.json();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch all authors with letter counts
 * @returns {Promise<Array>} Array of author objects
 */
async function fetchAuthors() {
  try {
    const response = await fetch(`${API_BASE_URL}/public/authors`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const authors = await response.json();
    return authors;
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

/**
 * Submit a new public letter (pending approval)
 * @param {Object} letterData - Letter data to submit
 * @returns {Promise<Object>} Response object
 */
async function submitLetter(letterData) {
  try {
    const response = await fetch(`${API_BASE_URL}/public/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(letterData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting letter:', error);
    throw error;
  }
}

/**
 * Generate letter card HTML from letter data
 * @param {Object} letter - Letter object from API
 * @param {string} modalId - Modal ID for the letter
 * @returns {string} HTML string for the letter card
 */
function generateLetterCard(letter, modalId) {
  const categoryIcons = {
    'Politics': '⚖️',
    'Satire': '🎭',
    'Culture': '🎨',
    'Diaspora': '🌍',
    'Health': '🧪',
    'Environment': '🌳',
    'General': '📝'
  };
  
  const icon = categoryIcons[letter.category] || '📝';
  const readTime = Math.ceil(letter.content.replace(/<[^>]*>/g, '').length / 1000) || 3;
  
  return `
    <article class="article-standard" data-category="${letter.category}" onclick="openModal('${modalId}')">
      <div class="article-image">
        <div class="article-image-placeholder">${icon}</div>
      </div>
      <div class="article-content">
        <div class="article-meta">
          <span class="article-category ${letter.category.toLowerCase()}">${letter.category}</span>
          <span class="article-date">📅 ${letter.createdAt ? new Date(letter.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recent'}</span>
          <span class="article-read-time">⏱ ${readTime} min read</span>
        </div>
        <h3 class="article-title">${letter.subject || letter.title}</h3>
        <p class="article-excerpt">
          ${letter.summary || letter.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
        </p>
        <div class="article-author">
          <div class="author-avatar">${letter.authorName ? letter.authorName.substring(0, 2).toUpperCase() : 'AK'}</div>
          <div class="author-info">
            <div class="author-name">${letter.authorName || 'Ato_KD'}</div>
            <div class="author-title">${letter.authorTitle || 'Contributor'}</div>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * Generate modal HTML from letter data
 * @param {Object} letter - Letter object from API
 * @param {string} modalId - Modal ID for the letter
 * @param {number} letterNumber - Letter number for display
 * @returns {string} HTML string for the modal
 */
function generateLetterModal(letter, modalId, letterNumber) {
  return `
    <div class="modal-overlay" id="${modalId}" onclick="closeModalOnOverlay(event, '${modalId}')">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('${modalId}')">&times;</button>
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-letter-number">Letter ${toRomanNumeral(letterNumber)}</div>
            <h2 class="modal-title">${letter.subject || letter.title}</h2>
          </div>
        </div>
        <div class="modal-body">
          ${letter.content}
        </div>
      </div>
    </div>
  `;
}

/**
 * Convert number to Roman numeral
 * @param {number} num - Number to convert
 * @returns {string} Roman numeral
 */
function toRomanNumeral(num) {
  const romanNumerals = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' }
  ];
  
  let result = '';
  for (const { value, numeral } of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchLetters,
    fetchLetter,
    fetchCategories,
    fetchAuthors,
    submitLetter,
    generateLetterCard,
    generateLetterModal,
    toRomanNumeral
  };
}
