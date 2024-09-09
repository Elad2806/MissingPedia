export const wikipediaCategories = {
    "Architecture": "Category:Architecture",
    "Art": "Category:Arts",
    "Comics and anime": "Category:Comics",
    "Entertainment": "Category:Entertainment",
    "Fashion": "Category:Fashion",
    "Literature": "Category:Literature",
    "Music": "Category:Music",
    "Performing arts": "Category:Performing arts",
    "Sports": "Category:Sports",
    "TV and film": "Category:Television",
    "Video games": "Category:Video games",
    "Biography (all)": "Category:Biography",
    "Biography (women)": "Category:Women",
    "Business and economics": "Category:Business",
    "Education": "Category:Education",
    "Food and drink": "Category:Food and drink",
    "History": "Category:History",
    "Military and warfare": "Category:Military",
    "Philosophy and religion": "Category:Philosophy",
    "Politics and government": "Category:Politics",
    "Society": "Category:Society",
    "Transportation": "Category:Transport",
    "Biology": "Category:Biology",
    "Chemistry": "Category:Chemistry",
    "Computing": "Category:Computing",
    "Earth and environment": "Category:Earth sciences",
    "Engineering": "Category:Engineering",
    "Mathematics": "Category:Mathematics",
    "Medicine & Health": "Category:Health",
    "Physics": "Category:Physics",
    "Space": "Category:Astronomy",
    "Technology": "Category:Technology"
};

export const categoryGroups = {
    "Culture": ["Architecture", "Art", "Comics and anime", "Entertainment", "Fashion", "Literature", "Music", "Performing arts", "Sports", "TV and film", "Video games"],
    "History and Society": ["Biography (all)", "Biography (women)", "Business and economics", "Education", "Food and drink", "History", "Military and warfare", "Philosophy and religion", "Politics and government", "Society", "Transportation"],
    "Science, Technology, and Math": ["Biology", "Chemistry", "Computing", "Earth and environment", "Engineering", "Mathematics", "Medicine & Health", "Physics", "Space", "Technology"]
};

function formatDate(date) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

async function getPageViews(title) {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const startDate = formatDate(lastMonth);
    const endDate = formatDate(today);

    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(title.replace(/ /g, '_'))}/daily/${startDate}/${endDate}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.items ? data.items.reduce((sum, item) => sum + item.views, 0) : 0;
    } catch (error) {
        console.error(`Error fetching page views for ${title}:`, error);
        return 0;
    }
}

async function getArticleContent(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=info|pageimages|pageprops&inprop=url&pithumbsize=100&titles=${encodeURIComponent(title)}&origin=*`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const page = Object.values(data.query.pages)[0];
        
        return {
            content: page.length || 0,
            image: page.thumbnail ? page.thumbnail.source : null,
            wikidataId: page.pageprops ? page.pageprops.wikibase_item : null,
            url: page.fullurl
        };
    } catch (error) {
        console.error(`Error fetching content for ${title}:`, error);
        return { content: 0, image: null, wikidataId: null, url: null };
    }
}

async function getLanguageCount(wikidataId) {
    if (!wikidataId) return 0;
    
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks&ids=${wikidataId}&origin=*`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.entities && data.entities[wikidataId] && data.entities[wikidataId].sitelinks) {
            return Object.keys(data.entities[wikidataId].sitelinks).length;
        }
        return 0;
    } catch (error) {
        console.error(`Error fetching language count for ${wikidataId}:`, error);
        return 0;
    }
}

async function getCategoryMembers(categoryName, continueToken = '') {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=500&format=json&origin=*&cmcontinue=${continueToken}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching category members for ${categoryName}:`, error);
        return null;
    }
}

export async function getSubcategories(categoryName) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtype=subcat&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=500&format=json&origin=*`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.query.categorymembers.map(subcat => subcat.title);
    } catch (error) {
        console.error(`Error fetching subcategories for ${categoryName}:`, error);
        return [];
    }
}

export function createPlaceholderImage() {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#f0f0f0"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" dy=".3em">No Image</text>
        </svg>
    `)}`;
}

export async function searchCategories(categories, updateProgress, debugLog) {
    let allArticles = new Set();

    for (const categoryName of categories) {
        const wikipediaCategoryName = wikipediaCategories[categoryName] || categoryName;
        console.log(`Searching for category: ${wikipediaCategoryName}`);
        debugLog(`Searching for category: ${wikipediaCategoryName}`);

        let categoriesToProcess = [wikipediaCategoryName];
        let processedCategories = new Set();

        while (categoriesToProcess.length > 0 && allArticles.size < 10000) {
            const currentCategory = categoriesToProcess.shift();
            if (processedCategories.has(currentCategory)) continue;
            processedCategories.add(currentCategory);

            let continueToken = '';
            do {
                const categoryData = await getCategoryMembers(currentCategory, continueToken);
                if (!categoryData || !categoryData.query || !categoryData.query.categorymembers) {
                    console.log(`No members found for ${currentCategory}`);
                    break;
                }

                for (const member of categoryData.query.categorymembers) {
                    if (member.ns === 14) { // Category namespace
                        if (!processedCategories.has(member.title)) {
                            categoriesToProcess.push(member.title);
                        }
                    } else if (member.ns === 0) { // Main namespace (articles)
                        allArticles.add(member.title);
                        if (allArticles.size >= 10000) break;
                    }
                }

                continueToken = categoryData.continue ? categoryData.continue.cmcontinue : '';
                updateProgress((allArticles.size / 100) * 50); // First 50% of progress bar
            } while (continueToken && allArticles.size < 10000);

            if (allArticles.size >= 10000) break;
        }
    }

    console.log(`Found ${allArticles.size} unique articles`);
    debugLog(`Found ${allArticles.size} unique articles`);

    const articlesArray = Array.from(allArticles);
    const articleData = [];

    const batchSize = 50; // Define batch size for parallel processing
    for (let i = 0; i < articlesArray.length; i += batchSize) {
        const batchArticles = articlesArray.slice(i, i + batchSize);
        const batchResults = await processArticleBatch(batchArticles, i + batchSize, articlesArray.length);
        articleData.push(...batchResults);
    }

    // Sort based on a combination of views/content ratio and language count
    articleData.sort((a, b) => {
        const scoreA = (a.views / a.contentLength) * Math.log(a.languageCount + 1);
        const scoreB = (b.views / b.contentLength) * Math.log(b.languageCount + 1);
        return scoreB - scoreA;
    });

    return articleData.slice(0, 20);
}

async function processArticleBatch(articles, processedCount, totalArticles) {
    const batchPromises = articles.map(async (title) => {
        const [content, views] = await Promise.all([
            getArticleContent(title),
            getPageViews(title)
        ]);
        
        const languageCount = await getLanguageCount(content.wikidataId);
        
        //updateProgressBar((processedCount / totalArticles) * 100);
        
        if (content.content > 0) {
            console.log(`Processed: ${title} (Length: ${content.content}, Views: ${views}, Languages: ${languageCount}, Image: ${content.image ? 'Yes' : 'No'})`);
            //debugLog(`Processed: ${title} (Length: ${content.content}, Views: ${views}, Languages: ${languageCount}, Image: ${content.image ? 'Yes' : 'No'})`);
            
            return {
                title: title,
                contentLength: content.content,
                views: views,
                languageCount: languageCount,
                image: content.image,
                url: content.url
            };
        }
        return null;
    });

    const results = await Promise.all(batchPromises);
    return results.filter(result => result !== null);
}