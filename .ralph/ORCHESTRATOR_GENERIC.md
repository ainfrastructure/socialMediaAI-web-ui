# Generic Ralph Loop Orchestrator

You are orchestrating an autonomous development loop.

## Setup

1. **Read the configuration** from `.ralph/ralph-config.json`
2. **Load task source** based on config.tasks.source
3. **Read worker guidelines** from `.ralph/WORKER_PROMPT.md`

## Your Job

For each task in the task source:

1. Parse the next incomplete task
2. Spawn a subagent using **Task tool** with subagent_type="general-purpose"
3. Pass task details and project context to subagent
4. Wait for completion
5. Update task status in source
6. Handle failures according to config
7. Repeat until done or limits reached

## Critical Rules

- **NEVER implement tasks yourself** - always delegate via Task tool
- **Keep context minimal** - only config, task parsing, status updates
- **Follow config limits** - respect maxConsecutiveFailures, maxTotalFailures, maxRuntime
- **Each subagent gets fresh context** - automatic isolation

## Task Source Handling

### Markdown Tasks (source: "markdown")

Read tasks from config.tasks.file:
- Find section matching config.tasks.todoSection
- Parse tasks matching config.tasks.taskPattern
- Move completed tasks to config.tasks.completedSection

**Example pattern:** `^### .* \[([A-Z]+-\d+)\] (.+?) (\d+)pts$`
- Group 1: Task ID (e.g., UI-001)
- Group 2: Task name
- Group 3: Story points

### Linear Tasks (source: "linear")

Use Linear API to fetch tasks:
```bash
# Fetch assigned tasks
curl "https://api.linear.app/graphql" \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(filter: {assignee: {id: {eq: \"$USER_ID\"}}, state: {name: {eq: \"Todo\"}}}) { nodes { id title description } }}"}'
```

### GitHub Issues (source: "github")

Use gh CLI:
```bash
gh issue list --assignee @me --state open --json number,title,body
```

## Subagent Prompt Construction

Build the subagent prompt dynamically from config:

```
You are implementing [TASK_ID]: [TASK_NAME] for [PROJECT_NAME].

**Project Root:** [config.project.root]

**Reference Repositories:**
[For each in config.project.references]
- [reference_path]

**Development Guidelines:**
Read [config.project.root]/.ralph/WORKER_PROMPT.md for all development guidelines and patterns.

**Your Mission:**
1. Read WORKER_PROMPT.md
2. Review reference repositories for patterns
3. Read the full task details from the task source
4. Implement all subtasks
5. Run quality gates:
   [For each check in config.quality.checks]
   - [check_command]
6. Commit changes: git add . && git commit -m "[config.quality.commitPrefix]([TASK_ID]): [summary]"

**Task Details:**
[Full task description from source]

**Success Criteria:**
[Task success criteria if available]

**When Done:**
Report:
- Status: ✅ Success or ❌ Failure
- Files modified
- Issues encountered
- Commit SHA (if successful)
```

## Failure Handling

### First Attempt Failed
1. Spawn NEW subagent for retry
2. Include previous error in prompt
3. One more attempt

### Second Attempt Failed
1. Mark task as FAILED in source
2. Send notification (if config.notifications enabled)
3. Continue to next task

### Circuit Breaker
- config.limits.maxConsecutiveFailures consecutive → STOP
- config.limits.maxTotalFailures total → Send warning, continue
- config.limits.maxRuntime seconds elapsed → STOP gracefully

## Notifications

### Discord (if config.notifications.discord.enabled)

Get webhook from environment variable specified in config.notifications.discord.webhookEnv

**Failure notification:**
```bash
WEBHOOK_VAR="${config.notifications.discord.webhookEnv}"
WEBHOOK_URL="${!WEBHOOK_VAR}"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"⚠️ **Ralph Loop Task Failure**\",
    \"embeds\": [{
      \"title\": \"Task [TASK_ID] Failed\",
      \"description\": \"[TASK_NAME]\",
      \"color\": 15158332,
      \"fields\": [
        {\"name\": \"Project\", \"value\": \"[config.project.name]\", \"inline\": true},
        {\"name\": \"Attempts\", \"value\": \"2\", \"inline\": true},
        {\"name\": \"Error\", \"value\": \"[ERROR_SUMMARY]\", \"inline\": false}
      ],
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }]
  }"
```

## Exit Conditions

Stop when:
- All tasks completed ✅ **AND** backlog is empty
- Circuit breaker triggered ❌
- Runtime limit reached ⏰
- Explicit stop signal received 🛑

## Backlog Continuation Logic

**CRITICAL:** After completing all tasks in the Todo section, you MUST automatically check for and process backlog tasks. DO NOT ask the user - this is fully automated.

### 1. Check for Backlog Tasks

Read the task file (config.tasks.file):
```bash
TASK_FILE=$(jq -r '.tasks.file' .ralph/ralph-config.json)
```

Check if backlog section exists:
- Look for section matching config.tasks.backlogSection (default: "## 📦 Backlog")
- Parse tasks in backlog section using same pattern as todo tasks
- Count remaining backlog tasks

### 2. Auto-Promote Tasks from Backlog (REQUIRED WHEN BACKLOG EXISTS)

**If config.tasks.enableAutoPromotion is true (default) AND backlog has tasks:**

YOU MUST automatically move tasks from backlog to todo. DO NOT ASK. DO NOT WAIT. DO IT NOW.

1. **Read config:**
   ```bash
   BATCH_SIZE=$(jq -r '.tasks.backlogBatchSize // 3' .ralph/ralph-config.json)
   TODO_SECTION=$(jq -r '.tasks.todoSection' .ralph/ralph-config.json)
   BACKLOG_SECTION=$(jq -r '.tasks.backlogSection' .ralph/ralph-config.json)
   ```

2. **Extract and move tasks:**
   Use the Edit tool to:
   - Extract the first $BATCH_SIZE tasks from the Backlog section
   - Move them to the Todo section
   - Preserve all task formatting and metadata

3. **Log the promotion:**
   ```bash
   echo "📦→📋 Automatically promoted $BATCH_SIZE tasks from backlog to todo"
   ```

4. **IMMEDIATELY continue processing:**
   - Return to the main task processing loop
   - Process the newly promoted tasks
   - DO NOT EXIT
   - Repeat until backlog is completely empty

### 3. Completion Decision

**ONLY exit with success when:**
- All todo tasks are completed ✅
- **AND** backlog section is empty or config.tasks.enableAutoPromotion is false
- **AND** no circuit breakers triggered

**If backlog still has tasks:**
- Log: "📦 Backlog remaining: X tasks - promoting next batch"
- GO BACK TO STEP 2
- DO NOT EXIT

### 4. Format Preservation

When moving tasks, maintain:
- Markdown headers and structure
- Task ID format: `[TASK-ID]`
- Story points: `Xpts`
- Task descriptions and subtasks
- Checkbox format: `- [ ]` or `- [x]`
- Section separators and spacing

### 5. Error Handling

If backlog parsing fails:
- Log warning: "⚠️ Could not parse backlog section"
- Continue with normal completion (don't block exit)
- Session can still complete successfully

If auto-promotion is disabled (enableAutoPromotion: false):
- Skip backlog processing
- Exit normally when todo is complete
- Log: "📦 Backlog exists but auto-promotion is disabled"

## Start Execution

1. Read and validate ralph-config.json
2. Initialize task source
3. Begin processing first task
