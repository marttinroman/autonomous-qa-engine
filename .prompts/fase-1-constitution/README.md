# Fase 1: Constitution - Guías de Prompts

> **Tipo de fase:** Sincrónica (una sola vez, setup inicial)
> **Propósito:** Definir la idea de negocio y contexto de mercado antes de escribir specs

---

## 🎯 ¿Qué es esta fase?

En esta fase defines la **idea central del proyecto** antes de escribir especific

aciones técnicas. Generas documentación de negocio que será la base para PRD y SRS en Fase 2.

**Esta fase se enfoca en:**

- ✅ Business Model Canvas (problema, solución, propuesta de valor)
- ✅ Análisis de mercado y competencia
- ✅ Contexto de la industria
- ✅ Pain points del usuario

**Esta fase NO incluye:**

- ❌ Especificaciones técnicas (eso es Fase 2: Architecture)
- ❌ Definición de épicas/stories (eso es Fase 4: Specification)
- ❌ Tech stack decisions (eso es Fase 2: SRS)

---

## 📋 Cuándo usar esta fase

\*\*Prerequisitos:\*\*

- ✅ Tienes una idea de producto/negocio clara
- ✅ Sabes qué problema estás resolviendo
- ✅ Tienes el directorio `.context/idea/` creado

**Workflow típico:**

```
START
  ↓
Fase 1 (Constitution) ← ESTÁS AQUÍ
  ↓
Fase 2 (Architecture)
  ↓
Fase 3 (Infrastructure)
```

---

## 📚 Prompts disponibles

| Prompt                           | Orden | Cuándo usarlo                                           | Output                                |
| -------------------------------- | ----- | ------------------------------------------------------- | ------------------------------------- |
| **`business-idea-from-text.md`** | 0️⃣     | **Recomendado** — idea en texto libre → Fase 1 completa | `.context/idea/*.md` (ambos archivos) |
| **`business-model.md`**          | 1️⃣     | Solo modelo de negocio (paso manual)                    | `.context/idea/business-model.md`     |
| **`market-context.md`**          | 2️⃣     | Solo análisis de mercado (tras business-model)          | `.context/idea/market-context.md`     |

---

## 🔄 Workflow típico de uso

### Escenario 1: Proyecto greenfield (desde cero)

```bash
# 1. Ejecuta business-model.md
# Input: Tu idea de negocio
# Output: .context/idea/business-model.md

# 2. Ejecuta market-context.md
# Input: business-model.md (generado en paso 1)
# Output: .context/idea/market-context.md

# 3. Valida que ambos archivos están completos
# 4. Procede a Fase 2: Architecture
```

### Escenario 2: Proyecto legacy (código existente)

```bash
# 1. Ejecuta business-model.md
# Input: Código/features existentes + documentación actual
# Output: .context/idea/business-model.md (reverse-engineered)

# 2. Ejecuta market-context.md
# Input: business-model.md + competitive analysis
# Output: .context/idea/market-context.md

# ADICIONAL: Crea legacy-analysis.md (manual o con IA)
# Documenta: Tech stack actual, features existentes, gaps de documentación
```

---

## ⚙️ Herramientas opcionales

### **NO se requieren MCP tools en esta fase**

Esta fase es puramente estratégica/de negocio. No requiere:

- ❌ Supabase MCP (no hay DB todavía)
- ❌ Atlassian MCP (no hay issues todavía)
- ❌ Context7 MCP (no hay tech stack definido)

**Solo necesitas:** Tu conocimiento del negocio/industria + la IA para estructurar ideas.

---

## ⚠️ Restricciones críticas

### ❌ NO HACER:

- **NO saltarse esta fase** - Afecta calidad de PRD/SRS en Fase 2
- **NO incluir detalles técnicos** - Esta fase es solo negocio
- **NO definir épicas/stories** - Eso va en Fase 4 (Specification)
- **NO escribir código** - Todavía no hay specs técnicas

### ✅ SÍ HACER:

- **Enfocarse en el problema** del usuario (pain points reales)
- **Definir value proposition** clara
- **Analizar competencia** (qué hacen bien/mal)
- **Identificar target users** (quiénes son, qué necesitan)
- **Documentar supuestos** (hipótesis a validar con MVP)

---

## 💬 Output esperado de la IA

**Después de ejecutar ambos prompts:**

```
.context/idea/
├── business-model.md         ← Canvas de 9 bloques + Problem Statement
└── market-context.md         ← Competitive Landscape + Opportunity
```

**Contenido típico de business-model.md:**

- Problem Statement (pain point claro)
- Solution Overview (cómo lo resuelves)
- Value Proposition (por qué es mejor)
- Target Segments (quiénes lo usarán)
- Revenue Streams (cómo ganarás dinero)
- Key Metrics (cómo medirás éxito)

**Contenido típico de market-context.md:**

- Competitive Analysis (3-5 competidores)
- Market Opportunity (tamaño de mercado, trends)
- Differentiators (tu ventaja competitiva)
- Risks & Assumptions (qué puede salir mal)

---

## 📖 Recursos adicionales

**Próximo paso:**
Después de completar Fase 1, procede a **Fase 2: Architecture**

- Usa business-model.md como input para `prd-executive-summary.md`
- El Problem Statement será la base de todo el PRD

**Referencias útiles:**

- Business Model Canvas original: https://strategyzer.com/canvas/business-model-canvas
- Lean Canvas (alternativa): https://leanstack.com/lean-canvas

---

## 🎯 Quick Start

**Opción A — Idea en texto (recomendada):**

```markdown
@.prompts/fase-1-constitution/business-idea-from-text.md

<<BUSINESS_IDEA>>
{Tu idea en texto libre: problema, usuarios, solución propuesta}

<<PROJECT_MODE>>
greenfield
```

La IA genera `business-model.md` y `market-context.md` en `.context/idea/` y valida el checklist de completitud.

**Opción B — Paso a paso:**

```markdown
@.prompts/fase-1-constitution/business-model.md
# Completa los placeholders [industria/vertical], idea inicial, target audience

@.prompts/fase-1-constitution/market-context.md
# Usa el business-model.md generado como input
```

---

## ✅ Checklist de completitud

Antes de proceder a Fase 2, verifica:

- [ ] Existe `.context/idea/business-model.md`
- [ ] Existe `.context/idea/market-context.md`
- [ ] Business Model Canvas tiene los 9 bloques completos
- [ ] Problem Statement es claro y específico
- [ ] Target users están claramente identificados (2-3 segmentos)
- [ ] Competitive analysis incluye al menos 3 competidores
- [ ] Market opportunity está cuantificada (si es posible)
- [ ] Si es legacy: Existe `legacy-analysis.md` con tech stack actual

---

**Nota:** Esta fase toma típicamente 30-60 minutos de trabajo con IA. Tómate el tiempo necesario - una base sólida aquí ahorra tiempo en Fases 2-13.
