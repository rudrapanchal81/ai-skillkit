declare namespace skillkit {
  interface Skill {
    name: string;
    title: string;
    description: string;
    content: string;
    lines: number;
    size: number;
  }

  function list(): string[];
  function get(name: string): string;
  function parse(name: string): Skill;
  function all(): Skill[];
  function search(query: string): Skill[];
  function compose(input?: string | string[]): string;
}

export = skillkit;
