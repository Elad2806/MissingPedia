import os
import time
import logging
from flask import Blueprint, request, redirect, session, make_response, jsonify
from requests_oauthlib import OAuth2Session

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

# OAuth configuration from environment variables
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
redirect_uri = os.getenv('REDIRECT_URI')
authorization_base_url = os.getenv('AUTHORIZATION_BASE_URL')
token_url = os.getenv('TOKEN_URL')
client_url = os.getenv('CLIENT_URL')

# ...authentication routes and functions...
# @auth_bp.route('/start_wiki_oauth') ...
# @auth_bp.route('/wiki_login') ...
# def token_is_expired(token): ...
# def refresh_token_if_needed(): ...
# @auth_bp.before_app_request ...
# @auth_bp.route('/api/get-user-data') ...
# @auth_bp.route('/logout') ...


@auth_bp.route('/logout')
def logout():
    try:
        logger.info('Logging out user')
        token = session.pop('wiki_oauth_token', None)
        username = session.pop('username', None)

        if token:
            wikipedia = OAuth2Session(client_id, token=token)
            revoke_url = 'https://en.wikipedia.org/w/api.php?action=logout&format=json'
            revoke_response = wikipedia.post(revoke_url)
            
            if revoke_response.status_code == 200:
                logger.info('Successfully revoked token')
            else:
                logger.warning(f'Failed to revoke token: {revoke_response.status_code}')

        response = make_response({'message': 'Logged out successfully'})
        response.delete_cookie('username', domain=None, samesite='Lax')
        response.delete_cookie('access_token', domain=None, samesite='Lax')
        
        # Set CORS headers explicitly
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin'))
        
        return response

    except Exception as e:
        logger.error(f'Error during logout: {e}')
        return {'error': 'Error during logout'}, 500


@auth_bp.route('/start_wiki_oauth')
def start_wiki_oauth():
    try:
        logger.debug('Starting OAuth process with Wikipedia')
        wikipedia = OAuth2Session(client_id, redirect_uri=redirect_uri)
        authorization_url, state = wikipedia.authorization_url(authorization_base_url)
        session['oauth_state'] = state
        logger.debug(f'OAuth state saved: {state}')
        logger.debug(f'Authorization URL: {authorization_url}')
        return jsonify({'authorization_url': authorization_url})
    except Exception as e:
        logger.error(f'Error during OAuth start: {e}')
        return jsonify({'error': 'Failed to start OAuth process'}), 500


# Modify your wiki_callback route to include expires_at
@auth_bp.route('/wiki_login')
def wiki_callback():
    try:
        logger.info('Received callback from Wikipedia OAuth')
        logger.info(f'Request URL: {request.url}')
        
        wikipedia = OAuth2Session(client_id, redirect_uri=redirect_uri)
        token = wikipedia.fetch_token(
            token_url, 
            client_secret=client_secret, 
            authorization_response=request.url
        )
        
        # Add expires_at to token if not present
        if 'expires_at' not in token and 'expires_in' in token:
            token['expires_at'] = time.time() + float(token['expires_in'])
            
        session['wiki_oauth_token'] = token
        
        user_info = wikipedia.get('https://en.wikipedia.org/w/api.php?action=query&meta=userinfo&format=json')
        user_info_json = user_info.json()
        username = user_info_json['query']['userinfo']['name']
        session['username'] = username
        
        # Create a response to set cookies
        response = make_response(redirect(client_url))
        response.set_cookie('username', username, httponly=True, secure=True)
        response.set_cookie('access_token', token['access_token'], httponly=True, secure=True)
        
        return response
        
    except Exception as e:
        logger.error(f'Error during OAuth callback: {e}')
        return 'Error during callback', 500

def token_is_expired(token):
    """Check if the token is expired or about to expire in the next 5 minutes"""
    if not token:
        return False
    # Get expiry time from token, default to 0 if not present
    expires_at = token.get('expires_at', 0)
    # Add 5 minutes buffer
    return time.time() + 300 > expires_at

def refresh_token_if_needed():
    """Refresh the token if it exists and is expired"""
    token = session.get('wiki_oauth_token')
    
    if not token:
        return None
        
    if token_is_expired(token):
        try:
            wikipedia = OAuth2Session(client_id, token=token)
            new_token = wikipedia.refresh_token(
                token_url,
                refresh_token=token.get('refresh_token'),
                client_id=client_id,
                client_secret=client_secret
            )
            
            # Update session with new token
            session['wiki_oauth_token'] = new_token
            
            # Update cookies if needed
            if 'access_token' in request.cookies:
                response = make_response()
                response.set_cookie(
                    'access_token', 
                    new_token['access_token'], 
                    httponly=True, 
                    secure=True
                )
                
            logger.debug('Token refreshed successfully')
            return new_token
            
        except Exception as e:
            logger.error(f'Error refreshing token: {e}')
            # If refresh fails, remove the token
            session.pop('wiki_oauth_token', None)
            return None
            
    return token

@auth_bp.before_app_request
def check_token():
    """Before each request, check and refresh token if necessary"""
    # Skip token check for OAuth routes and static files
    if request.endpoint in ['start_wiki_oauth', 'wiki_callback'] or \
       request.path.startswith('/static/'):
        return
        
    refresh_token_if_needed()


@auth_bp.route('/api/get-user-data')
def get_user_data():
    username = request.cookies.get('username')
    logger.debug(f'Username from cookies: {username}')
    if username:
        return {'username': username}
    else:
        return {'error': 'No user data found'}, 401