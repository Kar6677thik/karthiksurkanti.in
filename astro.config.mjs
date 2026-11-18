// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://karthiksurkanti.in',
	trailingSlash: 'always',
	build: { format: 'directory' },
	markdown: { syntaxHighlight: false },
});
