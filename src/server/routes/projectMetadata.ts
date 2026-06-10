import fs from 'fs/promises';
import path from 'path';
import express, { Router } from 'express';
import matter from 'gray-matter';

const router: Router = express.Router();

function projectDir(projectName: string) {
  return path.join(process.cwd(), 'src', 'public', 'pages', projectName);
}

function deriveDisplayName(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      const trimmed = word.replace(/^_+/, '');
      if (!trimmed) return '';
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .filter(Boolean)
    .join(' ');
}

async function readAbout(projectName: string) {
  const dir = projectDir(projectName);
  const mdPath = path.join(dir, 'about.md');
  const jsonPath = path.join(dir, 'about.json');

  // Try about.md first
  try {
    const raw = await fs.readFile(mdPath, 'utf-8');
    const { data, content } = matter(raw);
    // Support legacy `projectName` key from pre-rename forks
    const slug = data.slug ?? data.projectName ?? projectName;
    return {
      slug,
      displayName: data.displayName || deriveDisplayName(slug),
      designer: data.designer ?? '',
      pm: data.pm ?? '',
      bodyMarkdown: content.trim(),
      prdLink: data.prdLink ?? '',
      githubIssueLink: data.githubIssueLink ?? '',
      breadcrumb: data.breadcrumb ?? '',
      ...(data.thumbnail ? { thumbnail: data.thumbnail } : {}),
    };
  } catch {
    // Fall back to about.json for unmigrated projects
  }

  try {
    const raw = await fs.readFile(jsonPath, 'utf-8');
    const json = JSON.parse(raw);
    // Support legacy `projectName` key from pre-rename forks
    const slug = json.slug ?? json.projectName ?? projectName;
    return {
      slug,
      displayName: json.displayName || deriveDisplayName(slug),
      designer: json.designer ?? '',
      pm: json.pm ?? '',
      bodyMarkdown: json.briefDescription ?? '',
      prdLink: json.prdLink ?? '',
      githubIssueLink: json.githubIssueLink ?? '',
      breadcrumb: json.breadcrumb ?? '',
      ...(json.thumbnail ? { thumbnail: json.thumbnail } : {}),
    };
  } catch {
    // Neither file exists
  }

  return {
    slug: projectName,
    displayName: deriveDisplayName(projectName),
    designer: '',
    pm: '',
    bodyMarkdown: '',
    prdLink: '',
    githubIssueLink: '',
    breadcrumb: '',
  };
}

function buildMarkdownFile(metadata: Record<string, any>): string {
  const { bodyMarkdown, ...frontmatterFields } = metadata;

  const fm: Record<string, any> = {};
  for (const [key, value] of Object.entries(frontmatterFields)) {
    if (value !== undefined) {
      fm[key] = value;
    }
  }

  const file = matter.stringify(bodyMarkdown || '', fm);
  return file;
}

// Get project metadata
router.get('/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const metadata = await readAbout(projectName);
    res.json(metadata);
  } catch (error) {
    console.error('Error loading project metadata:', error);
    res.status(500).json({ error: 'Failed to load project metadata' });
  }
});

// Save project metadata
router.post('/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const metadata = req.body;
    
    const dir = projectDir(projectName);
    
    try {
      await fs.access(dir);
    } catch {
      return res.status(404).json({ error: 'Project directory not found' });
    }
    
    const mdPath = path.join(dir, 'about.md');
    const content = buildMarkdownFile(metadata);
    await fs.writeFile(mdPath, content, 'utf-8');

    // Clean up legacy about.json if it exists
    const jsonPath = path.join(dir, 'about.json');
    try {
      await fs.access(jsonPath);
      await fs.unlink(jsonPath);
    } catch {
      // No about.json to clean up
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving project metadata:', error);
    res.status(500).json({ error: 'Failed to save project metadata' });
  }
});

export default router;
