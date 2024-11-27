import requests
from flask import Flask, jsonify, request, redirect, session, make_response
from flask_cors import CORS
import psycopg2
import os
from requests_oauthlib import OAuth2Session
import logging
from flask_session import Session
from flask import Flask, send_from_directory
from dotenv import load_dotenv
import time
# Load environment variables from .env file
load_dotenv()
# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='react_build')
# Configure CORS properly
CORS(app, 
     resources={
         r"/*": {
             "origins": ["http://localhost:3001", "https://missingpedia.toolforge.org", "http://localhost:3000"],
             "supports_credentials": True,
             "allow_headers": ["Content-Type", "Authorization"],
             "methods": ["GET", "POST", "OPTIONS"]
         }
     })
app.secret_key = os.environ.get('SECRET_KEY', 1234321)
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
# OAuth configuration from environment variables
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
redirect_uri = os.getenv('REDIRECT_URI')
authorization_base_url = os.getenv('AUTHORIZATION_BASE_URL')
token_url = os.getenv('TOKEN_URL')
client_url = os.getenv('CLIENT_URL')

# Register Blueprints
from auth import auth_bp
from articles import articles_bp
from categories import categories_bp
from watchlist import watchlist_bp

app.register_blueprint(auth_bp)
app.register_blueprint(articles_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(watchlist_bp)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)


# ...existing route definitions...

if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    logger.info('Starting Flask app')
    app.run(debug=True, port=3000)
