# Tarefas de Correção e Auditoria

- [x] Configuração do Ambiente de Desenvolvimento
    - [x] Instalar dependências de lint (eslint, globals, etc) <!-- id: 1 -->
    - [x] Criar `eslint.config.js` com regras recomendadas <!-- id: 2 -->
    - [x] Adicionar script `lint` ao `package.json` <!-- id: 3 -->
- [x] Fortalecimento do TypeScript
    - [x] Habilitar `"strict": true` no `tsconfig.json` <!-- id: 4 -->
    - [x] Executar `tsc` e identificar erros <!-- id: 5 -->
    - [x] Corrigir erros de tipagem críticos <!-- id: 6 -->
- [ ] Verificação Final
    - [x] Executar `checklist.py` com sucesso <!-- id: 7 -->
    - [x] Garantir build limpo (`npm run build`) <!-- id: 8 -->

## Status Final
Todas as verificações de lint passaram e o build de produção foi gerado com sucesso.

## Correções de Hotfix
- [x] Corrigir erro "Erro ao gerar cupom" (Criar tabela `coupons` e aplicar RLS) <!-- id: 9 -->
- [x] Corrigir erro de coluna 'cnpj' faltante na tabela `partners` <!-- id: 10 -->
- [x] Corrigir erro de RLS ao cadastrar parceiro (Permitir INSERT auth.uid() = id) <!-- id: 11 -->
