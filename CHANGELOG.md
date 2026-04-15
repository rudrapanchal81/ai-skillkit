# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.5] - 2026-04-14

### Added
- **New bundled skills (12 total now):**
  - `database` - SQL, Prisma, TypeORM, MongoDB, migrations, and data modeling patterns
  - `deployment` - Docker, CI/CD, Vercel, AWS, Railway, Kubernetes deployment patterns
  - `security` - Authentication, authorization, encryption, input validation, and security best practices

### Changed
- Expanded skill coverage to include full-stack development workflow
- Updated tests to reflect 12 total bundled skills

## [1.3.4] - 2026-04-10

### Fixed
- Updated test expectations to include api-design, backend, and testing skills

## [1.3.3] - 2026-04-08

### Added
- **New bundled skills:**
  - `testing` - Jest, Vitest, Playwright test patterns with mocking and fixtures
  - `api-design` - REST API, GraphQL, and OpenAPI design patterns
  - `backend` - Node.js/Express patterns with middleware, auth, and error handling
- CHANGELOG.md to track version history
- GitHub issue templates (bug report, feature request)
- GitHub pull request template
- SECURITY.md with vulnerability reporting guidelines

### Changed
- **Improved error messages** with actionable suggestions:
  - Show available skills when skill not found
  - Include example usage in validation errors
  - Suggest fixes for common mistakes
  - Add helpful hints for maxLength errors
- Enhanced error handling throughout lib/index.js

## [1.3.2] - 2026-04-04

### Changed
- Version bump for package improvements

## [1.3.1] - 2026-04-02

### Changed
- Minor version bump for autopublish testing

## [1.3.0] - 2026-04-02

### Added
- `getVibePrompt()` convenience function for one-line vibe coding
- `examples/vibe-coding.ts` example file
- Prominent one-line usage examples in README and GETTING_STARTED

### Changed
- Updated README with one-line vibe coding setup section
- Updated GETTING_STARTED with 10-second quickstart

## [1.2.0] - 2026-03-31

### Added
- Postinstall welcome message with helpful onboarding
- Integration examples directory with OpenAI, Claude, Cursor, and Windsurf guides
- `examples/openai.js` - OpenAI integration example
- `examples/claude.js` - Claude integration example
- `examples/cursor-windsurf.md` - Cursor/Windsurf setup guide
- `examples/custom-agent.js` - Custom coding agent builder
- `examples/README.md` - Examples overview
- GETTING_STARTED.md comprehensive guide
- PROJECT_OVERVIEW.md complete project documentation
- GitHub Actions autopublish workflow
- Version check workflow for PRs
- `.github/AUTOPUBLISH.md` documentation

### Changed
- Updated package.json to include examples, scripts, and GETTING_STARTED in published files
- Enhanced README with links to getting started guide and examples
- Added integration examples section to README

## [1.1.1] - 2026-03-30

### Fixed
- npm publish 403 error by bumping version

## [1.1.0] - 2026-03-30

### Added
- Configurable `compose()` API with options for skills, intro, metadata, format, and maxLength
- `recommend()` function to get relevant skills for a task
- `validate()`, `validateContent()`, `validateFile()` functions for skill validation
- `createCollection()` and `loadSkills()` for local skill collections
- Extended CLI with compose, recommend, validate commands
- CLI options: `--dir`, `--metadata`, `--format`, `--max-length`
- TypeScript declarations for all new APIs
- ESM support with `index.mjs` entry point
- `package.json` exports field for dual ESM/CommonJS support
- Comprehensive test coverage for new features
- MIT LICENSE file
- GitHub Actions test workflow (CI)
- GitHub Actions publish workflow (CD)

### Changed
- Improved README with conversion-focused copy, badges, and usage examples
- Enhanced package.json with better description, keywords, and metadata
- Fixed CLI positional arguments for `add` and `init` commands
- Fixed compose `maxLength` default handling
[1.3.6]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/rudrapanchal81/ai-skillkit/releases/tag/v1.0.0

### Fixed
- CLI argument parsing bugs
- Compose maxLength enforcement logic

## [1.0.0] - 2026-03-29

### Added
- Initial release
- Core API: `list()`, `get()`, `parse()`, `all()`, `search()`, `compose()`
- CLI commands: list, get, add, info, init, search
- 6 bundled skills: docx, pdf, pptx, xlsx, frontend, file-reading
- Zero runtime dependencies
- TypeScript declarations
- Basic test suite
- README documentation

[1.3.3]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/rudrapanchal81/ai-skillkit/releases/tag/v1.0.0
- 6 bundled skills: docx, pdf, pptx, xlsx, frontend, file-reading
- Zero runtime dependencies
- TypeScript declarations
- Basic test suite
- README documentation

[1.3.3]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/rudrapanchal81/ai-skillkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/rudrapanchal81/ai-skillkit/releases/tag/v1.0.0
