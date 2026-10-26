import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { DOMAINS, LEGACY_CATEGORIES, RUBRIQUES, TOOLS, TOOL_ALIASES, getDomain, getRubrique, getTool, resolveTool, searchTools, toolsOf } from './registry'
import { PROJECTS } from './data/projects'

// Pages fixes du site : un espace ne doit pas porter leur nom
const PAGES = ['outils', 'a-propos', 'projets']

const sources = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : /\.jsx?$/.test(e.name) && !e.name.includes('.test.') ? [join(dir, e.name)] : [],
  )

describe('registre des espaces', () => {
  test('identifiants uniques (espaces, rubriques, outils)', () => {
    for (const list of [DOMAINS, RUBRIQUES, TOOLS]) {
      const ids = list.map((x) => x.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    for (const d of DOMAINS) expect(PAGES).not.toContain(d.id)
  })

  test('chaque outil est rangé dans une rubrique de son espace', () => {
    for (const t of TOOLS) {
      expect(getRubrique(t.rubrique)?.domain, t.id).toBe(t.domain)
      expect(t.title && t.summary && t.icon && t.component, t.id).toBeTruthy()
    }
  })

  test('aucune rubrique vide', () => {
    for (const r of RUBRIQUES) expect(toolsOf(r.id).length, r.id).toBeGreaterThan(0)
  })

  test('les anciennes adresses mènent à une page existante', () => {
    for (const [old, { domain, rubrique }] of Object.entries(LEGACY_CATEGORIES)) {
      expect(getDomain(old), old).toBeUndefined()
      expect(getDomain(domain), old).toBeDefined()
      if (rubrique) expect(getRubrique(rubrique)?.domain, old).toBe(domain)
    }
    for (const [old, id] of Object.entries(TOOL_ALIASES)) {
      expect(getTool(old), old).toBeUndefined()
      expect(resolveTool(old)?.id).toBe(id)
    }
  })

  test('les outils cités par les projets existent', () => {
    for (const p of PROJECTS) for (const id of p.tools ?? []) expect(getTool(id), `${p.repo} → ${id}`).toBeDefined()
  })

  test('les liens internes du code pointent vers une adresse actuelle', () => {
    const links = sources('src').flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/\bto="(\/[^"?#]*)/g)].map((m) => ({ file, path: m[1] })),
    )
    expect(links.length).toBeGreaterThan(0)
    for (const { file, path } of links) {
      const [domain, tool, ...rest] = path.split('/').filter(Boolean)
      if (!domain || PAGES.includes(domain)) continue
      expect(getDomain(domain), `${file} : ${path}`).toBeDefined()
      if (tool) expect(getTool(tool)?.domain, `${file} : ${path}`).toBe(domain)
      expect(rest, `${file} : ${path}`).toEqual([])
    }
  })

  test('recherche limitée à un espace', () => {
    expect(searchTools('lune').map((t) => t.id)).toContain('lune')
    expect(searchTools('résistance', { domain: 'electronique' }).every((t) => t.domain === 'electronique')).toBe(true)
    expect(searchTools('lune', { domain: 'pratique' })).toEqual([])
  })
})
