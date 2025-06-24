from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
import json
import os
from utils.tts_generator import TTSGenerator

router = APIRouter()
tts_generator = TTSGenerator()

class TTSRequest(BaseModel):
    story_id: str
    language: str = "en-US"
    text_to_synthesize: Optional[str] = None  # If None, use the story text

@router.post("/generate-audio/")
async def generate_audio(request: TTSRequest = Body(...)):
    """
    Generate audio from story text using gTTS in the specified language
    """
    # Load stories file
    try:
        stories_file = os.path.join("data", "stories.json")
        with open(stories_file, 'r', encoding='utf-8') as f:
            stories = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading stories: {str(e)}")
    
    # Find the story
    story = next((s for s in stories if s["id"] == request.story_id), None)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Get text to synthesize
    text = request.text_to_synthesize if request.text_to_synthesize else story["text"]
    if not text:
        raise HTTPException(status_code=400, detail="No text to synthesize")
    
    # Generate audio
    try:
        audio_path = tts_generator.generate_audio(text, request.language)
        # Update story with audio info
        tts_generator.update_story_with_audio(request.story_id, audio_path, request.language)
        return {"success": True, "audio_path": audio_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

@router.get("/available-languages/")
async def get_available_languages():
    """
    Get a list of available languages for text-to-speech
    """
    return {
        "languages": [
            {"code": "en-US", "name": "English (US)"},
            {"code": "es-ES", "name": "Spanish (Spain)"},
            {"code": "fr-FR", "name": "French (France)"},
            {"code": "hi-IN", "name": "Hindi (India)"},
            {"code": "de-DE", "name": "German (Germany)"},
            {"code": "ja-JP", "name": "Japanese (Japan)"},
            {"code": "zh-CN", "name": "Chinese (Mainland China)"}
        ]
    }
