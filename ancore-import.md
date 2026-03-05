# Plano de Implementação: Importação Associados Ancore

## Overview
Criar um mecanismo para importar associados antigos da associação "Ancore" (não parceira), cuja tabela possui os campos: `nome, telefone, placa e email`, sem a exigência de `CPF`.

## Project Type
WEB

## Success Criteria
- O fluxo atual de importação de CSV (com CPF) continua intacto.
- A aplicação oferece uma nova tela (ou formato aceito) para importar a planilha específica da "Ancore" usando `placa` em vez de `cpf`.
- Os associados da Ancore entram no sistema atrelados à respectiva associação.
- O e-mail é cadastrado na Supabase Auth e a **placa** é configurada como a senha inicial (ou gerada automaticamente) para o primeiro acesso.
- A Associação "Ancore" é gerada no banco para vincular os usuários.

## Tech Stack
- React/TSX (Frontend Admin)
- Supabase (Database/Auth, via permissão de Admin)
- Edge Function

## File Structure
- `screens/admin/AdminImport.tsx` (modificar para suportar "Layout Ancore" como uma aba ou opção extra)
- `services/importService.ts` (nova função para se comunicar de forma segura com o backend/banco sem exigir o layout antigo)
- `supabase/functions/import_ancore_member/index.ts` (Edge Function para processar o Auth via email e placa de forma segura).

## Task Breakdown

### 1- Setup da Associação "Ancore"
- **Agent:** backend-specialist
- **Input:** Criar o registro principal da associação "Ancore" no banco de dados.
- **Output:** ID da Associação `Ancore` retornada para vinculação.
- **Verify:** Verificar se "Ancore" aparece na tabela `partners`.

### 2- Novo Layout na Tela de Importação (`AdminImport.tsx`)
- **Agent:** frontend-specialist
- **Input:** Componente existente.
- **Output:** Inclusão de um toggle (Padrão vs Ancore). Se "Ancore" estiver selecionado, a planilha exigirá as colunas: `[name, phone, placa, email]`.
- **Verify:** No browser, acessar `/admin` > aba "Importação" e verificar o novo selector de formato.

### 3- Lógica de Criação Rápida (Edge Function)
- **Agent:** backend-specialist
- **Input:** Payload JSON com os membros em lote.
- **Output:** Criação do usuário na auth usando `email` e senha como `placa`. Salvar na tabela `users` com o ID da associação da Ancore.
- **Verify:** Testar um CSV dummy contendo 2 usuários via painel Admin e ver se eles dão login.

## Phase X: Verification
- [ ] No purple/violet hex codes
- [ ] No standard template layouts
- [ ] Socratic Gate was respected
- [ ] Importação processa com sucesso uma tabela modelo com apenas `nome, telefone, placa, email`.
- [ ] Novos usuários da Ancore conseguem acesso ao clube.
