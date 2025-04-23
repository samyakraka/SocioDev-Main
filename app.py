from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import json
import uuid
from datetime import datetime
from gtts import gTTS
from google.generativeai import configure, GenerativeModel
import speech_recognition as sr
from dotenv import load_dotenv
from utils.tts_generator import TTSGenerator

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'static/uploads'
DATA_FOLDER = 'data'
AUDIO_FOLDER = 'static/audio'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Initialize TTS generator
tts_generator = TTSGenerator(UPLOAD_FOLDER)

# Initialize Google Generative AI with API key from environment variables
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No GEMINI_API_KEY found in environment variables")
    
configure(api_key=api_key)
model = GenerativeModel('gemini-2.0-flash')

# Load stories from JSON
def load_stories():
    try:
        with open(os.path.join(DATA_FOLDER, 'stories.json'), 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# Save stories to JSON
def save_stories(stories):
    with open(os.path.join(DATA_FOLDER, 'stories.json'), 'w') as f:
        json.dump(stories, f, indent=2)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['GET', 'POST'])
def submit():
    if request.method == 'GET':
        return render_template('submit.html')
    
    # Process form submission
    user_type = request.form.get('user_type')
    story_text = request.form.get('story_text', '')
    
    # Handle file uploads
    image_file = None
    image_analysis = ""
    if 'image' in request.files:
        image = request.files['image']
        if image.filename:
            filename = f"{uuid.uuid4()}{os.path.splitext(image.filename)[1]}"
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(image_path)
            image_file = f"uploads/{filename}"
            
            # Analyze image with Gemini
            try:
                with open(image_path, 'rb') as img_file:
                    image_data = img_file.read()
                
                # Generate text representation of image for context
                response = model.generate_content([
                    "Describe what you see in this image in a clear and concise way:",
                    image_data
                ])
                image_analysis = response.text
                
                # Add image analysis to story text if there's something meaningful
                if image_analysis and len(image_analysis) > 10:
                    story_text = story_text + "\n\nImage context: " + image_analysis
            except Exception as e:
                print(f"Image analysis error: {e}")
    
    # Handle audio processing
    audio_file = None
    audio_text = ""
    if 'audio' in request.files:
        audio = request.files['audio']
        if audio.filename:
            audio_filename = f"{uuid.uuid4()}{os.path.splitext(audio.filename)[1]}"
            audio_path = os.path.join(UPLOAD_FOLDER, audio_filename)
            audio.save(audio_path)
            audio_file = f"uploads/{audio_filename}"
            
            # Convert speech to text
            try:
                recognizer = sr.Recognizer()
                with sr.AudioFile(audio_path) as source:
                    audio_data = recognizer.record(source)
                    audio_text = recognizer.recognize_google(audio_data)
                
                if audio_text:
                    story_text = audio_text if not story_text else f"{story_text}\n\nTranscribed audio: {audio_text}"
            except Exception as e:
                print(f"Speech recognition error: {e}")
    
    # Process with AI
    story_data = {
        "id": str(uuid.uuid4()),
        "user_type": user_type,
        "text": story_text,
        "image": image_file,
        "audio": audio_file,
        "timestamp": datetime.now().isoformat(),
        "status": "pending",
        "tts_options": {
            "enabled": False,
            "language": "en-US",
            "available_languages": [
                "en-US", "es-ES", "fr-FR", "hi-IN", "de-DE", "ja-JP", "zh-CN"
            ]
        },
        "translated_audio": {}  # Initialize empty dictionary for translated audio versions
    }
    
    # Generate headline and summary using Gemini
    if story_text:
        try:
            # Add instruction to avoid asterisks in the output
            ai_prompt = f"""
            Generate a headline and summary for this story, avoid using any special characters like asterisks (*):

            {story_text}
            
            Format your response as:
            Headline: [The headline]
            Summary: [The summary]
            """
            
            response = model.generate_content(ai_prompt)
            ai_response = response.text
            
            # Parse the response to get headline and summary
            if "Headline:" in ai_response:
                headline_parts = ai_response.split("Headline:", 1)
                summary_parts = headline_parts[1].split("Summary:", 1)
                
                headline = summary_parts[0].strip()
                summary = summary_parts[1].strip() if len(summary_parts) > 1 else ""
                
                story_data["headline"] = headline
                story_data["summary"] = summary
            else:
                # Fallback if format is not as expected
                story_data["headline"] = "Story Submission"
                story_data["summary"] = story_text[:100] + "..."
        except Exception as e:
            print(f"AI processing error: {e}")
            story_data["headline"] = "Story Submission"
            story_data["summary"] = story_text[:100] + "..."
    
    # Save story
    stories = load_stories()
    stories.append(story_data)
    save_stories(stories)
    
    return redirect(url_for('review', story_id=story_data["id"]))

@app.route('/review/<story_id>')
def review(story_id):
    stories = load_stories()
    story = next((s for s in stories if s["id"] == story_id), None)
    if not story:
        return "Story not found", 404
    return render_template('review.html', story=story)

