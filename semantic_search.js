require('dotenv').config();
const blogPosts = require('./data/blogPost.json');

const openAiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
}

async function generateEmbeddings(text) {
  let response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: openAiHeaders,
    body: JSON.stringify({
      'model': 'text-embedding-ada-002',
      'input': text
    })
  })

  if (response.ok) {
    const data = await response.json(); // Wait for the JSON to be parsed, async/await doesn't solve
    return data.data[0].embedding; // Return the embedding array
  }
  else {
    console.log('Failed to create embeddings')
  }
}

async function embedBlogPosts(blogPosts) {
  let embeddings = [];
  for (let i = 0; i < blogPosts.length; i++) {
      let embedding = await generateEmbeddings(`${blogPosts[i].title} ${blogPosts[i].content}`);
      // let embedding = await generateEmbeddings(`${blogPosts[i].title}`);
      embeddings.push({ ...blogPosts[i], embedding });
  }

  return embeddings;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function recommendContent(query, embeddedPosts) {
  const queryEmbedding = await generateEmbeddings(query);
  const similarities = embeddedPosts.map(post => {
      return {
          ...post,
          similarity: cosineSimilarity(queryEmbedding, post.embedding),
      };
  });

  // Sort by similarity score in descending order
  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities;
}

// Example usage
const query = "Trends in AI and Content Marketing";
embedBlogPosts(blogPosts).then((embeddedPosts) => {
  recommendContent(query, embeddedPosts).then((recommendations) => {
      console.log("Top recommendations:", recommendations.slice(0, 3)); // Top 3 recommendations
  });
});

// Generate embeddings for all blog posts
// embedBlogPosts(blogPosts).then((embeddedPosts) => {
//   console.log(embeddedPosts);
// });

