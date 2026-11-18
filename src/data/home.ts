// Words for the home page and /run. Personal details (education, location,
// email, phone, LinkedIn) are left out until the owner approves each one
// (CLAUDE.md, Rule 2). Home-server details stay at the level Rule 1 allows.

export const home = {
	statement: 'I learn distributed systems by breaking them on purpose, then measuring the fix.',
	about:
		'Each project starts from an incident a real company wrote about. I rebuild the system at a scale I can run on a laptop, reproduce the failure with a naive version and measure it, then fix it and measure again, with the conditions written down. The naive version stays in the code, so anyone can rerun the failure.',
	facts: [
		{ label: 'Works in', value: '.NET, Python, PostgreSQL, Redis, Kafka' },
		{ label: 'Learns from', value: 'Slack, Razorpay and Grab engineering write-ups' },
		{ label: 'Runs', value: 'my own apps on a k3s cluster at home' },
	],
	elsewhere: [
		{ name: 'GitHub', href: 'https://github.com/Kar6677thik', note: 'all the code' },
		{ name: 'Handbook', href: 'https://book.karthiksurkanti.in/', note: 'how the home server runs' },
		{ name: 'What I run', href: '/run/', note: 'the apps at home' },
	],
	running: [
		{
			id: 'orbit',
			name: 'Orbit',
			short: 'cluster console',
			what: 'A private console for the home cluster, and the app catalog that turns a reviewed spec into a hardened deployment. It can read the cluster but never change it; releases happen from my laptop with short-lived, single-app credentials.',
			stack: 'ASP.NET Core, Angular',
			reach: 'private',
		},
		{
			id: 'identity',
			name: 'Identity',
			short: 'OAuth for my MCPs',
			what: 'My own OAuth 2.1 server, built to replace Auth0. It signs Claude and ChatGPT in to my MCP servers. The protocol endpoints are public; the sign-in page only exists on my private network, so nobody else can sign in even with my password.',
			stack: '.NET, OpenIddict',
			reach: 'public protocol, private sign-in',
		},
		{
			id: 'slate',
			name: 'Slate',
			short: 'Markdown library',
			what: 'A personal Markdown library: files are the source of truth, with Git history and sync, full-text search, Windows and Android clients, and an MCP server so Claude can read and write my notes.',
			stack: '.NET, MAUI, Lucene',
			reach: 'web and MCP public, API private',
		},
		{
			id: 'sprawl',
			name: 'Sprawl',
			short: 'infinite canvas',
			what: 'One infinite canvas per topic that keeps growing over time. Claude adds most of the content through MCP, and every change goes into a log I can revert.',
			stack: '.NET, React Flow, SQLite',
			reach: 'MCP public, canvas private',
		},
		{
			id: 'socrates',
			name: 'Socrates',
			short: 'spaced-repetition quiz',
			what: 'A quiz platform with spaced repetition (FSRS) where Claude or ChatGPT writes questions, grades my answers and targets my weak spots. Agent-written questions start as drafts I approve, and agent changes can be undone.',
			stack: 'TypeScript, Hono, SQLite',
			reach: 'MCP public, app private',
		},
		{
			id: 'hey-ann',
			name: 'Hey Ann',
			short: 'Kanban run by Claude',
			what: 'A personal Kanban board that Claude and ChatGPT run for me: "Hey Ann, …" turns a brain dump into cards, plans the day and writes summaries. Finishing cards earns screen time on my phone.',
			stack: 'TypeScript, React, Android',
			reach: 'MCP public, board private',
		},
	],
	contact: [
		{ text: 'GitHub: Kar6677thik', href: 'https://github.com/Kar6677thik' },
		{ text: 'book.karthiksurkanti.in', href: 'https://book.karthiksurkanti.in/' },
	],
};