@app.route('/edit/<story_id>', methods=['POST'])
def edit_story(story_id):
    stories = load_stories()
    for i, story in enumerate(stories):
        if story["id"] == story_id:
            stories[i]["headline"] = request.form.get('headline', story["headline"])
            stories[i]["summary"] = request.form.get('summary', story["summary"])
            stories[i]["text"] = request.form.get('text', story["text"])
            stories[i]["status"] = "edited"
            save_stories(stories)
            break
    return redirect(url_for('review', story_id=story_id))

@app.route('/approve/<story_id>')
def approve_story(story_id):
    stories = load_stories()
    for i, story in enumerate(stories):
        if story["id"] == story_id:
            stories[i]["status"] = "approved"
            save_stories(stories)
            break
    return redirect(url_for('stories'))

@app.route('/stories')
def stories():
    stories = load_stories()
    # Filter to only show approved stories
    approved_stories = [s for s in stories if s["status"] == "approved"]
    return render_template('stories.html', stories=approved_stories)

@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.json
    text = data.get('text', '')
    language = data.get('language', 'en-US')
    story_id = data.get('story_id', None)
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        audio_path = tts_generator.generate_audio(text, language)
        
        # If story_id is provided, update the story with audio info
        if story_id:
            tts_generator.update_story_with_audio(story_id, audio_path, language)
        
        # Return the path relative to static folder for the web app
        relative_path = audio_path.replace('\\', '/').replace('static/', '')
        return jsonify({
            "success": True,
            "audio_url": f"/static/{relative_path}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/available-languages')
def available_languages():
    """
    Get a list of available languages for text-to-speech
    """
    return jsonify({
        "languages": [
            {"code": "en-US", "name": "English (US)"},
            {"code": "es-ES", "name": "Spanish (Spain)"},
            {"code": "fr-FR", "name": "French (France)"},
            {"code": "hi-IN", "name": "Hindi (India)"},
            {"code": "de-DE", "name": "German (Germany)"},
            {"code": "ja-JP", "name": "Japanese (Japan)"},
            {"code": "zh-CN", "name": "Chinese (Mainland China)"}
        ]
    })

@app.route('/generate-audio/', methods=['POST'])
def generate_audio():
    """Generate audio from story text using gTTS in the specified language"""
    data = request.json
    story_id = data.get('story_id')
    language = data.get('language', 'en-US')
    text_to_synthesize = data.get('text_to_synthesize')
    
    if not story_id:
        return jsonify({"success": False, "detail": "No story ID provided"}), 400
    
    # Load stories
    try:
        stories = load_stories()
    except Exception as e:
        return jsonify({"success": False, "detail": f"Error loading stories: {str(e)}"}), 500
    
    # Find the story
    story = next((s for s in stories if s["id"] == story_id), None)
    if not story:
        return jsonify({"success": False, "detail": "Story not found"}), 404
    
    # Get text to synthesize
    text = text_to_synthesize if text_to_synthesize else story["text"]
    if not text:
        return jsonify({"success": False, "detail": "No text to synthesize"}), 400
    
    # If the language is not English, use the Gemini model to translate the text
    original_language = story.get("tts_options", {}).get("language", "en-US")
    if language != "en-US" and language != original_language:
        try:
            language_names = {
                "en-US": "English",
                "es-ES": "Spanish",
                "fr-FR": "French",
                "hi-IN": "Hindi",
                "de-DE": "German",
                "ja-JP": "Japanese",
                "zh-CN": "Chinese"
            }
            
            target_language = language_names.get(language, "the target language")
            
            # For Hindi, just ensure we're asking for Hindi translation in Devanagari script
            if language == "hi-IN":
                prompt = "Translate the following text into Hindi using Devanagari script:\n\n" + text
            else:
                prompt = f"Translate the following text into {target_language}:\n\n{text}"
            
            response = model.generate_content(prompt)
            translated_text = response.text
            
            # Use the translated text
            text = translated_text
        except Exception as e:
            print(f"Translation error: {e}")
            # Continue with original text if translation fails
    
    # Generate audio
    try:
        audio_path = tts_generator.generate_audio(text, language)
        # Update story with audio info
        tts_generator.update_story_with_audio(story_id, audio_path, language)
        return jsonify({"success": True, "audio_path": audio_path})
    except Exception as e:
        return jsonify({"success": False, "detail": f"Error generating audio: {str(e)}"}), 500

@app.route('/translate-story', methods=['POST'])
def translate_story():
    """Translate a story text to another language using Gemini AI"""
    data = request.json
    text = data.get('text', '')
    target_language = data.get('target_language', 'en-US')
    
    if not text:
        return jsonify({"success": False, "detail": "No text provided"}), 400
    
    language_names = {
        "en-US": "English",
        "es-ES": "Spanish",
        "fr-FR": "French",
        "hi-IN": "Hindi",
        "de-DE": "German",
        "ja-JP": "Japanese",
        "zh-CN": "Chinese"
    }
    
    language_name = language_names.get(target_language, "the specified language")
    
    try:
        # Create prompt for translation
        prompt = f"""Translate the following text into {language_name}. 
        Keep the meaning intact but make it sound natural in the target language:
        
        {text}
        """
        
        # Get translation from Gemini
        response = model.generate_content(prompt)
        translated_text = response.text
        
        return jsonify({
            "success": True, 
            "translated_text": translated_text
        })
    except Exception as e:
        return jsonify({
            "success": False, 
            "detail": f"Translation error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
