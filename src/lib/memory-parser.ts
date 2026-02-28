import fs from "fs";
import path from "path";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || "/root/.openclaw";
const WORKSPACE = path.join(OPENCLAW_DIR, "workspace");

export type EntityType = "person" | "project" | "technology" | "concept" | "resource" | "date" | "location";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aliases: string[];
  mentions: number;
  firstMention: string;
  lastMention: string;
  sources: string[];
  metadata?: Record<string, string>;
}

export interface Relation {
  id: string;
  source: string;
  target: string;
  type: "uses" | "created_by" | "related_to" | "mentions" | "part_of" | "located_at";
  weight: number;
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

interface ParsedSection {
  date: string;
  title: string;
  content: string;
  level: number;
}

const TECHNOLOGY_PATTERNS = [
  /\b(Next\.js|React|Vue|Angular|Svelte|TypeScript|JavaScript|Python|Node\.js|Go|Rust|Java|Kotlin|Swift)\b/gi,
  /\b(Docker|Kubernetes|AWS|GCP|Azure|Firebase|Supabase|PostgreSQL|MongoDB|Redis|SQLite)\b/gi,
  /\b(Tailwind|Bootstrap|Material-UI|Chakra|Sass|CSS)\b/gi,
  /\b(GitHub|GitLab|Bitbucket|Git)\b/gi,
  /\b(PrestaShop|Shopify|WooCommerce|Magento)\b/gi,
  /\b(N8N|Typebot|EspoCRM|Zapier|Make)\b/gi,
  /\b(Three\.js|React Three Fiber|WebGL|Canvas)\b/gi,
  /\b(Telegram|Discord|Slack|WhatsApp)\b/gi,
];

const PERSON_PATTERNS = [
  /\*\*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\*\*/g,
  /@([A-Za-z0-9_]+)/g,
  /por\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/gi,
];

const RESOURCE_PATTERNS = [
  /\[([^\]]+)\]\(([^)]+)\)/g,
  /\*\*([^*]+):\*\*\s*([^\n]+)/g,
];

const DATE_PATTERN = /^##\s*(\d{4}-\d{2}-\d{2})$/;

