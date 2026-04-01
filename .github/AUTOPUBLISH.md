# Autopublish Setup

This repository is configured to automatically publish to npm when code is merged to the `main` branch.

## How It Works

### 1. Version Check (Required)

**Workflow:** `.github/workflows/version-check.yml`

- Runs on every pull request to `main`
- Compares `package.json` version in PR vs base branch
- **Fails if version is not bumped**
- Posts comment on PR with instructions

### 2. Auto Publish

**Workflow:** `.github/workflows/publish.yml`

- Runs automatically when code is merged to `main`
- Also supports manual trigger from Actions tab
- Checks if version already exists on npm
- Skips publish if version already published
- Runs tests before publishing
- Publishes to npm with `latest` tag

## Required Setup

### 1. Add NPM_TOKEN Secret

Go to your repository settings:

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Your npm automation token

**How to create npm token:**

```bash
npm login
npm token create --type automation
```

Or create a granular token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens with:
- **Permissions:** Read and write
- **Packages:** ai-skillkit

### 2. Enable Branch Protection (Recommended)

Go to **Settings** → **Branches** → **Add rule** for `main`:

- ✅ Require pull request before merging
- ✅ Require status checks to pass before merging
  - Select: `Verify version bump`
  - Select: `Node 14`, `Node 18`, `Node 20` (from test workflow)
- ✅ Require conversation resolution before merging

This ensures:
- Version is always bumped before merge
- Tests pass before merge
- Code is reviewed before merge

## Workflow for Contributors

### 1. Create a feature branch

```bash
git checkout -b feature/my-feature
```

### 2. Make your changes

```bash
# Edit code
git add .
git commit -m "Add new feature"
```

### 3. Bump the version

```bash
# For bug fixes
npm version patch  # 1.2.0 → 1.2.1

# For new features
npm version minor  # 1.2.0 → 1.3.0

# For breaking changes
npm version major  # 1.2.0 → 2.0.0
```

This updates `package.json` and creates a git commit.

### 4. Push and create PR

```bash
git push origin feature/my-feature
```

Create a pull request on GitHub.

### 5. Wait for checks

- ✅ Version check passes (version was bumped)
- ✅ Tests pass on Node 14, 18, 20

### 6. Merge PR

Once approved and checks pass, merge the PR.

### 7. Automatic publish

- Publish workflow runs automatically
- Tests run again
- Package publishes to npm
- New version is live!

## Manual Publish

You can also publish manually from the Actions tab:

1. Go to **Actions** → **Publish**
2. Click **Run workflow**
3. Choose branch (usually `main`)
4. Optionally set npm tag (default: `latest`)
5. Click **Run workflow**

## Troubleshooting

### Version check fails

**Error:** "Version not changed"

**Fix:** Bump version before merging:

```bash
npm version patch
git push
```

### Publish fails with 403

**Error:** "You cannot publish over the previously published versions"

**Cause:** Version already exists on npm

**Fix:** Bump version again:

```bash
npm version patch
git push
```

### Publish fails with authentication error

**Error:** "Unable to authenticate"

**Fix:** Check `NPM_TOKEN` secret:
- Make sure it exists in repository secrets
- Make sure token has not expired
- Regenerate token if needed

### Tests fail

**Fix:** Run tests locally before pushing:

```bash
npm test
```

## Skipping Publish

If you merge to `main` but don't want to publish:

- Don't bump the version
- Version check will fail
- Merge won't be allowed (if branch protection enabled)

Or if you need to merge without publishing:

- Temporarily disable branch protection
- Merge without version bump
- Publish workflow will skip (version already exists)

## Workflow Files

- `.github/workflows/version-check.yml` - Enforces version bump on PRs
- `.github/workflows/publish.yml` - Auto-publishes on merge to main
- `.github/workflows/test.yml` - Runs tests on push and PR

## Best Practices

1. **Always bump version** before merging to main
2. **Use semantic versioning**:
   - `patch` for bug fixes
   - `minor` for new features
   - `major` for breaking changes
3. **Test locally** before pushing
4. **Review PRs** before merging
5. **Monitor Actions** tab for publish status

## Security

- `NPM_TOKEN` is stored as a GitHub secret (encrypted)
- Token is only accessible to workflows
- Workflows run with minimal permissions
- Only `main` branch can trigger publish
