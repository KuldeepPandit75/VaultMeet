from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import os
import google.generativeai as genai
from dotenv import load_dotenv
import requests
from urllib.parse import urlparse
import json

# Configure the API key
load_dotenv()
api_key = "AIzaSyBC5Ew9rmGn-ljyucOUCXp2EWsmhCC72rE"
genai.configure(api_key=api_key)

# Create the model configuration
generation_config = {
  "temperature": 0.7,  # Slightly reduced for more focused responses
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
  "response_mime_type": "application/json",
}

# No global chat sessions needed

def fetch_webpage_content(url):
    """Fetch the HTML source code of a webpage"""
    try:
        # Validate URL
        parsed_url = urlparse(url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return None, "Invalid URL format"
        
        # Set headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        # Make the request with a timeout
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        return response.text, None
    except requests.exceptions.RequestException as e:
        return None, f"Error fetching webpage: {str(e)}"
    except Exception as e:
        return None, f"Unexpected error: {str(e)}"

app = Flask(__name__)

CORS(app, resources={
    "/post-news": {"origins": ["http://localhost:3000",'https://www.vaultmeet.xyz','http://localhost:4000']},
})

# No initialization needed

@app.post("/post-news")
def post_news():
    try:
        # Get the link from the request
        data = request.get_json()
        if not data or 'link' not in data:
            return jsonify({"error": "No link provided"}), 400
        
        link = data.get("link")
        if not link:
            return jsonify({"error": "Link cannot be empty"}), 400
        
        # Fetch the webpage content
        webpage_content, error = fetch_webpage_content(link)
        if error:
            return jsonify({"error": error}), 400
        
        # Create a new Gemini model instance for this request
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
            system_instruction="user will give you whole website source code of any news page, you have to return the title, description, imageUrl, source, date, category of the news in json format if anything is not found return null, if category (must be single only) not found judge it from the title",
        )
        
        # Send the webpage content to Gemini for news extraction
        response = model.generate_content(webpage_content)
        
        try:
            # Parse the JSON response from Gemini
            news_data = json.loads(response.text)
            return jsonify({**news_data, "link": link})
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw response
            return jsonify({"answer": response.text})
            
    except Exception as e:
        print(f"Error in post_news: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=5000)