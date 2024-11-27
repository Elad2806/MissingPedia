import logging
import os
from flask import Blueprint, request, jsonify, session
from requests_oauthlib import OAuth2Session

watchlist_bp = Blueprint('watchlist', __name__)
logger = logging.getLogger(__name__)

# OAuth configuration from environment variables
client_id = os.getenv('CLIENT_ID')

@watchlist_bp.route('/fetch_watchlist', methods=['GET'])
def fetch_watchlist():
    try:
        token = session.get('wiki_oauth_token')
        if not token:
            logger.error('User not authenticated or token missing')
            return jsonify({'error': 'User not authenticated'}), 401

        logger.debug(f'Fetching watchlist for user {session.get("username")}')
        wikipedia = OAuth2Session(client_id, token={'access_token': token['access_token']})

        # API endpoint for watchlist
        api_url = 'https://en.wikipedia.org/w/api.php'

        # Parameters for the watchlist query
        params = {
            'action': 'query',
            'format': 'json',
            'list': 'watchlist',
            'wltype': 'edit|new',
            'wllimit': 'max'  # Get maximum number of results
        }

        # Make the API request
        response = wikipedia.get(api_url, params=params)
        logger.debug(f'Response status: {response.status_code}')
        logger.debug(f'Response content: {response.text}')

        if response.status_code != 200:
            logger.error(f'Failed to fetch watchlist: {response.text}')
            return jsonify({'error': 'Failed to fetch watchlist'}), 500

        watchlist_data = response.json()
        if 'query' in watchlist_data and 'watchlist' in watchlist_data['query']:
            watchlist_titles = [item['title'] for item in watchlist_data['query']['watchlist']]
            return jsonify({'watchlist': watchlist_titles})
        else:
            logger.error('Watchlist data is missing from the response')
            return jsonify({'error': 'Watchlist data missing'}), 500

    except Exception as e:
        logger.error(f'Error fetching watchlist: {e}')
        return jsonify({'error': 'Failed to fetch watchlist'}), 500


@watchlist_bp.route('/remove_from_watchlist', methods=['POST'])
def remove_from_inventory():
    try:
        # Try cookies first, then fall back to session
        access_token = request.cookies.get('access_token')
        if not access_token and 'wiki_oauth_token' in session:
            access_token = session['wiki_oauth_token']['access_token']
            
        if not access_token:
            logger.error('User not authenticated or token missing')
            return jsonify({'error': 'User not authenticated'}), 401
        logger.debug(f"content of request {request.json}")
        title_to_remove = request.json.get('title').get('source_title')
        logger.debug(f'Title to remove: {title_to_remove}')
        if not title_to_remove:
            logger.warning('No title provided in the request')
            return jsonify({'error': 'No title provided'}), 400

        # Create Wikipedia session with proper headers
        wikipedia = OAuth2Session(client_id)
        wikipedia.headers.update({
            'User-Agent': 'MissingpediaToolforge/1.0',
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json'
        })

        api_url = 'https://en.wikipedia.org/w/api.php'
        
        # Try to get a watch token instead of csrf token
        token_params = {
            'action': 'query',
            'meta': 'tokens',
            'type': 'watch',  # Changed from csrf to watch
            'format': 'json'
        }
        
        token_response = wikipedia.get(api_url, params=token_params)
        logger.debug(f'Token response: {token_response.text}')
        
        try:
            watch_token = token_response.json()['query']['tokens']['watchtoken']
            logger.debug(f'Got watch token: {watch_token[:5]}...')
        except (KeyError, TypeError) as e:
            logger.error(f'Failed to extract watch token: {e}')
            return jsonify({'error': 'Failed to retrieve watch token'}), 500

        # Remove from watchlist using watch token
        remove_data = {
            'action': 'watch',
            'format': 'json',
            'titles': title_to_remove,
            'unwatch': '1',
            'token': watch_token
        }

        remove_response = wikipedia.post(
            api_url,
            data=remove_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        logger.debug(f'Unwatch response: {remove_response.text}')

        response_json = remove_response.json()
        if 'error' not in response_json:
            logger.info(f'Successfully removed {title_to_remove} from watchlist')
            return jsonify({'success': True, 'message': f'{title_to_remove} removed from watchlist'})
        else:
            error_info = response_json.get('error', {})
            logger.error(f'API Error: {error_info}')
            return jsonify({
                'error': 'Failed to remove from watchlist',
                'details': error_info.get('info', 'Unknown error')
            }), 500

    except Exception as e:
        logger.error(f'Error removing from watchlist: {e}', exc_info=True)
        return jsonify({'error': 'Failed to remove from watchlist'}), 500


@watchlist_bp.route('/add_to_watchlist', methods=['POST'])
def add_to_watchlist():
    try:
        # Try cookies first, then fall back to session
        access_token = request.cookies.get('access_token')
        if not access_token and 'wiki_oauth_token' in session:
            access_token = session['wiki_oauth_token']['access_token']
            
        if not access_token:
            logger.error('User not authenticated or token missing')
            return jsonify({'error': 'User not authenticated'}), 401

        article_data = request.json.get('title')
        if not article_data:
            logger.warning('No article data provided in the request')
            return jsonify({'error': 'No article data provided'}), 400

        # Extract the title from the article object
        if isinstance(article_data, dict):
            title_to_add = article_data.get('source_title')
        else:
            title_to_add = article_data  # Fallback if a simple string is provided

        if not title_to_add:
            logger.warning('Could not extract title from article data')
            return jsonify({'error': 'No valid title found in article data'}), 400

        # Create Wikipedia session with proper headers
        wikipedia = OAuth2Session(client_id)
        wikipedia.headers.update({
            'User-Agent': 'MissingpediaToolforge/1.0',
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json'
        })

        api_url = 'https://en.wikipedia.org/w/api.php'
        
        # Get watch token
        token_params = {
            'action': 'query',
            'meta': 'tokens',
            'type': 'watch',
            'format': 'json'
        }
        
        token_response = wikipedia.get(api_url, params=token_params)
        logger.debug(f'Token response: {token_response.text}')
        
        try:
            watch_token = token_response.json()['query']['tokens']['watchtoken']
            logger.debug(f'Got watch token: {watch_token[:5]}...')
        except (KeyError, TypeError) as e:
            logger.error(f'Failed to extract watch token: {e}')
            return jsonify({'error': 'Failed to retrieve watch token'}), 500

        # Add to watchlist using watch token
        add_data = {
            'action': 'watch',
            'format': 'json',
            'titles': title_to_add,
            'token': watch_token
        }

        add_response = wikipedia.post(
            api_url,
            data=add_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        logger.debug(f'Watch response: {add_response.text}')

        response_json = add_response.json()
        if 'error' not in response_json:
            logger.info(f'Successfully added {title_to_add} to watchlist')
            return jsonify({'success': True, 'message': f'{title_to_add} added to watchlist'})
        else:
            error_info = response_json.get('error', {})
            logger.error(f'API Error: {error_info}')
            return jsonify({
                'error': 'Failed to add to watchlist',
                'details': error_info.get('info', 'Unknown error')
            }), 500

    except Exception as e:
        logger.error(f'Error adding to watchlist: {e}', exc_info=True)
        return jsonify({'error': 'Failed to add to watchlist'}), 500