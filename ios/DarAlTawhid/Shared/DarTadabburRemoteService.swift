import Foundation

extension Notification.Name {
    static let darTadabburCatalogUpdated = Notification.Name("darTadabburCatalogUpdated")
}

enum DarTadabburRemoteService {
    static let catalogURL = URL(
        string: "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/tadabbur/catalog.json"
    )!

    private static let cacheKey = "darTadabburCatalogJSONV1"
    private static let etagKey = "darTadabburCatalogEtagV1"
    private static let defaults = UserDefaults.standard
    private static let lock = NSLock()
    private static var memory: Catalog?

    struct Entry: Codable, Equatable {
        let id: String
        let reference: String
        let verse: String
        let reflection: String
        let narrator: String
        let generation: String
        let source: String

        var isComplete: Bool {
            !id.isEmpty
                && !reference.isEmpty
                && !verse.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                && reflection.trimmingCharacters(in: .whitespacesAndNewlines).count >= 40
                && !narrator.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                && !source.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
    }

    struct Catalog: Codable, Equatable {
        var version: Int?
        var updatedAt: String?
        var itemCount: Int?
        var items: [Entry]
    }

    static func cachedCatalog() -> Catalog {
        lock.lock()
        defer { lock.unlock() }
        if let memory { return memory }
        if let data = defaults.data(forKey: cacheKey), let parsed = decode(data) {
            memory = parsed
            return parsed
        }
        return Catalog(version: 1, updatedAt: nil, itemCount: 0, items: [])
    }

    @discardableResult
    static func refresh() async -> Catalog {
        let previous = cachedCatalog()
        do {
            var request = URLRequest(url: catalogURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 25)
            if let etag = defaults.string(forKey: etagKey), !etag.isEmpty {
                request.setValue(etag, forHTTPHeaderField: "If-None-Match")
            }
            let (data, response) = try await URLSession.shared.data(for: request)
            let http = response as? HTTPURLResponse
            if http?.statusCode == 304 {
                return previous
            }
            guard let http, (200...299).contains(http.statusCode) else {
                return previous
            }
            guard let parsed = decode(data), !parsed.items.isEmpty else {
                return previous
            }
            persist(data, etag: http.value(forHTTPHeaderField: "ETag"), catalog: parsed)
            NotificationCenter.default.post(name: .darTadabburCatalogUpdated, object: nil)
            return parsed
        } catch {
            return previous
        }
    }

    static func entry(reference: String) -> Entry? {
        let key = reference.trimmingCharacters(in: .whitespacesAndNewlines)
        return cachedCatalog().items.first { $0.reference == key }
    }

    static func injectionJavaScript() -> String {
        let items = cachedCatalog().items
        let payload: [[String: String]] = items.map {
            [
                "id": $0.id,
                "reference": $0.reference,
                "verse": $0.verse,
                "reflection": $0.reflection,
                "narrator": $0.narrator,
                "generation": $0.generation,
                "source": $0.source
            ]
        }
        guard
            let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
            let json = String(data: data, encoding: .utf8)
        else {
            return "window.__DAR_TADABBUR_ITEMS=[];window.__DAR_TADABBUR_BY_REF={};"
        }
        return """
        (function(){
          try{
            var items=\(json);
            var by={};
            var seen={};
            var out=[];
            for(var i=0;i<items.length;i++){
              var row=items[i]||{};
              var id=String(row.id||"").trim();
              var ref=String(row.reference||"").trim();
              var verse=String(row.verse||"").trim();
              var reflection=String(row.reflection||"").trim();
              var narrator=String(row.narrator||"").trim();
              var generation=String(row.generation||"").trim();
              var source=String(row.source||"").trim();
              if(!id||!ref||!verse||reflection.length<40||!narrator||!source)continue;
              if(seen[id])continue;
              seen[id]=1;
              var item={id:id,reference:ref,verse:verse,reflection:reflection,narrator:narrator,generation:generation,source:source};
              out.push(item);
              if(!by[ref]) by[ref]=item;
            }
            window.__DAR_TADABBUR_ITEMS=out;
            window.__DAR_TADABBUR_BY_REF=by;
            window.__DAR_TADABBUR_UPDATED_AT=Date.now();
            try{window.dispatchEvent(new Event("dar-tadabbur-ready"))}catch(e){}
          }catch(e){}
        })();
        """
    }

    private static func decode(_ data: Data) -> Catalog? {
        guard let raw = try? JSONSerialization.jsonObject(with: data) else { return nil }
        var rows: [[String: Any]] = []
        if let obj = raw as? [String: Any] {
            rows = (obj["items"] as? [[String: Any]]) ?? []
        } else if let list = raw as? [[String: Any]] {
            rows = list
        }
        var seen = Set<String>()
        var items: [Entry] = []
        for row in rows {
            let entry = Entry(
                id: string(row["id"]),
                reference: string(row["reference"]),
                verse: string(row["verse"]),
                reflection: string(row["reflection"]),
                narrator: string(row["narrator"]),
                generation: string(row["generation"]),
                source: string(row["source"])
            )
            guard entry.isComplete, !seen.contains(entry.id) else { continue }
            seen.insert(entry.id)
            items.append(entry)
        }
        guard !items.isEmpty else { return nil }
        let updated = (raw as? [String: Any]).flatMap { string($0["updatedAt"]) }
        let version = (raw as? [String: Any]).flatMap { $0["version"] as? Int }
        return Catalog(version: version ?? 1, updatedAt: updated, itemCount: items.count, items: items)
    }

    private static func persist(_ data: Data, etag: String?, catalog: Catalog) {
        lock.lock()
        memory = catalog
        lock.unlock()
        defaults.set(data, forKey: cacheKey)
        if let etag, !etag.isEmpty {
            defaults.set(etag, forKey: etagKey)
        }
    }

    private static func string(_ value: Any?) -> String {
        if let text = value as? String { return text.trimmingCharacters(in: .whitespacesAndNewlines) }
        if let num = value as? NSNumber { return num.stringValue }
        return ""
    }
}
