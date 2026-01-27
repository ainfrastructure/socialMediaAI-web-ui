#!/usr/bin/env python3
"""
Autonomous Claude Code Loop
Uses Claude Code's Task tool to spawn agents that work through the task list.
No API costs - uses your existing Claude subscription!
"""

import os
import sys
import time
import subprocess
import re
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_DIR = Path.cwd()
TASK_FILE = PROJECT_DIR / ".ralph" / "fix_plan.md"
PROMPT_FILE = PROJECT_DIR / ".ralph" / "PROMPT.md"
SPECS_DIR = PROJECT_DIR / ".ralph" / "specs"
LOG_DIR = PROJECT_DIR / ".ralph" / "logs"
MAX_ITERATIONS = 100
PAUSE_BETWEEN_TASKS = 5  # seconds

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=None):
    """Print and log a message."""
    if color:
        print(f"{color}{message}{Colors.END}")
    else:
        print(message)

    # Also append to log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = LOG_DIR / f"autonomous_{timestamp}.log"
    with open(log_file, "a") as f:
        f.write(f"{datetime.now().isoformat()} - {message}\n")

def get_next_task():
    """Get the next unchecked task from the task list."""
    with open(TASK_FILE, "r") as f:
        for line in f:
            if line.strip().startswith("- [ ]"):
                # Extract task description
                task = line.strip()[6:]  # Remove "- [ ] "
                return task
    return None

def mark_task_complete(task_desc):
    """Mark a task as complete in the task file."""
    with open(TASK_FILE, "r") as f:
        content = f.read()

    # Replace first occurrence of unchecked task with checked
    updated = content.replace(f"- [ ] {task_desc}", f"- [x] {task_desc}", 1)

    with open(TASK_FILE, "w") as f:
        f.write(updated)

    log(f"✅ Marked task as complete: {task_desc}", Colors.GREEN)

def count_tasks():
    """Count completed and remaining tasks."""
    with open(TASK_FILE, "r") as f:
        content = f.read()

    completed = len(re.findall(r"- \[x\]", content))
    remaining = len(re.findall(r"- \[ \]", content))

    return completed, remaining

def run_quality_gates():
    """Run quality checks before committing."""
    log("🔍 Running quality gates...", Colors.BLUE)

    checks = [
        ("Type Check", ["npm", "run", "type-check"]),
        ("Lint", ["npm", "run", "lint"]),
        ("Build", ["npm", "run", "build"])
    ]

    for name, cmd in checks:
        log(f"  Running {name}...", Colors.BLUE)
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            log(f"  ❌ {name} failed!", Colors.RED)
            log(f"  Error: {result.stderr}", Colors.RED)
            return False
        else:
            log(f"  ✅ {name} passed", Colors.GREEN)

    return True

def create_backup_branch():
    """Create a backup branch before starting."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    branch_name = f"backup/claude-loop-{timestamp}"

    subprocess.run(["git", "branch", branch_name], check=True)
    log(f"💾 Created backup branch: {branch_name}", Colors.GREEN)
    return branch_name

def create_task_prompt(task_desc):
    """Create a detailed prompt for Claude Code to execute the task."""
    prompt = f"""# Implement Task: {task_desc}

## Your Mission
Complete this specific task as part of building a native iOS/Android app for Social Chef.

## Context
- **Web App Location**: `/Users/svendaneel/Desktop/Programming/socialMediaAI-web-ui`
- **Task List**: `.ralph/fix_plan.md` (mark this task complete when done)
- **Core Instructions**: `.ralph/PROMPT.md` (read this for patterns and standards)
- **API Reference**: `.ralph/specs/api-integration.md`
- **Requirements**: `.ralph/specs/requirements.md`

## Implementation Steps

1. **Understand the task**: Read the task description carefully
2. **Review web app**: Look at the existing Vue 3 web app for components/code to port
3. **Implement**: Write the code following mobile-first principles
4. **Test quality gates**:
   - Run: `npm run type-check` (must pass)
   - Run: `npm run lint` (must pass)
   - Run: `npm run build` (must pass)
5. **Commit**: If quality gates pass, commit with message: "feat: {task_desc}"
6. **Mark complete**: Update `.ralph/fix_plan.md` - change `- [ ]` to `- [x]` for this task

## Design Principles

