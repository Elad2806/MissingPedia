import logging
from flask import Blueprint, request, jsonify
from database import get_db_connection

articles_bp = Blueprint('articles', __name__)
logger = logging.getLogger(__name__)

@articles_bp.route('/api/search_categories', methods=['GET'])
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
            lang = request.args.get('expandLanguage', 'en')
            if lang == "Hebrew":
                lang = "he"
            else:
                lang = 'en'
            # Call expand_articles function here
            return expand_articles(conn, cur, categories, lang)

    except Exception as e:
        # Log the error message
        print(f"Error in search_categories: {str(e)}")
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500


def create_articles(conn, cur, categories):
    categories_placeholders = ', '.join(['%s'] * len(categories))

    sql_query = f"""
    WITH RECURSIVE CategoryHierarchy AS (
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
        FROM page_cat_link pcl
        INNER JOIN articles a ON pcl.page_id = a.page_id
        WHERE a.language = 'en'
        AND (pcl.category, pcl.language) IN (SELECT category_title, language FROM CategoryHierarchy)
        AND a.view_count IS NOT NULL
        LIMIT 170000
    )

    SELECT *
    FROM PagesOfInterest tpi
    WHERE NOT EXISTS (
        SELECT 1
        FROM lang_links ll
        WHERE ll.ll_lang = 'en' AND REPLACE(tpi.title, '_', ' ') = ll.ll_title
    )
    ORDER BY len_views_ratio DESC
    LIMIT 20;
    """

    cur.execute(sql_query, categories)
    results = cur.fetchall()

    articles = {}
    distinct_pages_count = results[0][5] if results else 0  # Getting the distinct pages count from the first row

    for row in results:
        page_id = row[0]
        if page_id not in articles:
            articles[page_id] = {
                'source_id': page_id,
                'source_title': row[1],
                'source_length': row[2],
                'source_views': row[3],
                'len_views_ratio': row[4],
                'source_language': 'en',
                'other_languages': []  # No other languages for this case
            }

    response = {
        'articles': list(articles.values()),
        'distinct_pages_count': distinct_pages_count
    }

    cur.close()
    conn.close()
    print("response", response)
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
            categories c
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
            category_links cl ON ch.category_title::text = cl.parent_category::text AND ch.language = cl.language
        JOIN
            categories c ON cl.subcategory::text = c.category_id::text AND c.language = cl.language
        WHERE
            ch.depth < 2
    ),

    PagesOfInterest AS (
        SELECT DISTINCT a.page_id, a.title, a.length, a.view_count, a.language,
            ROUND(a.view_count::float / a.length * 100) / 100 AS len_views_ratio,
            COUNT(*) OVER () AS distinct_page_count
        FROM page_cat_link pcl
        INNER JOIN articles a ON pcl.page_id = a.page_id
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
        INNER JOIN lang_links ll ON tpi.title = ll.ll_title and tpi.language = ll.ll_lang
        INNER JOIN articles a ON ll.ll_from_lang = a.language AND ll.ll_from = a.page_id
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