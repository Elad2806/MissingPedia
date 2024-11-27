import requests
from flask import Blueprint, request, jsonify
from database import get_db_connection

categories_bp = Blueprint('categories', __name__)

# ...category-related routes and functions...
# @categories_bp.route('/api/suggest_categories') ...
# def generate_category_suggestions(articles): ...
# def generate_suggestions_from_edit_history(username): ...
# ...other helper functions...





@categories_bp.route('/api/suggest_categories', methods=['POST'])
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
