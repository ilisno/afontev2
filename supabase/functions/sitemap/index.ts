import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@sanity/client@^7.2.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanity client configuration
const sanityClient = createClient({
  projectId: 'n5uztn17', // Your Sanity project ID
  dataset: 'production', // Your Sanity dataset name
  apiVersion: '2023-09-11', // Use a UTC date string
  useCdn: true, // Use the CDN for faster responses
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Using your custom domain as the base URL for the sitemap
    const BASE_URL = 'https://afonte.fr'; 

    // Fetch blog posts from Sanity
    const posts = await sanityClient.fetch(`*[_type == "post"]{
      "slug": slug.current,
      "categorySlug": categories[0]->slug.current, // Assuming first category slug for URL
      publishedAt
    }`);

    // Static URLs
    const staticUrls = [
      { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/programme`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${BASE_URL}/coach-virtuel`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/blog`, changefreq: 'daily', priority: '0.9' },
      { loc: `${BASE_URL}/tarifs`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/mon-espace`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/login`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/merci1`, changefreq: 'never', priority: '0.1' }, // Thank you pages usually not indexed
      { loc: `${BASE_URL}/merci2`, changefreq: 'never', priority: '0.1' }, // Thank you pages usually not indexed
    ];

    // Dynamic URLs from blog posts
    const dynamicUrls = posts.map((post: any) => {
      const lastmod = post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${BASE_URL}/${post.categorySlug || 'blog'}/${post.slug}`, // Fallback to 'blog' if categorySlug is missing
        lastmod: lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      };
    });

    // Combine all URLs
    const allUrls = [...staticUrls, ...dynamicUrls];

    // Build the XML sitemap string
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    allUrls.forEach(url => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${url.loc}</loc>\n`;
      sitemap += `    <lastmod>${url.lastmod || new Date().toISOString().split('T')[0]}</lastmod>\n`; // Use current date if lastmod is missing
      sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${url.priority}</priority>\n`;
      sitemap += `  </url>\n`;
    });

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
      status: 200,
    });

  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate sitemap', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});