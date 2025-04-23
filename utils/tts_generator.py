from gtts import gTTS
import os
import uuid
import json
import time

class TTSGenerator:
    """
    Class to handle text-to-speech functionality for stories
    """
    
    def __init__(self, upload_dir="uploads"):
        """
        Initialize the TTS generator
        
        Args:
            upload_dir (str): Directory to save generated audio files
        """
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        
    def generate_audio(self, text, language="en-US"):
        """
        Generate audio from text using gTTS
        
        Args:
            text (str): Text to convert to speech
            language (str): Language code for speech generation
            
        Returns:
            str: Path to the generated audio file
        """
        # Map our language codes to gTTS supported codes
        language_mapping = {
            "en-US": "en",
            "es-ES": "es",
            "fr-FR": "fr",
            "hi-IN": "hi",
            "de-DE": "de",
            "ja-JP": "ja",
            "zh-CN": "zh-CN"
        }
        
        # Use the mapped language code or default to English if not found
        gtts_lang = language_mapping.get(language, "en")
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(self.upload_dir, filename)
        
        # Generate audio file - no special handling needed, just use the mapped language code
        tts = gTTS(text=text, lang=gtts_lang, slow=False)
        tts.save(filepath)
        
        return filepath
    
    def update_story_with_audio(self, story_id, audio_path, language, stories_file="data/stories.json"):
        """
        Update a story with generated audio information
        
        Args:
            story_id (str): ID of the story to update
            audio_path (str): Path to the audio file
            language (str): Language used for TTS
            stories_file (str): Path to the stories JSON file
        """
        # Read stories file
        try:
            with open(stories_file, 'r', encoding='utf-8') as f:
                stories = json.load(f)
        except FileNotFoundError:
            # Create an empty list if the file doesn't exist
            stories = []
        except json.JSONDecodeError:
            # Re-initialize if file is corrupted
            stories = []
            
        # Find and update the story
        story_updated = False
        for story in stories:
            if story["id"] == story_id:
                # Initialize tts_options if not present
                if "tts_options" not in story:
                    story["tts_options"] = {
                        "enabled": False,
                        "language": language,
                        "available_languages": [
                            "en-US", "es-ES", "fr-FR", "hi-IN", "de-DE", 
                            "ja-JP", "zh-CN"
                        ]
                    }
                
                # Keep track of different language audio versions
                if not hasattr(story, "translated_audio"):
                    story["translated_audio"] = {}
                    
                # Store the current language audio path
                story["translated_audio"][language] = audio_path
                
                # Set the main audio to the current language
                story["audio"] = audio_path
                story["tts_options"]["enabled"] = True
                story["tts_options"]["language"] = language
                story_updated = True
                break
        
        if not story_updated:
            print(f"Warning: Story with ID {story_id} not found")
        
        # Save updated stories
        with open(stories_file, 'w', encoding='utf-8') as f:
            json.dump(stories, f, indent=2)

