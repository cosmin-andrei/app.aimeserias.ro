import yaml from "js-yaml";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontmatter<T extends Record<string, unknown> = Record<string, unknown>>(
    source: string
): { data: T; content: string } {
    const match = source.match(FRONTMATTER_RE);
    if (!match) {
        return { data: {} as T, content: source };
    }

    const data = (yaml.load(match[1]) ?? {}) as T;
    const content = match[2].replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return { data, content };
}
