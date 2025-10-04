# Contributing to Campus Connect

First off, thank you for your interest in contributing to the Campus Connect project! We are excited to build this platform as a community initiative of the **Coding Pundit** club. Every contribution, no matter how small, is valuable.

To ensure a smooth and collaborative development process, we ask that you follow these guidelines.

---

## 📜 Code of Conduct

As a project of the NIT Arunachal Pradesh community, we expect all contributors to be respectful, collaborative, and constructive. We are here to learn from each other and build something great together. Please ensure your interactions are positive and professional.

---

## 🚀 Getting Started

1. **Become a Club Member:** While our code is public for everyone to learn from, active development and contributions are currently managed by the members of the NIT Arunachal Pradesh **Coding Pundit** club. If you're not a member yet, we'd love for you to join!  

2. **Fork the Repository:** Start by forking the main repository to your own GitHub account.  

3. **Clone Your Fork:** Clone your forked repository to your local machine.  

```bash
git clone https://github.com/coding-pundit-nitap/campus-connect.git
````

4. **Set Upstream Remote:** Add the original repository as an "upstream" remote. This is crucial for keeping your fork in sync with the main project.

```bash
cd campus-connect
git remote add upstream https://github.com/coding-pundit-nitap/campus-connect.git
```

---

## 💻 Contribution Workflow

1. **Sync Your Fork:** Before starting any new work, make sure your main branch is up-to-date with the main project.

```bash
git checkout main
git pull upstream main
```

2. **Create a New Branch:** Always create a new branch for your feature or bug fix. Please use the following naming convention:

   * Features: `feature/your-initials-short-description` (e.g., `feature/kk-add-product-search`)
   * Bug Fixes: `fix/your-initials-short-description` (e.g., `fix/kk-cart-total-bug`)

```bash
git checkout -b feature/your-initials-description
```

3. **Write Your Code:** Make your changes. Ensure your code is clean, commented where necessary, and follows the project's existing style.

* Run `pnpm validate` before committing to automatically fix linting and formatting issues.

4. **Commit Your Changes:** Write clear, concise commit messages that explain the "what" and "why" of your change. We follow the **Conventional Commits** standard.

**Good Commit Messages:**

```text
feat: Add search functionality to product list
fix: Correctly calculate sales tax in checkout
```

5. **Push to Your Fork:** Push your new branch to your personal fork on GitHub.

```bash
git push origin feature/your-initials-description
```

6. **Open a Pull Request (PR):**

* Go to your fork on GitHub. A "Compare & pull request" button should be visible.
* Ensure the "base" repository is `coding-pundit-nitap/main` and the "head" repository is your fork and feature branch.
* Fill out the pull request template with a clear description of your changes. If your PR fixes a known issue, reference it (e.g., "Fixes #42").

7. **Code Review:** One of the core team members will review your pull request. This is a collaborative process. We may ask for changes to maintain code quality and consistency. Please be responsive to feedback.

8. **Merge:** Once your PR is approved, a core team member will merge it into the main branch. Congratulations, you've successfully contributed to Campus Connect!

---

## 🛡️ Security Vulnerabilities

Please **DO NOT** report security vulnerabilities via public GitHub issues. Refer to our **Security Policy** for the procedure on how to disclose them responsibly.

---

Thank you for being a part of **Campus Connect**!
