const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(__dirname, "..", "content", "posts");
const outFile = path.join(__dirname, "..", "posts.json");

function arr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return v.split(/[,\s]+/).filter(Boolean);
  return [];
}

const posts = fs.existsSync(postsDir)
  ? fs.readdirSync(postsDir).filter(f => f.endsWith(".md")).map(file => {
      const parsed = matter(fs.readFileSync(path.join(postsDir, file), "utf8"));
      const d = parsed.data || {};
      return {
        id: d.id || file.replace(/\.md$/, ""),
        date: d.date || "",
        title: d.title || "",
        category: d.category || "",
        topic: d.topic || "",
        scholar: d.scholar || "",
        book: d.book || "",
        tags: arr(d.tags),
        source: d.source || "",
        links: Array.isArray(d.links) ? d.links : [],
        logo: d.logo || "logo-black.png",
        statement: parsed.content.trim()
      };
    }).sort((a,b) => String(b.date).localeCompare(String(a.date)))
  : [];

fs.writeFileSync(outFile, JSON.stringify(posts, null, 2), "utf8");
console.log("posts.json created");
