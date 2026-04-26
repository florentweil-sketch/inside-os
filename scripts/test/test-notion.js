require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function run() {
  try {
    const response = await notion.search({
      filter: { property: 'object', value: 'page' },
      page_size: 5,
    });

    console.log('Connexion OK. Pages accessibles :');
    response.results.forEach((page, i) => {
      const titleProp = Object.values(page.properties || {}).find(
        p => p.type === 'title'
      );
      const title = titleProp?.title?.[0]?.plain_text || 'Sans titre';
      console.log(`${i + 1}. ${title}`);
    });
  } catch (error) {
    console.error('Erreur de connexion :', error.body || error);
  }
}

run();