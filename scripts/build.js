const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(__dirname, "..", "content", "posts");
const outFile = path.join(__dirname, "..", "posts.json");

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/[,\s]+/).filter(Boolean);
  return [];
}

let posts = [];
if (fs.existsSync(postsDir)) {
  posts = fs.readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
      const parsed = matter(raw);
      const data = parsed.data || {};
      return {
        id: data.id || file.replace(/\.md$/, ""),
        date: data.date || "",
        title: data.title || "",
        category: data.category || "",
        topic: data.topic || "",
        scholar: data.scholar || "",
        book: data.book || "",
        tags: toArray(data.tags),
        source: data.source || "",
        links: Array.isArray(data.links) ? data.links : [],
        logo: data.logo || "logo-black.png",
        statement: (parsed.content || "").trim()
      };
    })
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}
fs.writeFileSync(outFile, JSON.stringify(posts, null, 2), "utf8");
console.log(`Built posts.json with ${posts.length} posts.`);
