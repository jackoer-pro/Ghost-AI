# Ghost AI — AI Workflow Rules

## 1. Primary Objective

Act as a software engineering implementation agent for Ghost AI.

The developer remains responsible for:
- Product decisions.
- System architecture.
- Feature requirements.
- Scope decisions.
- Reviewing implementation.
- Approving changes.

The agent is responsible for implementing approved specifications within the established architecture.

## 2. Context Loading

Before implementing any feature, read:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-context.md`
4. `context/code-standards.md`
5. `context/ai-workflow-rules.md`
6. `context/progress-tracker.md`

Also read the relevant feature specification.

The repository's root `AGENTS.md` is the entry point that connects these documents.

## 3. Spec-Driven Development

Every feature must have a dedicated specification.

Each specification should define:
- Goal.
- Design decisions.
- Implementation details.
- Dependencies.
- Verification checklist.

Do not implement vague requests when a feature specification is required.

## 4. One Feature at a Time

- Implement one feature unit or subsystem at a time.
- Avoid combining unrelated system boundaries.
- Do not expand the scope of the current feature.
- Complete and verify the current feature before moving to the next one.

## 5. Implementation Workflow

For every feature:

1. Read the relevant feature specification.
2. Read the six context files.
3. Inspect the existing repository.
4. Update `progress-tracker.md` to mark the feature as in progress.
5. Develop an implementation plan.
6. Implement exactly what the specification requires.
7. Verify the implementation against the checklist.
8. Update the progress tracker.
9. Report completion and outstanding issues.

## 6. Missing Requirements

If a requirement is unclear:
- Do not invent a new requirement.
- Do not silently change architectural decisions.
- Record unresolved questions in `progress-tracker.md`.
- Ask the developer for clarification when the decision affects implementation.

## 7. Architecture Protection

Never violate the established system invariants.

Examples:
- Do not implement long-running AI generation inside Next.js request handlers.
- Do not bypass project membership checks.
- Do not store large artifacts in PostgreSQL when Blob storage is intended.
- Do not introduce a second real-time collaboration implementation.
- Do not introduce unnecessary client components.

## 8. Keep Documentation in Sync

When implementation changes an architectural decision:
1. Identify the affected context document.
2. Update the relevant document.
3. Record the reason for the change.
4. Ensure subsequent features follow the updated decision.

Always update `progress-tracker.md` after meaningful implementation changes.

## 9. Debugging Workflow

For significant errors, use a dedicated temporary file:

`context/current-issues.md`

Include:
- Error message.
- Relevant context.
- Steps to reproduce.
- Expected behaviour.
- Actual behaviour.
- Relevant files.

Ask the agent to analyse the issue and propose a root-cause explanation before executing a fix.

Do not enter an uncontrolled cycle of repeated fixes that modify unrelated parts of the codebase.

Remove or gitignore temporary debugging information before committing. Never include secrets or authentication tokens in this file.

## 10. Review and Git Workflow

- Work on the development branch.
- Keep feature changes focused.
- Review changes before committing.
- Push completed work to GitHub.
- Create a pull request from development to main.
- Run CodeRabbit review.
- Address relevant findings.
- Merge only after review.

The main branch is used for production deployment.

## 11. External Documentation and Agent Skills

Use official documentation and relevant agent skills for:
- Clerk.
- Liveblocks.
- Trigger.dev.
- Prisma.

When appropriate, install the official skills using the `npx skills` ecosystem.

Do not rely on outdated training data when an installed framework or external service has changed its API.

## 12. Completion Requirements

A feature is not complete until:
- Its required functionality works.
- Its verification checklist passes.
- TypeScript checks pass.
- Linting passes.
- The production build passes where required.
- Existing architectural invariants remain intact.
- The progress tracker is updated.

## 13. Communication

For each feature, report:
- What was implemented.
- Files created or modified.
- Important technical decisions.
- Verification results.
- Outstanding issues.

Do not claim successful checks that were not executed.