- **Port, Don't Rewrite**: Copy and adapt from web app
- **Mobile-First**: Optimize for 375px-428px screens
- **Capacitor Integration**: Use Capacitor plugins for native features
- **Quiet Luxury Design**: Cream backgrounds (#f6f1e7), green accents (#0f3d2e)
- **Code Reuse**: Use existing Base components, stores, and services

## Quality Requirements

All code must:
- Pass TypeScript compilation
- Pass ESLint/Oxlint checks
- Build successfully
- Follow patterns in existing codebase

## When You're Done

1. Ensure all quality gates pass
2. Commit your changes
3. Update `.ralph/fix_plan.md` to mark this task: `- [x] {task_desc}`

That's it! Focus only on this one task.
"""
    return prompt

def main():
    """Main autonomous loop."""
    LOG_DIR.mkdir(exist_ok=True)

    log("=" * 60, Colors.BOLD)
    log("🤖 AUTONOMOUS CLAUDE CODE LOOP", Colors.BOLD)
    log("=" * 60, Colors.BOLD)
    log(f"📁 Project: {PROJECT_DIR}")
    log(f"📋 Task File: {TASK_FILE}")
    log(f"🎯 Max Iterations: {MAX_ITERATIONS}")
    log("")

    # Pre-flight checks
    if not TASK_FILE.exists():
        log(f"❌ Task file not found: {TASK_FILE}", Colors.RED)
        sys.exit(1)

    # Create backup
    backup_branch = create_backup_branch()
    log("")

    # Main loop
    iteration = 0

    while iteration < MAX_ITERATIONS:
        iteration += 1

        log("━" * 60, Colors.BOLD)
        log(f"🔄 Iteration {iteration}/{MAX_ITERATIONS}", Colors.BOLD)
        log("━" * 60, Colors.BOLD)

        # Get task counts
        completed, remaining = count_tasks()
        log(f"📊 Progress: {completed} completed, {remaining} remaining")
        log("")

        # Get next task
        next_task = get_next_task()

        if not next_task:
            log("✅ All tasks completed! Exiting loop.", Colors.GREEN)
            break

        log(f"📋 Next Task: {next_task}", Colors.YELLOW)
        log("")

        # Create task prompt
        task_prompt = create_task_prompt(next_task)

        # Save to temporary file
        temp_prompt_file = PROJECT_DIR / ".ralph" / ".current_task.md"
        with open(temp_prompt_file, "w") as f:
            f.write(task_prompt)

        log(f"📝 Task prompt saved to: {temp_prompt_file}", Colors.BLUE)
        log("")

        # THIS IS WHERE CLAUDE CODE INTEGRATION WOULD HAPPEN
        # In a true autonomous setup, this would spawn a Claude Code agent
        # For now, we'll output instructions

        log("=" * 60, Colors.BOLD)
        log("⏸️  MANUAL STEP (for now):", Colors.YELLOW)
        log("=" * 60, Colors.BOLD)
        log("")
        log("To process this task with Claude Code, run:")
        log(f"  claude ask --file {temp_prompt_file}", Colors.BLUE)
        log("")
        log("Or in your Claude Code session, paste:")
        log("-" * 60)
        print(task_prompt)
        log("-" * 60)
        log("")
        log("After Claude Code completes the task, press Enter to continue...")
        log("(Or Ctrl+C to stop the loop)")

        # Wait for user confirmation (in autonomous mode, this would auto-continue)
        try:
            input()
        except KeyboardInterrupt:
            log("\n\n⏹️  Loop stopped by user", Colors.YELLOW)
            break

        # Pause between tasks
        log(f"⏳ Pausing {PAUSE_BETWEEN_TASKS}s before next task...", Colors.BLUE)
        time.sleep(PAUSE_BETWEEN_TASKS)
        log("")

    # Summary
    log("=" * 60, Colors.BOLD)
    log("🏁 LOOP COMPLETE", Colors.BOLD)
    log("=" * 60, Colors.BOLD)

    completed, remaining = count_tasks()
    log(f"📊 Final Progress: {completed} completed, {remaining} remaining")
    log(f"🔄 Total Iterations: {iteration}")
    log(f"💾 Backup Branch: {backup_branch}")
    log("")
    log("Review your changes:")
    log(f"  git log --oneline --since='2 hours ago'", Colors.BLUE)
    log(f"  git diff {backup_branch}", Colors.BLUE)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("\n\n⏹️  Loop interrupted by user", Colors.YELLOW)
        sys.exit(0)
    except Exception as e:
        log(f"\n\n❌ Error: {e}", Colors.RED)
        sys.exit(1)
