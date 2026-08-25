# How to Set Up a Spare Mac for Codex to Fully Control

A step-by-step guide to turning a spare Apple Silicon Mac into an always-on Codex machine that can work with local files, run terminal commands, operate macOS applications through Computer Use, and be controlled from your phone or another computer.

> This guide is inspired by YK Dojo’s excellent [Claude Controls Mac](https://ykdojo.github.io/claude-controls-mac/) project, but the setup below is designed specifically for the current Codex experience in the ChatGPT desktop app and Codex CLI.
>
> Codex features change quickly. This guide was last verified against official OpenAI documentation on 11 August 2026.

## Why do this?

Codex is most useful when it can access a real development environment, run installed tools, inspect applications, and continue working while you are away from your desk.

Giving an AI agent broad access to your everyday computer carries obvious risk. Even with Codex’s sandbox, approvals, and application permissions, mistakes are possible. A dedicated Mac limits the potential damage and gives you an environment you can configure specifically for agent work.

The approach in this guide is:

- Use a spare Mac rather than your main computer.
- Start with a clean local account containing no personal data.
- Do not sign the Mac into your personal Apple Account.
- Install the ChatGPT desktop app as the main Codex host.
- Enable Codex Computer Use for graphical macOS tasks.
- Pair the host with the ChatGPT mobile app through Codex Remote.
- Retain SSH and Screen Sharing as administrative and recovery paths.
- Use Codex CLI for terminal-first work and repeatable automation.
- Keep permissions as narrow as practical, even on the isolated machine.

## Why this setup?

### Why not run Codex in a container?

Containers are excellent for isolated development tasks, but they cannot provide the full experience of a real Mac.

A container generally cannot:

- operate normal macOS applications;
- use Xcode and the macOS GUI in the same way as a logged-in user;
- reproduce bugs that occur only in native applications;
- interact with applications that expose no command-line or API interface;
- provide full macOS Computer Use.

A dedicated physical Mac gives Codex access to a genuine graphical login session while keeping that access away from your main machine.

### Why not use only Codex Cloud?

Codex Cloud is useful for repository-based software work, but it runs in an isolated cloud environment. It does not have access to the applications, files, credentials, devices, or graphical environment installed on your spare Mac.

This setup is intended for tasks such as:

- building and testing macOS or iOS applications;
- interacting with Xcode or the iOS Simulator;
- using desktop applications that do not expose an API;
- running local services and development environments;
- operating browser sessions configured on the spare Mac;
- performing work that depends on the local network;
- keeping a persistent, controllable agent host available from your phone.

### Why use the ChatGPT desktop app instead of only Codex CLI?

Codex CLI is excellent for terminal-based coding and automation, but Codex Remote and Computer Use are hosted by the ChatGPT desktop app.

The desktop app provides:

- Codex projects and persistent chats;
- multi-repository projects and combined review;
- Computer Use for seeing, clicking, and typing in Mac applications;
- remote access from the ChatGPT mobile app;
- chat handoff between connected hosts;
- a built-in browser, appshots, goals, hooks, plugins, and Record & Replay;
- screenshots, approvals, diffs, terminal output, and task status on your phone;
- multiple concurrent Codex chats;
- app-specific permissions;
- an option to keep the host awake while Remote is enabled.

Codex CLI remains useful alongside it for SSH sessions, scripts, unattended commands, and terminal-first development.

## What you will need

- A spare Apple Silicon Mac to use as the target.
- Your normal Mac or another computer for administration.
- An iPhone or Android phone with the current ChatGPT app.
- A ChatGPT account with Codex access.
- A reliable network connection.
- Optional: a Tailscale account for private access when away from home.
- Optional: a separate GitHub account for the agent machine.

---

## 1. Start fresh on the target Mac

### Erase it first if it contains personal data

Codex may eventually be able to read anything available to the account under which it runs. If the Mac contains files, browser profiles, messages, credentials, or applications you do not want exposed, erase it first.

On a supported Mac:

1. Open **System Settings**.
2. Go to **General → Transfer or Reset**.
3. Select **Erase All Content and Settings**.
4. Complete the normal macOS setup process.

Update macOS afterward:

**System Settings → General → Software Update**

### Create a dedicated local account

During setup:

- Create a new local user exclusively for Codex.
- Do not sign into your personal Apple Account.
- Do not enable iCloud Drive, Messages, Photos, Passwords, or personal Mail.
- Do not restore from a Time Machine backup.
- Do not import settings from your main Mac.

For the commands in this guide, the example account name is:

```text
codex
```

Replace it with the actual short username you create.

### Decide whether the account should be an administrator

An administrator account is convenient if you expect Codex to install packages, manage services, or configure development tools.

To enable it:

1. Open **System Settings → Users & Groups**.
2. Select the Codex account.
3. Enable **Allow this user to administer this computer**.

A safer alternative is to keep a separate administrator account for maintenance and run Codex under a standard account. That requires more manual intervention but limits what the agent can change.

For a dedicated, disposable lab Mac, an isolated administrator account is a reasonable compromise.

---

## 2. Give the target Mac a unique name

Give the spare Mac an obvious, unique hostname.

On the target:

```bash
sudo scutil --set ComputerName "Codex Mac"
sudo scutil --set HostName codex-mac
sudo scutil --set LocalHostName codex-mac
```

Confirm it:

```bash
scutil --get ComputerName
scutil --get HostName
scutil --get LocalHostName
```

On your local network, the machine should be reachable as:

```text
codex-mac.local
```

You can also find its current IP address with:

```bash
ipconfig getifaddr en0
```

The hostname is preferable because the IP address may change.

---

## 3. Enable Remote Login over SSH

SSH gives you a reliable administrative route even if the ChatGPT desktop app is closed or Remote is unavailable.

On the target Mac:

```bash
sudo systemsetup -setremotelogin on
```

If macOS reports that the command requires Full Disk Access:

1. Open **System Settings → Privacy & Security → Full Disk Access**.
2. Add Terminal.
3. Quit and reopen Terminal.
4. Run the command again.

You can also enable it through:

**System Settings → General → Sharing → Remote Login**

Restrict access to the Codex account rather than all users where possible.

Test from your main Mac:

```bash
ssh codex@codex-mac.local
```

Enter the target account password when prompted.

---

## 4. Set up passwordless SSH from your main Mac

On the main Mac, create an SSH key if you do not already have one:

```bash
ssh-keygen -t ed25519
```

Accept the default path unless you have a reason to use a dedicated key.

Copy the public key to the target:

```bash
ssh-copy-id codex@codex-mac.local
```

If `ssh-copy-id` is unavailable, use:

```bash
cat ~/.ssh/id_ed25519.pub | \
ssh codex@codex-mac.local \
'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

Test it:

```bash
ssh codex@codex-mac.local whoami
```

It should print:

```text
codex
```

without asking for the target account password.

### Add an SSH configuration entry

On your main Mac, edit:

```bash
nano ~/.ssh/config
```

Add:

```sshconfig
Host codex-mac
    HostName codex-mac.local
    User codex
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    UseKeychain yes
```

You can now connect with:

```bash
ssh codex-mac
```

---

## 5. Decide how sudo should work

The original Claude setup enables completely passwordless `sudo`. That is convenient, but it also removes an important safety boundary.

There are three reasonable options.

### Option A: Keep normal sudo prompts

This is the safest choice. Codex can perform normal user-level work, while you manually approve administrator changes.

Use this if the machine does not need to install or reconfigure system components frequently.

### Option B: Allow only specific administrator commands

This is usually the best compromise.

Create a dedicated sudoers file:

```bash
sudo visudo -f /etc/sudoers.d/codex-limited
```

For example:

```sudoers
codex ALL=(root) NOPASSWD: /opt/homebrew/bin/brew services *
codex ALL=(root) NOPASSWD: /usr/bin/pmset *
codex ALL=(root) NOPASSWD: /bin/launchctl *
```

The exact commands should match the work you expect the machine to perform.

Validate the file:

```bash
sudo visudo -cf /etc/sudoers.d/codex-limited
```

It must report that the file parsed correctly.

### Option C: Enable unrestricted passwordless sudo

Only use this on a dedicated machine that contains nothing important and can be erased without consequence.

```bash
echo "codex ALL=(ALL) NOPASSWD: ALL" | \
sudo tee /etc/sudoers.d/codex-nopasswd >/dev/null

sudo chmod 440 /etc/sudoers.d/codex-nopasswd
sudo visudo -cf /etc/sudoers.d/codex-nopasswd
```

Test it:

```bash
sudo -n true
```

The command succeeds silently if passwordless sudo is active.

> Passwordless sudo does not bypass Codex’s own sandbox or approval settings, but it means any command that does escape or receive approval can obtain root privileges without another human password prompt.

---

## 6. Keep the Mac awake

Codex Remote stops working if the host sleeps, goes offline, or closes the desktop app.

The ChatGPT desktop app has a built-in setting for this:

1. Open the ChatGPT desktop app.
2. Go to **Settings → Connections**.
3. Enable **Keep this Mac awake**.

This prevents sleep while the Mac is plugged in and remote access is enabled.

You can also configure macOS directly:

```bash
sudo pmset -c sleep 0
sudo pmset -c displaysleep 10
sudo pmset -c disksleep 0
sudo pmset -c powernap 1
sudo pmset -c tcpkeepalive 1
```

Verify:

```bash
pmset -g custom
```

For a Mac mini, this is generally sufficient.

For a genuinely headless Mac mini, it is also reasonable to disable display
sleep because there is no physical display to save:

```bash
sudo pmset -c sleep 0
sudo pmset -c displaysleep 0
sudo pmset -c disksleep 0
```

For a MacBook:

- keep it connected to power;
- leave the lid open; or
- connect an external display, keyboard, and pointing device for normal closed-lid operation.

Selecting **Sleep** manually will still make Remote unavailable.

### Disable automatic logout

Check:

**System Settings → Lock Screen**

Avoid settings that automatically log the user out after inactivity.

You may still allow the display to turn off. Computer Use on macOS supports locked use when configured, which is covered later.

---

## 7. Install Homebrew and basic tools

Install Homebrew on the target from its official installer:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

On Apple Silicon, add Homebrew to the shell environment:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Install a useful baseline:

```bash
brew install \
  git \
  gh \
  jq \
  ripgrep \
  fd \
  fzf \
  tmux \
  tree \
  wget
```

Optional development tools:

```bash
brew install \
  node \
  python \
  uv \
  go \
  rust
```

Install only what you actually expect Codex to use.

### Install Xcode tools

For normal command-line development:

```bash
xcode-select --install
```

For macOS or iOS application development, install full Xcode from the Mac App Store and open it once to complete first-run setup.

You may also need:

```bash
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
```

---

## 8. Install the ChatGPT desktop app

Since 9 July 2026, Codex has been part of the ChatGPT desktop app.

Download the current macOS Apple Silicon version from OpenAI and install it in `/Applications`.

Open the application and sign in with the ChatGPT account and workspace you intend to use.

Do this locally on the target Mac because the first-run flow may require:

- browser authentication;
- passkeys;
- multi-factor authentication;
- macOS Keychain access;
- workspace selection;
- application permissions.

### Keep the app running

For an always-on host:

1. Open **System Settings → General → Login Items & Extensions**.
2. Add ChatGPT under **Open at Login**, if it is not already present.
3. Launch ChatGPT and leave it running.

Remote access depends on:

- the Mac being awake;
- the user remaining logged in;
- the ChatGPT desktop app running;
- the host having internet access.

---

## 9. Install Codex CLI

Install Codex CLI on the target:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Restart the shell or load the relevant path configuration.

Confirm installation:

```bash
codex --version
```

Useful first-run checks inside Codex are:

```text
/init          create an AGENTS.md for the current project
/status        show the active model, permissions, and configuration
/permissions   choose the current permission profile
/model         choose a model and reasoning effort
/review        review repository changes
```

To check for updates, compare `codex --version` with the current stable release
and rerun the official installer when necessary. Also check the ChatGPT app's
updater, `softwareupdate -l`, and the official Codex changelog before declaring
an always-on host current.

Start Codex from a project folder:

```bash
mkdir -p ~/Projects
cd ~/Projects
codex
```

The first time it runs, choose **Sign in with ChatGPT** or another offered authentication method.

### Why install both the desktop app and CLI?

Use the desktop app for:

- Codex Remote;
- Computer Use;
- persistent visual projects;
- multiple concurrent chats;
- screenshots and graphical application work.

Use Codex CLI for:

- terminal-first development;
- SSH sessions;
- scripts and repeatable jobs;
- `codex exec`;
- quick repository work;
- environments where no graphical interface is needed.

The two complement each other rather than replacing one another.

---

## 10. Configure Codex permissions

Codex uses two main security layers:

- **Sandbox mode:** what commands are technically able to access.
- **Approval policy:** when Codex must stop and ask before acting.

By default, local Codex work normally has no command-line network access and write access is restricted to the active workspace.

The main configuration file is:

```text
~/.codex/config.toml
```

Create it if necessary:

```bash
mkdir -p ~/.codex
touch ~/.codex/config.toml
```

### Recommended starting configuration

A reasonable starting point for the isolated Mac is:

```toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[sandbox_workspace_write]
network_access = true
```

This allows Codex to work inside the selected project and use the network, while asking when it needs to go beyond the configured boundary.

`network_access = true` permits broad outbound command-line access. Current
Codex can optionally constrain that traffic with the network proxy:

```toml
[features.network_proxy]
enabled = true
domains = {
  "github.com" = "allow",
  "api.github.com" = "allow",
  "**.openai.com" = "allow"
}
```

The proxy is allowlist-first and does not grant network access by itself; keep
`sandbox_workspace_write.network_access = true` when using it. Add local or
private-network destinations only when a workflow genuinely needs them.

Codex also supports reusable permission profiles through
`default_permissions`. Profiles are a newer composable alternative to the
legacy `sandbox_mode` configuration. Do not configure both styles at once.

Because configuration names can evolve, confirm the active policy in Codex with:

```text
/permissions
```

### Avoid immediately disabling every safeguard

Even on an isolated machine, unrestricted access can produce inconvenient or destructive results:

- deleting repositories;
- overwriting configuration;
- uninstalling applications;
- changing firewall or network settings;
- exposing secrets in logs;
- committing credentials;
- sending unintended messages;
- modifying accounts or cloud resources.

Start with normal project boundaries. Broaden access only for workflows that genuinely require it.

### Use project-specific configuration where appropriate

Codex can load project configuration from:

```text
<project>/.codex/config.toml
```

This is useful when one repository needs a different toolchain or permission boundary.

Codex only applies project-scoped configuration after you trust the project.

---

## 11. Add persistent instructions with `AGENTS.md`

Codex reads `AGENTS.md` files as project instructions.

Create a general file in each important repository:

```markdown
# AGENTS.md

## Working rules

- Read the repository before changing anything.
- Keep changes focused on the requested task.
- Run the relevant tests after every meaningful change.
- Do not commit secrets, generated credentials, or local configuration.
- Create a Git checkpoint before risky migrations.
- Prefer command-line tools and structured APIs over GUI automation.
- Use Computer Use only when a workflow cannot be completed reliably through files, shell commands, an API, a plugin, or MCP.
- Do not publish, deploy, merge, purchase, send, or delete without explicit approval.
- Document material changes in the repository README or project notes.
```

Add project-specific details such as:

- build commands;
- test commands;
- architecture;
- formatting conventions;
- deployment restrictions;
- directories Codex should not modify;
- secrets policy;
- definition of done.

This is the Codex equivalent of maintaining a carefully written persistent Claude environment file.

---

## 12. Sign in to GitHub

Install GitHub CLI if you skipped the Homebrew step:

```bash
brew install gh
```

Authenticate:

```bash
gh auth login
```

For an isolated agent machine, consider using a separate GitHub account with access only to the repositories Codex should operate.

Recommended safeguards:

- grant repository access selectively;
- require pull requests rather than allowing direct pushes to protected branches;
- enable branch protection;
- prevent the agent account from administering the organisation;
- avoid storing broad personal access tokens in shell files;
- use short-lived or narrowly scoped credentials where possible.

Confirm authentication:

```bash
gh auth status
```

Configure Git:

```bash
git config --global user.name "Codex Mac"
git config --global user.email "YOUR_AGENT_ACCOUNT_EMAIL"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

On a machine where multiple agents share repositories, a global Git identity
may be inappropriate. Use repository-local configuration or inline identity
overrides instead, for example:

```bash
git -c user.name="Agent Name" -c user.email="agent@agents.local" commit
```

---

## 13. Set up Computer Use

Computer Use allows Codex to see and operate graphical macOS applications.

Unlike the Claude Code setup that inspired this guide, the current Codex architecture does not require a `tmux` LaunchAgent workaround. Computer Use runs through the logged-in ChatGPT desktop host and receives macOS permissions directly.

### Install and enable the Computer Use plugin

On the target Mac:

1. Open the ChatGPT desktop app.
2. Select **Codex**.
3. Open **Plugins → Computer Use**.
4. Select **Install plugin** if prompted.
5. Enable the Computer Use server and skill toggles.
6. Select **Try now**.

### Grant macOS permissions

macOS will request:

- **Screen Recording** so Codex can see applications.
- **Accessibility** so Codex can click, type, and navigate.

You can verify them manually:

1. Open **System Settings → Privacy & Security**.
2. Open **Screen Recording**.
3. Enable **Codex Computer Use** or the corresponding ChatGPT/Codex entry.
4. Open **Accessibility**.
5. Enable the same component.
6. Restart the ChatGPT desktop app if requested.

These permissions require human approval. Codex cannot safely grant them to itself.

### Review application access

In the ChatGPT desktop app:

1. Open **Settings → Computer Use**.
2. Review the general control setting.
3. Review applications listed under **Always-allowed apps**.
4. Remove applications Codex should no longer use.

The first time Codex attempts to use an application, it may ask you to approve access. Choose **Always allow** only for applications you expect it to operate regularly.

### Test it

Start a Codex chat and use a narrowly scoped prompt:

```text
Use Computer Use to open Calculator, calculate 27 × 43, report the result, and then close Calculator. Do not interact with any other application.
```

You can also mention:

```text
@Computer
```

or a supported application directly in the prompt.

### Prefer structured tools whenever possible

The preferred order is:

1. command-line tools;
2. files and application-native automation;
3. plugins or APIs;
4. MCP servers;
5. a purpose-built browser integration;
6. raw Computer Use.

Computer Use is valuable, but visual automation is less deterministic than structured interfaces.

### Appshots and Record & Replay

Appshots let you send the frontmost Mac app window and available text to Codex
by pressing both Command keys. They are useful when Codex needs context from an
app but does not need to control it.

Record & Replay can turn a workflow you demonstrate on macOS into a reusable
skill. Use it for repetitive visual workflows that are easier to show than
describe, then inspect and narrow the generated skill before relying on it.

---

## 14. Enable locked Computer Use

By default, graphical tasks may be interrupted when the Mac locks.

On macOS, ChatGPT supports **locked use**, which allows Computer Use to continue after the Mac locks once explicitly configured.

Open:

**ChatGPT → Settings → Computer Use**

Enable the locked-use option and follow the macOS authorization flow. This may install an Apple authorization plug-in that participates in the macOS unlock process.

Treat this as a high-trust feature. Enable it only on the isolated Codex Mac, not on a computer containing personal information.

After enabling it:

1. Start a harmless Computer Use task.
2. Lock the Mac.
3. Confirm from your phone that the task can still proceed.
4. Verify that Screen Sharing and local login still operate normally.

Keep a separate administrator account available in case you need to repair the login configuration.

---

## 15. Pair the Mac with your phone using Codex Remote

Codex Remote lets you start and continue work on the target Mac from the ChatGPT mobile app.

Remote access uses the host Mac’s:

- projects;
- chats;
- local files;
- credentials;
- permissions;
- plugins;
- Computer Use setup;
- browser configuration;
- installed tools.

### Before pairing

Make sure:

- the latest ChatGPT desktop app is running on the target;
- the latest ChatGPT mobile app is installed;
- both use the same ChatGPT account and workspace;
- the target is awake and online;
- any required MFA, SSO, or passkey is available;
- Remote Control is permitted by your workspace administrator, if applicable.

### Pair the phone

On the target Mac:

1. Open the ChatGPT desktop app.
2. Select **Set up Remote** in the sidebar.
3. A QR code appears.

On the phone:

1. Scan the QR code.
2. ChatGPT opens the Remote setup flow.
3. Confirm the account and workspace.
4. Complete any authentication steps.
5. The Mac appears under **Remote** in the mobile app.

Each phone must be paired separately with each host.

### Manage paired devices

On the target:

**ChatGPT → Settings → Connections → Control this Mac**

Review:

- devices allowed to control the Mac;
- whether Remote connections are enabled;
- the keep-awake setting;
- Computer Use status;
- browser integration status.

Remove any device you no longer recognise or use.

### What you can do from the phone

From **Remote** in the ChatGPT mobile app, you can:

- start a new Codex chat on the host;
- continue an existing chat;
- send follow-up instructions;
- answer Codex questions;
- approve commands and actions;
- review diffs and test output;
- view terminal output;
- inspect screenshots;
- switch between connected hosts;
- receive notifications when work completes or needs attention.

This replaces the Claude guide’s `claude remote-control` server and its `ic rc` wrapper.

---

## 16. Use Codex Remote with Voice

ChatGPT Voice can be used with Codex through Remote on iOS after the phone is
paired with the desktop host. This gives you a live spoken conversation that
can start work, check progress, steer active tasks, and report blockers or
results while the Mac supplies the files, tools, credentials, and execution
environment.

Availability depends on your ChatGPT plan, rollout, and workspace settings.
Voice is currently documented for Plus, Pro, Business, Edu, and Enterprise
plans. An administrator may need to enable the relevant features in a managed
workspace.

### Start a Remote voice conversation

1. Confirm that the host Mac is awake, online, signed in, and running the
   ChatGPT desktop app.
2. On the iPhone, open the ChatGPT mobile app and select **Remote**.
3. Select the paired Mac and open a new, empty chat or task.
4. Select **Start new voice chat** before sending any other message.
5. The first time, allow microphone access and choose a voice.
6. Start talking. Select **End** when you finish.

The chat must begin in Voice mode. If you type or send a normal message first,
the microphone provides voice dictation rather than a live Voice conversation.
To resume a previous Voice conversation, open it and select **Start voice
chat**.

Only one Voice conversation can be active across the desktop app at a time.
Voice has a separate, plan-dependent allowance, while tasks it starts continue
to use the normal Codex usage budget.

### Useful Remote Voice workflows

Voice can create separate threads for longer-running work, check active
threads, and send follow-up instructions. Suitable prompts include:

```text
Start a Codex task to run this project's tests and investigate the first
failure. Do not change anything until you have explained the cause to me.
```

```text
Check my active Codex tasks and give me a short spoken summary of progress,
blockers, and anything waiting for approval.
```

```text
Help me think through this problem aloud. Turn our discussion into a plan,
then start a separate task only after I approve the plan.
```

Other useful patterns include spoken meeting preparation, a morning rundown,
walking through an inbox one message at a time without sending anything, and
steering a long-running task while away from the desk.

### Permissions and screen context

Voice-directed work uses the same permissions and approvals as Chat, Work, and
Codex in the desktop app. Watch the phone for approval requests: a task may be
waiting even when the conversation sounds as though it is still checking.

On macOS, **Settings → Voice → Screen context** lets you say “Take a look at
this” and provide an appshot of the frontmost window. An appshot may include
the window image and accessible text, including text outside the visible scroll
area. Keep sensitive applications closed and inspect the frontmost window
before sharing screen context.

If Voice is unavailable:

- update both the desktop and mobile apps;
- confirm that the phone and host use the same account and workspace;
- check plan, rollout, region, and workspace-admin availability;
- check microphone access;
- confirm that another Voice conversation is not already active;
- verify that the host is awake, online, and still running the desktop app.

---

## 17. Control the Codex Mac from another desktop

Codex Remote can also be available between supported desktop devices.

On the target Mac:

- enable **Control this Mac**.

On the source computer:

1. Open the ChatGPT desktop app.
2. Go to **Settings → Connections → Control other devices**.
3. Complete the pairing flow.
4. Select the Codex Mac as the host.

This gives you a richer interface than a raw SSH terminal because you can see Codex projects, approvals, screenshots, diffs, and task state.

SSH remains useful for low-level administration.

### Connect projects on SSH hosts and hand off chats

The desktop app can discover concrete aliases from `~/.ssh/config`, start the
Codex app server over SSH, and run a project against the remote filesystem. The
remote host needs `codex` installed, authenticated, and available on the remote
login shell's `PATH`.

After the same repository and project path are saved on two connected hosts,
Codex can hand off a chat and its Git state between them. The destination uses
or creates a worktree so the conversation can continue from matching project
state. Do not expose Codex app-server transports directly to a LAN or the public
internet; use SSH and a VPN or mesh network.

---

## 18. Enable Screen Sharing

Screen Sharing is your recovery and manual-control route.

On the target Mac:

1. Open **System Settings → General → Sharing**.
2. Enable **Screen Sharing**.
3. Allow access for the Codex user or selected users.

From the main Mac:

```bash
open vnc://codex@codex-mac.local
```

Enter the target account password and optionally save it in Keychain.

Screen Sharing is useful when:

- a macOS permission prompt requires human input;
- a browser login needs to be completed;
- Computer Use cannot reach an application;
- the desktop app has stopped;
- the Mac needs to be unlocked;
- you need to inspect exactly what the agent is doing.

Do not expose VNC directly to the public internet.

---

## 19. Add Tailscale for access away from home

`.local` hostnames work only on the local network. Tailscale provides encrypted private connectivity without exposing SSH or Screen Sharing publicly.

### Install Tailscale on the target

The graphical application is the simplest option:

```bash
brew install --cask tailscale
```

Open Tailscale and sign in.

Alternatively, install the command-line service:

```bash
brew install tailscale
sudo brew services start tailscale
sudo tailscale up --operator=codex
```

Complete the login URL shown in the terminal.

### Install it on your main Mac

```bash
brew install --cask tailscale
```

Sign into the same tailnet.

With MagicDNS enabled, the target may be reachable as:

```bash
ssh codex@codex-mac
```

Update your SSH configuration:

```sshconfig
Host codex-mac
    HostName codex-mac
    User codex
    IdentityFile ~/.ssh/id_ed25519
```

Screen Sharing can also use the Tailscale hostname:

```bash
open vnc://codex@codex-mac
```

### Recommended Tailscale settings

In the Tailscale admin console:

- enable device approval;
- use access controls to limit which devices can reach the Codex Mac;
- disable key expiry for the always-on host if appropriate;
- do not enable public sharing or Funnel unless there is a specific need;
- remove old or unrecognised devices.

Test from a different network, such as a phone hotspot:

```bash
ssh codex-mac whoami
```

---

## 20. Add clipboard transfer over SSH

For text, macOS already includes `pbcopy` and `pbpaste`.

### Send the main Mac clipboard to the target

```bash
pbpaste | ssh codex-mac pbcopy
```

### Retrieve the target clipboard

```bash
ssh codex-mac pbpaste | pbcopy
```

Create aliases on the main Mac:

```bash
cat >> ~/.zshrc <<'EOF'
alias codex-clip-send='pbpaste | ssh codex-mac pbcopy'
alias codex-clip-get='ssh codex-mac pbpaste | pbcopy'
EOF
```

Reload the shell:

```bash
source ~/.zshrc
```

Usage:

```bash
codex-clip-send
codex-clip-get
```

Avoid copying important credentials into the target clipboard unless necessary. Prefer password managers, device-code authentication, or narrowly scoped tokens.

---

## 21. Configure browser access

Codex can work with browsers through several routes.

Prefer, in order:

1. the built-in Codex browser for local web application testing;
2. a supported Chrome integration;
3. Playwright or another browser MCP server;
4. Computer Use.

### Optionally install Chrome

Chrome is not required for the built-in Codex browser. Install it when Codex
needs an existing Chrome session, the supported extension, or Chrome DevTools
Protocol access.

```bash
brew install --cask google-chrome
```

Open Chrome once and create a dedicated browser profile for the Codex Mac.

Do not sign this profile into your personal Google account unless the agent genuinely needs access to it.

### Connect the supported browser integration

In the ChatGPT desktop app:

1. Open **Settings → Computer Use** or the relevant browser settings.
2. Install or connect the supported Chrome extension when offered.
3. Approve the connection.
4. Confirm Chrome appears as connected.

The browser integration can be more reliable than coordinate-based clicking because it provides structured browser controls.

### Use a separate browser profile

Create a profile containing only the services Codex needs.

Recommended:

- a separate Google account;
- separate GitHub account;
- no saved payment cards;
- no personal email;
- no personal password vault;
- minimal cookies and sessions;
- MFA on important accounts.

---

## 22. Add MCP servers and plugins

MCP gives Codex structured access to external tools and context.

Use MCP when a task would otherwise require fragile visual interaction.

Examples include:

- browser automation;
- design tools;
- documentation systems;
- databases;
- project-management platforms;
- local developer services.

Inspect available MCP commands:

```bash
codex mcp --help
```

Store user-level configuration in:

```text
~/.codex/config.toml
```

When adding an MCP server:

- verify the package and publisher;
- understand what files and credentials it can access;
- avoid running unknown packages with unrestricted permissions;
- use environment-specific credentials;
- review whether the server exposes destructive actions;
- test it in a disposable project first.

Plugins installed in the ChatGPT desktop app can also expose skills, tools, and connected services to Codex.

---

## 23. Create a dedicated projects directory

Keep agent-accessible work in a clear boundary:

```bash
mkdir -p ~/Projects
mkdir -p ~/Workspace
mkdir -p ~/Scratch
```

Suggested use:

- `~/Projects` — Git repositories and long-lived work.
- `~/Workspace` — documents, exports, and active non-code projects.
- `~/Scratch` — disposable downloads and temporary experiments.

Avoid granting Codex broad access to the whole home directory when a project folder is enough.

For each repository:

```bash
cd ~/Projects
git clone git@github.com:YOUR_ACCOUNT/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Create an initial checkpoint before assigning major work:

```bash
git status
git add -A
git commit -m "Checkpoint before Codex work"
```

---

## 24. Create useful shell helpers

On the main Mac, add the following to `~/.zshrc`:

```bash
export CODEX_BOX="codex-mac"

alias cxssh='ssh "$CODEX_BOX"'
alias cxvnc='open "vnc://codex@codex-mac"'
alias cxstatus='ssh "$CODEX_BOX" "uptime; echo; pmset -g batt; echo; pgrep -fl ChatGPT || true"'
alias cxprojects='ssh "$CODEX_BOX" "find ~/Projects -maxdepth 2 -name .git -type d -print | sed s#/.git##"'
alias cxclip-send='pbpaste | ssh "$CODEX_BOX" pbcopy'
alias cxclip-get='ssh "$CODEX_BOX" pbpaste | pbcopy'
```

Reload:

```bash
source ~/.zshrc
```

Usage:

```bash
cxssh
cxvnc
cxstatus
cxprojects
cxclip-send
cxclip-get
```

These helpers do not replace Codex Remote. They provide simple administrative access when the app is unavailable.

---

## 25. Set up repeatable Codex CLI tasks

Codex CLI supports non-interactive execution through `codex exec`.

A simple example:

```bash
cd ~/Projects/example-project

codex exec \
  "Run the test suite, identify the first failing test, explain the cause, and make the smallest safe fix. Do not commit or push."
```

For scheduled or repeatable work, wrap commands in scripts rather than handing Codex an unrestricted shell objective.

Example:

```bash
mkdir -p ~/bin

cat > ~/bin/codex-project-check <<'EOF'
#!/bin/zsh
set -euo pipefail

PROJECT="$HOME/Projects/example-project"
cd "$PROJECT"

git status --short

codex exec \
  "Review the current repository state. Run the existing lint and test commands. Fix only clear regressions caused by the current uncommitted changes. Do not commit, push, deploy, change dependencies, or modify secrets."
EOF

chmod +x ~/bin/codex-project-check
```

The more autonomous the workflow, the narrower and more explicit its boundaries should be.

> Older examples may use `codex exec --full-auto`. That flag is deprecated;
> prefer `codex exec --sandbox workspace-write` and an explicit approval policy.

---

## 26. Install other applications

Once Computer Use works, Codex can help install and configure applications, but some steps will still require you.

Common human-only steps include:

- entering passwords;
- approving macOS privacy prompts;
- approving kernel, network, or system extensions;
- signing into Apple or developer services;
- accepting licences;
- completing CAPTCHAs;
- confirming purchases;
- approving security-sensitive actions.

A suitable prompt is:

```text
Install Visual Studio Code from the official source. Stop before entering credentials, approving macOS security prompts, or changing system-wide privacy settings. Tell me exactly what requires manual action.
```

This pattern works for:

- Xcode support tools;
- IDEs;
- VPN clients;
- design applications;
- media applications;
- database tools;
- local server software.

---

## 27. Test the complete setup

Run these tests in order.

### Test 1: SSH

From the main Mac:

```bash
ssh codex-mac whoami
```

Expected:

```text
codex
```

### Test 2: Host persistence

Reboot the target:

```bash
ssh codex-mac 'sudo reboot'
```

After it returns:

- confirm the user session is logged in;
- confirm ChatGPT opened;
- confirm the host appears in Remote;
- confirm SSH works.

### Test 3: Codex CLI

```bash
ssh -t codex-mac 'cd ~/Projects && codex'
```

Ask it to inspect a harmless folder.

### Test 4: Computer Use

From the desktop app or Remote:

```text
Use Computer Use to open TextEdit, create a new document containing “Codex Mac computer-use test”, save it as ~/Workspace/computer-use-test.txt, close TextEdit, and verify the file exists from the terminal.
```

### Test 5: Mobile Remote

From the ChatGPT mobile app:

1. Open **Remote**.
2. Select the Codex Mac.
3. Start a new Codex chat.
4. Ask it to run:

```bash
uname -a
```

5. Review the terminal output from the phone.

### Test 6: Approval flow

Ask Codex to perform an action that requires approval, such as installing a harmless Homebrew package.

Confirm that the approval request appears on the phone.

### Test 7: Locked use

Start a harmless graphical task, lock the target, and confirm the task can continue.

### Test 8: Remote network

Move the main Mac to another network and test Tailscale SSH:

```bash
ssh codex-mac uptime
```

### Test 9: Recovery

Quit the ChatGPT app remotely:

```bash
ssh codex-mac 'osascript -e '\''quit app "ChatGPT"'\'''
```

Confirm Remote disconnects.

Restart it:

```bash
ssh codex-mac 'open -a ChatGPT'
```

Confirm the host returns.

---

## 28. Recommended operating model

The most reliable pattern is to use the least fragile tool available.

### For repositories and code

Use:

- Codex desktop projects;
- Codex CLI;
- Git;
- GitHub CLI;
- build scripts;
- tests;
- linters;
- structured logs.

### For browser work

Use:

- the built-in browser;
- a supported browser integration;
- Playwright or browser MCP;
- Computer Use only where necessary.

### For macOS applications

Use:

- native command-line interfaces;
- AppleScript or Shortcuts where appropriate;
- plugins or APIs;
- Computer Use for visual-only workflows.

### For ongoing work

Use:

- Codex Remote to start and steer tasks;
- notifications for approvals and completion;
- SSH for maintenance;
- Screen Sharing for recovery;
- Git checkpoints for reversibility.

---

## 29. Security checklist

Before treating the Mac as an autonomous host, confirm:

- [ ] The Mac contains no personal files.
- [ ] No personal Apple Account is signed in.
- [ ] FileVault is enabled.
- [ ] A separate local account is used for Codex.
- [ ] SSH uses keys rather than a weak password.
- [ ] SSH is not exposed directly to the public internet.
- [ ] Tailscale device approval or equivalent controls are enabled.
- [ ] GitHub access is limited to required repositories.
- [ ] Branch protection is enabled for important repositories.
- [ ] No personal browser profile is installed.
- [ ] No saved payment methods are available.
- [ ] Codex permissions have been reviewed.
- [ ] Computer Use application approvals have been reviewed.
- [ ] Destructive actions still require approval.
- [ ] Important work is version-controlled and backed up.
- [ ] A separate administrator or recovery route exists.
- [ ] Screen Sharing works.
- [ ] You are prepared to erase and rebuild the machine.

---

## 30. Important limitations

This setup creates a capable agent host, not a perfectly reliable autonomous employee.

Expect occasional problems involving:

- graphical layouts changing;
- applications updating;
- permission prompts reappearing;
- browser sessions expiring;
- CAPTCHAs;
- MFA challenges;
- locked or logged-out sessions;
- network interruptions;
- unexpected application dialogs;
- Codex asking for clarification or approval;
- long-running GUI flows losing state;
- tasks requiring judgement that should not be delegated.

The most reliable autonomous workflows are those with:

- a narrow objective;
- clear inputs and outputs;
- explicit restrictions;
- deterministic command-line tools;
- tests or validation steps;
- reversible changes;
- no access to sensitive personal accounts;
- human approval before external side effects.

---

## 31. Final architecture

The finished setup looks like this:

```text
                         ┌──────────────────────────┐
                         │ ChatGPT mobile app       │
                         │ Codex Remote             │
                         │ approvals and steering   │
                         └────────────┬─────────────┘
                                      │
                               OpenAI Remote
                                      │
┌──────────────────────┐     ┌───────▼─────────────────────────┐
│ Main Mac             │     │ Spare Apple Silicon Mac         │
│                      │     │                                 │
│ ChatGPT desktop      │◄───►│ ChatGPT desktop / Codex host    │
│ SSH administration   │     │ Codex Computer Use              │
│ Screen Sharing       │     │ Codex CLI                       │
│ Tailscale            │     │ projects, tools, MCP, browser   │
└──────────┬───────────┘     └──────────────┬──────────────────┘
           │                                 │
           └──────── Tailscale / LAN ────────┘
```

The important distinction from the Claude-based guide is that Codex Remote and Computer Use are first-class features of the logged-in ChatGPT desktop host.

You do not need to force an SSH-launched agent into a GUI-owned `tmux` process. Use the desktop app for graphical control and mobile access; use SSH and Codex CLI for terminal work, administration, and recovery.

---

## Reference links

- [Original Claude Controls Mac guide](https://ykdojo.github.io/claude-controls-mac/)
- [Original Claude Controls Mac repository](https://github.com/ykdojo/claude-controls-mac)
- [Codex CLI documentation](https://learn.chatgpt.com/docs/codex/cli)
- [Codex Remote connections](https://learn.chatgpt.com/docs/remote-connections)
- [ChatGPT Voice](https://learn.chatgpt.com/docs/features/voice)
- [Codex Computer Use](https://learn.chatgpt.com/docs/computer-use)
- [Codex agent approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [What's new in ChatGPT and Codex](https://learn.chatgpt.com/docs/whats-new)
- [Codex changelog](https://learn.chatgpt.com/docs/changelog)

## Attribution

This guide deliberately follows the general progression and practical spirit of YK Dojo’s **Claude Controls Mac** guide while adapting the implementation for Codex.

The original guide and scripts remain the work of their respective author. This document is an independent Codex-specific adaptation and is not affiliated with or endorsed by YK Dojo or OpenAI.
