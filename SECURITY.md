# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| < 1.1   | :x:                |

## Reporting a Vulnerability

We take the security of ai-skillkit seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please Do

**Report security vulnerabilities by emailing:** rudrapanchal81@gmail.com

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect

- **Acknowledgment:** We will acknowledge receipt of your vulnerability report within 48 hours
- **Communication:** We will send you regular updates about our progress
- **Timeline:** We aim to patch critical vulnerabilities within 7 days
- **Credit:** We will credit you in the security advisory (unless you prefer to remain anonymous)

### Security Update Process

1. The security report is received and assigned to a handler
2. The problem is confirmed and affected versions are determined
3. Code is audited to find similar problems
4. Fixes are prepared for all supported versions
5. New versions are released and announced

## Security Best Practices

When using ai-skillkit:

### For Package Users

- Always use the latest version
- Review skill content before using in production
- Validate custom skills before deployment
- Don't include sensitive data in skill files
- Use `validate()` to check skills before use

### For Skill Authors

- Don't include API keys, tokens, or credentials in skills
- Sanitize user input in code examples
- Follow secure coding practices in examples
- Test skills thoroughly before sharing
- Use `npx ai-skillkit validate` before publishing

### For Contributors

- Run tests before submitting PRs: `npm test`
- Follow secure coding guidelines
- Don't commit secrets or credentials
- Review dependencies for vulnerabilities
- Use `npm audit` to check for known issues

## Known Security Considerations

### Skill Content

- Skills are markdown files that may contain code examples
- Users should review skill content before using in production
- Custom skills should be validated before deployment
- Skills may suggest dependencies - verify versions before installing

### No Remote Code Execution

- ai-skillkit does not execute code from skills
- Skills are text templates only
- No eval() or dynamic code execution
- Safe to use in production environments

### Dependencies

- Zero runtime dependencies
- Development dependencies are regularly updated
- Run `npm audit` to check for vulnerabilities

## Security Updates

Security updates will be announced via:

- GitHub Security Advisories
- npm package updates
- CHANGELOG.md
- GitHub releases

Subscribe to releases to stay informed: https://github.com/rudrapanchal81/ai-skillkit/releases

## Questions

If you have questions about this security policy, please email: rudrapanchal81@gmail.com

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who responsibly disclose vulnerabilities.

Thank you for helping keep ai-skillkit and its users safe!
