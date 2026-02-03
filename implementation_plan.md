# Plano de Auditoria e Correção de Falhas

## Objetivo
Analisar o projeto em busca de falhas técnicas e estruturais, e aplicar as correções necessárias para elevar o padrão de qualidade do código, segurança e manutenibilidade.

## Falhas Identificadas (User Review Required)

> [!WARNING]
> **TypeScript Excessivamente Permissivo**
> O arquivo `tsconfig.json` está configurado com `"strict": false`. Isso desativa verificações cruciais como `noImplicitAny` e `strictNullChecks`, mascarando potenciais bugs que só aparecerão em tempo de execução.
>
> **Risco:** Alto. Bugs de "undefined is not an object" podem ocorrer frequentement.

> [!WARNING]
> **Ausência de Linter**
> O comando `eslint` falhou por falta de arquivo de configuração. O projeto não possui padronização de código ou detecção estática de "code smells".
>
> **Risco:** Médio. Código despadronizado e propensão a erros simples.

> [!NOTE]
> **Script de Auditoria Quebrado**
> O script `.agent/scripts/checklist.py` falha no Windows devido a incompatibilidade de encoding (emojis).
>
> **Impacto:** Ferramentas de automação da IA não funcionam corretamente.

## Mudanças Propostas

### 1. Fortalecimento do TypeScript
Habilitar o modo estrito gradualmente ou totalmente.
- **Ação:** Alterar `"strict": false` para `"strict": true` em `tsconfig.json`.
- **Ação:** Corrigir os erros de compilação resultantes (espera-se um grande volume de erros iniciais).

### 2. Configuração de Linting
Instaurar padrões de código.
- **Ação:** Criar `eslint.config.js` com configurações recomendadas para React + TypeScript + Prettier.
- **Ação:** Adicionar script `lint` ao `package.json`.

### 3. Correção de Ferramentas
Garantir que os scripts de suporte funcionem.
- **Ação:** Sanitizar `checklist.py` removendo emojis ou forçando encoding UTF-8.

## Plano de Verificação

### Automatizado
- Executar `npx tsc --noEmit` e garantir zero erros.
- Executar `npm run lint` (novo script) e garantir zero warnings/erros.
- Executar `python .agent/scripts/checklist.py .` com sucesso.

### Manual
- Tentar rodar o projeto com `npm run dev` para garantir que as mudanças não quebraram o build.
