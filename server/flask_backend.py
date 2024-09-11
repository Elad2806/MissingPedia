import requests
from flask import Flask, jsonify, request, redirect, session
from flask_cors import CORS
import psycopg2
import os
from requests_oauthlib import OAuth2Session
import logging
from flask_session import Session
from flask import Flask, send_from_directory
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()
# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='react_build')
CORS(app, supports_credentials=True, origins=["http://localhost:3001", "https://missingpedia.toolforge.org"])
app.secret_key = os.environ.get('SECRET_KEY', 1234321)
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
# OAuth configuration from environment variables
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
redirect_uri = os.getenv('REDIRECT_URI')
authorization_base_url = os.getenv('AUTHORIZATION_BASE_URL')
token_url = os.getenv('TOKEN_URL')


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



def get_db_connection():
    # Retrieve the connection details from environment variables
    host = os.getenv('DB_HOST')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    dbname = os.getenv('DB_NAME')

    # Connect to the database
    try:
        connection = psycopg2.connect(
            host=host,
            user=user,
            password=password,
            dbname=dbname
        )
        print("Database connection successful")
        return connection
    except Exception as e:
        print("Error connecting to the database:", e)
        return None


@app.route('/api/search_categories', methods=['GET'])
def search_categories():
    try:
        # Get the query parameters
        categories = request.args.get('categories', '2010s_deaths').split(',')
        task = request.args.get('task', 'expand')  # Default to 'create' if not provided

        # Debugging: print the received parameters
        print(f"Categories: {categories}")
        print(f"Task: {task}")

        # Connect to the database
        conn = get_db_connection()
        cur = conn.cursor()

        # Depending on the task, call the appropriate function
        if task == 'create':
            print("Calling create_articles function")
            # Call create_articles function here
            return create_articles(conn, cur, categories)
        else:
            print("Calling expand_articles function")
            # Call expand_articles function here
            return expand_articles(conn, cur, categories,'en')

    except Exception as e:
        # Log the error message
        print(f"Error in search_categories: {str(e)}")
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500


def create_articles(conn, cur, categories):
    categories_placeholders = ', '.join(['%s'] * len(categories))

    sql_query = f"""
    WITH  RECURSIVE CategoryHierarchy AS (
        SELECT
            c.category_id::text AS category_id,
            c.category_title,
            c.language,
            0 AS depth
        FROM
            categories c
        WHERE
            c.category_title::text IN ({categories_placeholders})

        UNION ALL

        SELECT
            cl.subcategory::text AS category_id,
            c.category_title,
            c.language,
            ch.depth + 1 AS depth
        FROM
            CategoryHierarchy ch
        JOIN
            category_links cl ON ch.category_title::text = cl.parent_category::text AND ch.language = cl.language
        JOIN
            categories c ON cl.subcategory::text = c.category_id::text AND c.language = cl.language
        WHERE
            ch.depth < 2
    ),

    PagesOfInterest AS (
        SELECT DISTINCT a.page_id, a.title, a.length, a.view_count,
            ROUND(a.view_count::float / a.length * 100) / 100 AS len_views_ratio,
            COUNT(*) OVER () AS distinct_page_count
        FROM test_db.public.page_cat_link pcl
        INNER JOIN test_db.public.articles a ON pcl.page_id = a.page_id
        WHERE a.language = 'en'
        AND (pcl.category, pcl.language) IN (SELECT category_title, language FROM CategoryHierarchy)
        AND a.view_count IS NOT NULL
        LIMIT 170000
    )

    SELECT *
    FROM PagesOfInterest tpi
    WHERE NOT EXISTS (
        SELECT 1
        FROM test_db.public.langlinks ll
        WHERE ll.ll_lang = 'en' AND REPLACE(tpi.title, '_', ' ') = ll.ll_title

    )
    ORDER BY len_views_ratio DESC
    LIMIT 500;


    """

    cur.execute(sql_query, categories)
    results = cur.fetchall()

    distinct_pages_count = results[0][5] if results else 0  # Getting the distinct pages count from the first row

    articles = []
    for row in results:
        articles.append({
            'page_id': row[0],
            'title': row[1],
            'contentLength': row[2],
            'views': row[3],
            'len_views_ratio': row[4]
        })

    cur.close()
    conn.close()
    print(articles)
    response = {
        'articles': articles,
        'distinct_pages_count': distinct_pages_count
    }
    return jsonify(response)


