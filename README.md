<<<<<<< HEAD
# SocioDev

<p align="center">
  <img src="./assets/images/icon.png" alt="SocioDev Logo" width="120" height="120" />
</p>

<p align="center">
  A social media platform for developers to share articles, connect, and grow their network.
</p>

## 📱 About SocioDev

SocioDev is a mobile application built with React Native and Expo that allows developers to share knowledge, post articles, and connect with other developers. The platform includes features like user profiles, article publishing, bookmarking, following users, and AI-powered content generation.

## ✨ Features

### 👤 User Profiles

- Custom user profiles with profile pictures
- Add social media links (GitHub, LinkedIn, Portfolio website)
- Follow other developers
- View follower/following counts

### 📝 Article Management

- Create, edit, and delete articles
- Add cover images to articles
- Tag articles for better categorization
- View trending and recent articles

### 🔖 Bookmarks

- Save interesting articles for later
- Dedicated bookmarks tab for easy access
- Track articles you've saved

### 🤖 AI-Powered Content Generation

- Generate article drafts using AI
- Get AI-suggested titles, content, and tags
- Quickly jumpstart your writing process

### 🔍 Search & Discovery

- Search articles by title, content, or tags
- Discover trending articles
- Explore articles from followed users

## 🛠️ Technology Stack

- **Frontend**: React Native, Expo Router
- **UI Components**: Custom themed components, Tailwind CSS (NativeWind)
- **State Management**: React Context API
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI Integration**: Google Gemini AI API

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Firebase account](https://firebase.google.com/)
- [Google Gemini API key](https://ai.google.dev/) (optional, for AI features)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/SocioDev.git
   cd SocioDev
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Firebase and Gemini API credentials:

   ```
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

## 📱 App Navigation

- **Home Tab**: View feed of articles
- **Explore Tab**: Discover new content and users
- **Upload Tab**: Create and publish new articles
- **Bookmarks Tab**: Access saved articles
- **Profile Tab**: View and edit your profile

## 🔑 Key Features Explained

### Authentication

SocioDev uses Firebase Authentication for user management. The app includes:

- Email/password registration and sign-in
- Persistent authentication state
- Profile management

### Article Publishing

Users can create articles with:

- Title and content
- Cover images
- Tags for categorization
- AI-assisted content generation

### Social Features

- Follow other users
- View user profiles
- See follower/following counts
- Browse articles by specific users

### Bookmarking System

- Save articles to your personal bookmarks
- Track articles' saved count
- Quick access to bookmarked content

## 🧩 Main Components

### ThemedView and ThemedText

Custom components that adapt to the device's color scheme (dark/light mode) for consistent UI presentation.

### Article Cards

Reusable components for displaying article previews in various contexts (home feed, profile, bookmarks).

### Profile Card

Component displaying user information, including profile picture, username, email, and social links.

## 🧠 AI Integration

SocioDev integrates with Google's Gemini AI to help users generate article content. This feature:

1. Takes a topic idea from the user
2. Generates a title, content, and tags
3. Populates the article form with generated content
4. Allows users to edit before publishing

## 🔄 Data Flow

1. Firebase stores all user and article data
2. React Context provides authentication and user data to components
3. Service functions handle data CRUD operations
4. UI components display and allow interaction with data

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/SocioDev](https://github.com/yourusername/SocioDev)
=======
# Voice Frame

Voice Frame is a web application that enables users to share stories and experiences through text, images, and audio. The platform supports multilingual text-to-speech conversion, allowing stories to reach a wider audience across language barriers.

## Features

- **Story Submission**: Submit stories as an NGO representative, volunteer, or individual
- **Media Support**: Upload images or record audio to enhance your stories
- **AI-Powered Processing**: Automatic generation of headlines and summaries for stories
- **Text-to-Speech**: Convert stories to spoken audio in multiple languages
- **Translation Support**: Translate stories to various languages using AI
- **Story Management**: Review, edit, and approve stories before publishing

## Technology Stack

- **Backend**: Python with Flask framework
- **AI Services**: Google Generative AI (Gemini model)
- **Text-to-Speech**: gTTS (Google Text-to-Speech)
- **Speech Recognition**: SpeechRecognition library
- **Frontend**: HTML, CSS, JavaScript

## Installation

### Prerequisites

- Python 3.7 or higher
- pip package manager

### Setup Steps

1. Clone the repository (or download the source code)

2. Navigate to the project directory:

   ```
   cd VoiceFrame
   ```

3. Install required dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root with your Google Generative AI API key:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Run the application:

   ```
   python app.py
   ```

6. Access the application at `http://localhost:5000`

## Configuration

The application uses the following environment variables:

- `GEMINI_API_KEY`: API key for Google's Generative AI (Gemini model)

## Usage

### Submitting a Story

1. Click on "Share Your Story" on the homepage
2. Select your user type (NGO, Volunteer, or Individual)
3. Enter your story text
4. Optionally upload an image or record audio
5. Submit your story for review

### Reviewing and Publishing

1. After submission, you'll be directed to the review page
2. You can edit your headline, summary, or story text
3. Generate audio in different languages
4. Approve and publish your story

### Browsing Stories

1. Navigate to the "View Stories" section
2. Filter stories by category or language
3. Listen to audio versions in available languages
4. Share stories with others

## Available Languages

Voice Frame supports text-to-speech conversion in the following languages:

- English (US)
- Spanish (Spain)
- French (France)
- Hindi (India)
- German (Germany)
- Japanese (Japan)
- Chinese (Mainland China)

## Project Structure

- `app.py`: Main application file
- `utils/`: Utility functions including the TTS generator
- `templates/`: HTML templates for the web interface
- `static/`: Static assets including CSS and uploaded media
- `data/`: JSON data storage for stories
- `api/`: API endpoints for the application

## API Endpoints

The application provides the following API endpoints:

- `/text-to-speech`: Generate audio from text
- `/generate-audio/`: Generate translated audio for a story
- `/available-languages`: Get a list of available languages
- `/translate-story`: Translate a story text to another language

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Google Generative AI for AI-powered headline and summary generation
- gTTS for text-to-speech conversion
>>>>>>> 0059b453678cafb9daaded97f83f35179960229d
