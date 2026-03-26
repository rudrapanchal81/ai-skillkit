declare namespace skillkit {
  type SkillInput = string | string[];
  type ComposeFormat = 'plain' | 'markdown';

  interface Frontmatter {
    [key: string]: string | string[];
  }

  interface Skill {
    name: string;
    title: string;
    description: string;
    content: string;
    raw: string;
    lines: number;
    size: number;
    path: string;
    sourceDir: string;
    triggers: string[];
    antiTriggers: string[];
    frontmatter: Frontmatter;
  }

  interface ComposeOptions {
    skills?: SkillInput;
    includeIntro?: boolean;
    includeMetadata?: boolean;
    format?: ComposeFormat;
    maxLength?: number;
  }

  interface RecommendOptions {
    limit?: number;
  }

  interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    filePath: string;
    name: string;
    title: string;
    frontmatter: Frontmatter;
  }

  interface SkillCollection {
    list(): string[];
    get(name: string): string;
    parse(name: string): Skill;
    all(): Skill[];
    search(query: string): Skill[];
    compose(input?: SkillInput | ComposeOptions, options?: ComposeOptions): string;
    recommend(query: string, options?: RecommendOptions): Skill[];
    validate(name: string): ValidationResult;
  }

  function list(): string[];
  function get(name: string): string;
  function parse(name: string): Skill;
  function all(): Skill[];
  function search(query: string): Skill[];
  function compose(input?: SkillInput | ComposeOptions, options?: ComposeOptions): string;
  function recommend(query: string, options?: RecommendOptions): Skill[];
  function validate(name: string): ValidationResult;
  function validateContent(raw: string, filePath?: string): ValidationResult;
  function validateFile(filePath: string): ValidationResult;
  function createCollection(dir: string): SkillCollection;
  function loadSkills(dir: string): SkillCollection;
}

export = skillkit;