def expand_articles(conn, cur, categories, target_language):
    categories_placeholders = ', '.join(['%s'] * len(categories))

    sql_query = f"""
    WITH RECURSIVE CategoryHierarchy AS (
        SELECT
            c.category_id::text AS category_id,
            c.category_title,
            c.language,
            0 AS depth
        FROM
            test_db.public.categories c
        WHERE
            c.category_title IN ({categories_placeholders})

        UNION ALL

        SELECT
            cl.subcategory::text AS category_id,
            c.category_title,
            c.language,
            ch.depth + 1 AS depth
        FROM
            CategoryHierarchy ch
        JOIN
            test_db.public.category_links cl ON ch.category_title::text = cl.parent_category::text AND ch.language = cl.language
        JOIN
            test_db.public.categories c ON cl.subcategory::text = c.category_id::text AND c.language = cl.language
        WHERE
            ch.depth < 2
    ),

    PagesOfInterest AS (
        SELECT DISTINCT a.page_id, a.title, a.length, a.view_count, a.language,
            ROUND(a.view_count::float / a.length * 100) / 100 AS len_views_ratio,
            COUNT(*) OVER () AS distinct_page_count
        FROM test_db.public.page_cat_link pcl
        INNER JOIN test_db.public.articles a ON pcl.page_id = a.page_id
        WHERE a.language = %s
        AND (pcl.category, pcl.language) IN (SELECT category_title, language FROM CategoryHierarchy)
        AND a.view_count IS NOT NULL
        LIMIT 100
    ),

    OtherLanguagesData AS (
        SELECT  
            tpi.page_id as source_id,
            tpi.title as source_title,
            tpi.length as source_length, 
            tpi.view_count as source_views,
            tpi.len_views_ratio,
            tpi.language as source_language,
            ll.ll_from_lang as other_language,
            ll.ll_from as other_id,
            a.length as other_length, 
            a.view_count as other_views, 
            a.title as other_title,
            distinct_page_count
        FROM PagesOfInterest tpi 
        INNER JOIN test_db.public.lang_links ll ON tpi.title = ll.ll_title and tpi.language = ll.ll_lang
        INNER JOIN test_db.public.articles a ON ll.ll_from_lang = a.language AND ll.ll_from = a.page_id
        ORDER BY tpi.len_views_ratio DESC
        LIMIT 500
    )

    SELECT *
    FROM OtherLanguagesData
    """

    cur.execute(sql_query, categories + [target_language])
    results = cur.fetchall()

    articles = {}
    distinct_pages_count = results[0][-1] if results else 0

    for row in results:
        source_id = row[0]
        if source_id not in articles:
            articles[source_id] = {
                'source_id': source_id,
                'source_title': row[1],
                'source_length': row[2],
                'source_views': row[3],
                'len_views_ratio': row[4],
                'source_language': row[5],
                'other_languages': []
            }
        
        articles[source_id]['other_languages'].append({
            'language': row[6],
            'id': row[7],
            'length': row[8],
            'views': row[9],
            'title': row[10]
        })

    response = {
        'articles': list(articles.values()),
        'distinct_pages_count': distinct_pages_count
    }
    print("response",response)
    cur.close()
    conn.close()
    
    return jsonify(response)


@app.route('/api/suggest_categories', methods=['POST'])
def suggest_categories():
    data = request.json
    print(data)
    recommendation_type = data.get('recommendationType')

    if recommendation_type == 'inventory':
        articles = data.get('articles', [])
        if not articles:
            return jsonify({"error": "No articles provided"}), 400
        suggested_categories = generate_category_suggestions(articles)
    elif recommendation_type == 'editHistory':
        wikipedia_username = data.get('wikipediaUsername')
        if not wikipedia_username:
            return jsonify({"error": "No Wikipedia username provided"}), 400
        suggested_categories = generate_suggestions_from_edit_history(wikipedia_username)
    else:
        return jsonify({'error': 'Invalid recommendation type'}), 400

    return jsonify({"categories": suggested_categories})


def get_article_categories(article_title):
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": article_title,
        "prop": "categories",
        "format": "json",
        "cllimit": "max"
    }

    response = requests.get(url, params=params)
    data = response.json()

    categories = []
    pages = data.get("query", {}).get("pages", {})
    for page_id, page_info in pages.items():
        if "categories" in page_info:
            categories.extend([cat["title"] for cat in page_info["categories"]])

    return categories


def contains_ignored_words(category):
    ignored_words = ['articles', 'Wikipedia', 'Description']
    for word in ignored_words:
        if word.lower() in category.lower():
            return True
    return False


def generate_category_suggestions(articles):
    category_count = {}
    for article in articles:
        categories = get_article_categories(article)
        for category in categories:
            if contains_ignored_words(category):
                continue
            if category in category_count:
                category_count[category] += 1
            else:
                category_count[category] = 1

    sorted_categories = sorted(category_count.items(), key=lambda item: item[1], reverse=True)
    top_suggestions = [category for category, count in sorted_categories[:10]]
    print(top_suggestions)
    return top_suggestions


