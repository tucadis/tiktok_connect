# Contributing to TikTok Live Event Router

First off, thank you for considering contributing to TikTok Live Event Router! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to fostering an open and welcoming environment. Please be respectful and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots if possible**
* **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain which behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Setup

1. Fork and clone the repo
2. Run `npm install` to install dependencies
3. Create a branch for your changes
4. Make your changes
5. Run `npm test` to ensure tests pass
6. Run `npm run build` to ensure it builds
7. Commit your changes using a descriptive commit message
8. Push to your fork and submit a pull request

### Coding Style

* Use TypeScript
* Follow the existing code style
* Use meaningful variable names
* Comment complex logic
* Write tests for new features

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### Adding a New Integration

1. Create a new file in `src/integrations/`
2. Implement the `Plugin` interface
3. Add tests in `tests/`
4. Update the README with usage instructions
5. Add an example in `examples/`

## Project Structure

```
src/
├── collectors/     # Event collection from TikTok
├── parsers/       # Event parsing and filtering
├── routers/       # Event routing logic
├── integrations/  # Third-party integrations
├── api/          # REST API
├── websocket/    # WebSocket server
├── types/        # TypeScript definitions
└── utils/        # Utility functions
```

## Testing

* Write unit tests for new features
* Ensure all tests pass before submitting PR
* Aim for high test coverage
* Use the simulation mode for integration testing

## Documentation

* Update README.md if you change functionality
* Add JSDoc comments to new functions
* Update API documentation if you add/modify endpoints
* Add examples for new integrations

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing!
