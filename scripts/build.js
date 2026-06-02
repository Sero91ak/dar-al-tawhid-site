const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(__dirname, "..", "content", "posts");
const outFile = path.join(__dirname, "..", "posts.json");

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") return tags.split(/[,\s]+/).filter(Boolean);
  return [];
}

function normalizeLinks(links) {
  if (Array.isArray(links)) return links;
  return [];
}

function readPosts() {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(file => file.endsWith(".md"));
  const posts = files.map(file => {
    const full = path.join(postsDir, file);
    const raw = fs.readFileSync(full, "utf8");
    const parsed = matter(raw);
    const data = parsed.data || {};
    return {
      id: data.id || file.replace(/\.md$/, ""),
      title: data.title || "",
      category: data.category || "",
      topic: data.topic || "",
      scholar: data.scholar || "",
      book: data.book || "",
      tags: normalizeTags(data.tags),
      statement: parsed.content.trim() || data.statement || "",
      source: data.source || "",
      links: normalizeLinks(data.links),
      logo: data.logo || "logo-black.png",
      date: data.date || ""
    };
  });

  posts.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  return posts;
}

fs.writeFileSync(outFile, JSON.stringify(readPosts(), null, 2), "utf8");
console.log("Built posts.json");