def get_user_edit_history(username):
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "usercontribs",
        "ucuser": username,
        "uclimit": "100",
        "format": "json"
    }

    response = requests.get(url, params=params)
    data = response.json()

    edit_history = []
    for edit in data.get("query", {}).get("usercontribs", []):
        edit_history.append(edit["title"])

    return edit_history


def generate_suggestions_from_edit_history(username):
    edit_history = get_user_edit_history(username)
    category_count = {}

    for article_title in edit_history:
        categories = get_article_categories(article_title)
        for category in categories:
            if contains_ignored_words(category):
                continue
            if category in category_count:
                category_count[category] += 1
            else:
                category_count[category] = 1

    sorted_categories = sorted(category_count.items(), key=lambda item: item[1], reverse=True)
    top_suggestions = [category for category, count in sorted_categories[:10]]

    return top_suggestions


@app.route('/start_wiki_oauth')
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


@app.route('/wiki_login')
def wiki_callback():
    try:
        logger.info('Received callback from Wikipedia OAuth')
        wikipedia = OAuth2Session(client_id, redirect_uri=redirect_uri)
        token = wikipedia.fetch_token(token_url, client_secret=client_secret,
                                      authorization_response=request.url)
        session['wiki_oauth_token'] = token
        logger.debug(f'OAuth token received: {token}')

        # Use the token to fetch the user's information
        user_info = wikipedia.get('https://en.wikipedia.org/w/api.php?action=query&meta=userinfo&format=json')
        user_info_json = user_info.json()
        username = user_info_json['query']['userinfo']['name']
        logger.debug(f'User info received: {username}')
        session['username'] = username
        # Redirect to frontend with query parameters
        return redirect(f'http://localhost:3001/wiki_login?username={username}&token={token["access_token"]}')
    except Exception as e:
        logger.error(f'Error during OAuth callback: {e}')
        return jsonify({'error': 'Failed to complete OAuth process'}), 500


@app.route('/fetch_watchlist', methods=['GET'])
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


@app.route('/remove_from_watchlist', methods=['POST'])
def remove_from_inventory():
    try:
        # Check if user is authenticated
        token = session.get('wiki_oauth_token')
        if not token:
            logger.error('User not authenticated or token missing')
            return jsonify({'error': 'User not authenticated'}), 401

        # Get the title to remove from the request
        data = request.json
        title_to_remove = data.get('title')
        if not title_to_remove:
            return jsonify({'error': 'No title provided'}), 400

        # Initialize session
        s = requests.Session()

        # Step 1: Get login token
        r1 = s.get('https://en.wikipedia.org/w/api.php', params={
            'action': 'query',
            'meta': 'tokens',
            'type': 'login',
            'format': 'json'
        })

        login_token = r1.json()['query']['tokens']['logintoken']

        # Step 2: Send a POST request to log in
        r2 = s.post('https://en.wikipedia.org/w/api.php', data={
            'action': 'clientlogin',
            'username': session.get('username'),
            'password': token['access_token'],  # Use the access token as the password
            'logintoken': login_token,
            'loginreturnurl': 'http://localhost:3000/',
            'format': 'json'
        })

        if r2.json()['clientlogin']['status'] != 'PASS':
            logger.error('Failed to log in')
            return jsonify({'error': 'Failed to authenticate'}), 401

        # Step 3: Get CSRF token
        r3 = s.get('https://en.wikipedia.org/w/api.php', params={
            'action': 'query',
            'meta': 'tokens',
            'format': 'json'
        })

        csrf_token = r3.json()['query']['tokens']['csrftoken']

        # Step 4: Remove the page from the watchlist
        r4 = s.post('https://en.wikipedia.org/w/api.php', data={
            'action': 'watch',
            'titles': title_to_remove,
            'unwatch': '1',
            'token': csrf_token,
            'format': 'json'
        })

        if 'error' not in r4.json():
            logger.info(f'Successfully removed {title_to_remove} from watchlist')
            return jsonify({'success': True, 'message': f'{title_to_remove} removed from inventory'})
        else:
            logger.error(f'Failed to remove {title_to_remove} from watchlist: {r4.json()}')
            return jsonify({'error': 'Failed to remove from inventory'}), 500

    except Exception as e:
        logger.error(f'Error removing from inventory: {e}')
        return jsonify({'error': 'Failed to remove from inventory'}), 500


if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # To allow OAuth without HTTPS in development
    logger.info('Starting Flask app')
    app.run(debug=True, port=3000)