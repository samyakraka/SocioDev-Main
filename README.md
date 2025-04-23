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