function generateId(name: string, type: EntityType): string {
  return `${type}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function extractEntitiesFromText(
  text: string,
  source: string,
  currentDate: string
): { entities: Map<string, Entity>; relations: Relation[] } {
  const entities = new Map<string, Entity>();
  const relations: Relation[] = [];

  for (const pattern of TECHNOLOGY_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = match[0];
      const id = generateId(name, "technology");
      const existing = entities.get(id);
      if (existing) {
        existing.mentions++;
        existing.lastMention = currentDate;
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
      } else {
        entities.set(id, {
          id,
          name,
          type: "technology",
          aliases: [],
          mentions: 1,
          firstMention: currentDate,
          lastMention: currentDate,
          sources: [source],
        });
      }
    }
  }

  for (const pattern of PERSON_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = match[1].trim();
      if (name.length < 2 || name.length > 50) continue;
      if (/^(http|https|www|com|org|net|es|en|el|la|los|las|un|una|the)$/i.test(name)) continue;
      
      const id = generateId(name, "person");
      const existing = entities.get(id);
      if (existing) {
        existing.mentions++;
        existing.lastMention = currentDate;
      } else {
        entities.set(id, {
          id,
          name,
          type: "person",
          aliases: [],
          mentions: 1,
          firstMention: currentDate,
          lastMention: currentDate,
          sources: [source],
        });
      }
    }
  }

  const conceptMatches = text.matchAll(/^###\s+(.+)$/gm);
  for (const match of conceptMatches) {
    const name = match[1].trim();
    if (name.length > 3 && name.length < 100) {
      const id = generateId(name, "concept");
      const existing = entities.get(id);
      if (existing) {
        existing.mentions++;
        existing.lastMention = currentDate;
      } else {
        entities.set(id, {
          id,
          name,
          type: "concept",
          aliases: [],
          mentions: 1,
          firstMention: currentDate,
          lastMention: currentDate,
          sources: [source],
        });
      }
    }
  }

  for (const pattern of RESOURCE_PATTERNS) {
    const resourceMatches = text.matchAll(pattern);
    for (const match of resourceMatches) {
    const label = match[1]?.trim();
    const url = match[2]?.trim();
    if (label && label.length > 2 && label.length < 100) {
      const id = generateId(label, "resource");
      const existing = entities.get(id);
      if (existing) {
        existing.mentions++;
        existing.lastMention = currentDate;
        if (url && !existing.metadata) {
          existing.metadata = { url };
        }
      } else {
        entities.set(id, {
          id,
          name: label,
          type: "resource",
          aliases: [],
          mentions: 1,
          firstMention: currentDate,
          lastMention: currentDate,
          sources: [source],
          metadata: url ? { url } : undefined,
        });
      }
    }
  }
  }

  return { entities, relations };
}

function parseMarkdown(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n");
  let currentDate = "unknown";
  let currentTitle = "";
  let currentContent: string[] = [];
  let currentLevel = 0;

  for (const line of lines) {
    const dateMatch = line.match(DATE_PATTERN);
    if (dateMatch) {
      if (currentContent.length > 0) {
        sections.push({
          date: currentDate,
          title: currentTitle,
          content: currentContent.join("\n"),
          level: currentLevel,
        });
      }
      currentDate = dateMatch[1];
      currentTitle = currentDate;
      currentContent = [];
      currentLevel = 2;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentContent.length > 0) {
        sections.push({
          date: currentDate,
          title: currentTitle,
          content: currentContent.join("\n"),
          level: currentLevel,
        });
      }
      currentTitle = headingMatch[2];
      currentLevel = headingMatch[1].length;
      currentContent = [];
      continue;
    }

    currentContent.push(line);
  }

  if (currentContent.length > 0) {
    sections.push({
      date: currentDate,
      title: currentTitle,
      content: currentContent.join("\n"),
      level: currentLevel,
    });
  }

  return sections;
}

function mergeEntities(allEntities: Map<string, Entity>[]): Entity[] {
  const merged = new Map<string, Entity>();

  for (const entityMap of allEntities) {
    for (const [id, entity] of entityMap) {
      const existing = merged.get(id);
      if (existing) {
        existing.mentions += entity.mentions;
        existing.lastMention = entity.lastMention > existing.lastMention ? entity.lastMention : existing.lastMention;
        existing.firstMention = entity.firstMention < existing.firstMention ? entity.firstMention : existing.firstMention;
        for (const source of entity.sources) {
          if (!existing.sources.includes(source)) {
            existing.sources.push(source);
          }
        }
      } else {
        merged.set(id, { ...entity });
      }
    }
  }

  return Array.from(merged.values());
}

function generateRelations(entities: Entity[]): Relation[] {
  const relations: Relation[] = [];
  const entitiesBySource = new Map<string, Entity[]>();

  for (const entity of entities) {
    for (const source of entity.sources) {
      if (!entitiesBySource.has(source)) {
        entitiesBySource.set(source, []);
      }
      entitiesBySource.get(source)!.push(entity);
    }
  }

  for (const [, sourceEntities] of entitiesBySource) {
    for (let i = 0; i < sourceEntities.length; i++) {
      for (let j = i + 1; j < sourceEntities.length; j++) {
        const a = sourceEntities[i];
        const b = sourceEntities[j];
        
        if (a.type === b.type) continue;

        const relationId = `rel-${a.id}-${b.id}`;
        const reverseId = `rel-${b.id}-${a.id}`;
        
        const existingForward = relations.find(r => r.id === relationId);
        const existingReverse = relations.find(r => r.id === reverseId);

        if (existingForward) {
          existingForward.weight++;
        } else if (existingReverse) {
          existingReverse.weight++;
        } else {
          relations.push({
            id: relationId,
            source: a.id,
            target: b.id,
            type: "related_to",
            weight: 1,
          });
        }
      }
    }
  }

  return relations.filter(r => r.weight >= 1);
}

export function parseMemoryFiles(): KnowledgeGraph {
  const allEntities: Map<string, Entity>[] = [];

  const memoryPath = path.join(WORKSPACE, "MEMORY.md");
  try {
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, "utf-8");
      const sections = parseMarkdown(content);

      for (const section of sections) {
        const { entities } = extractEntitiesFromText(
          section.content,
          `MEMORY.md#${section.title}`,
          section.date
        );
        allEntities.push(entities);
      }
    }
  } catch (error) {
    console.error("[memory-parser] Error parsing MEMORY.md:", error);
  }

  const soulPath = path.join(WORKSPACE, "SOUL.md");
  try {
    if (fs.existsSync(soulPath)) {
      const content = fs.readFileSync(soulPath, "utf-8");
      const { entities } = extractEntitiesFromText(content, "SOUL.md", "unknown");
      allEntities.push(entities);
    }
  } catch (error) {
    console.error("[memory-parser] Error parsing SOUL.md:", error);
  }

  const memoryDir = path.join(WORKSPACE, "memory");
  try {
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir);
      const recentFiles = files
        .filter(f => f.endsWith(".md"))
        .sort()
        .reverse()
        .slice(0, 30);

      for (const file of recentFiles) {
        const filePath = path.join(memoryDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : "unknown";
        const { entities } = extractEntitiesFromText(content, `memory/${file}`, date);
        allEntities.push(entities);
      }
    }
  } catch (error) {
    console.error("[memory-parser] Error parsing memory directory:", error);
  }

  const entities = mergeEntities(allEntities);
  const relations = generateRelations(entities);

  return {
    entities: entities.filter(e => e.mentions >= 1).slice(0, 100),
    relations: relations.slice(0, 200),
  };
}
