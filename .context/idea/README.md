# FASE 1: Constitution

Este directorio contiene la constitución del negocio.

## 📄 Archivos a generar

Usa los prompts de `.prompts/fase-1-constitution/` para crear:

1. **Recomendado:** `@.prompts/fase-1-constitution/business-idea-from-text.md`
   - Input: texto libre con `<<BUSINESS_IDEA>>`
   - Output: `business-model.md` + `market-context.md` en un solo flujo

2. **`business-model.md`** - Business Model Canvas (9 bloques)
   - Usa: `.prompts/fase-1-constitution/business-model.md`

3. **`market-context.md`** - Análisis de mercado y competencia
   - Usa: `.prompts/fase-1-constitution/market-context.md`

3. **`legacy-analysis.md`** _(solo para proyectos legacy)_
   - Análisis de código existente, tech stack, gaps de documentación

## 🎯 Output esperado

Al completar esta fase tendrás:

- 2-3 archivos con la visión de negocio clara
- Base para generar PRD y SRS en Fase 2
