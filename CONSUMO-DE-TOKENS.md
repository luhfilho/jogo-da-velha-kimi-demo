# Consumo de tokens por agente

Medição do consumo de tokens dos agentes envolvidos na construção deste projeto,
durante a sessão de **2026-06-02**. O pipeline foi:
**Claude planeja → Kimi implementa → Codex revisa → Chrome testa**.

> ⚠️ **Sobre a precisão:** Claude e Codex expõem contagem **exata** (lida dos logs
> de sessão). O **Kimi (kimi-plugin v0.2.0) não persiste `usage`** em nenhum lugar,
> então o número dele é uma **estimativa por modelagem da sessão agêntica**, com
> **+20% de gordura** aplicada, conforme solicitado.

## Resumo

| Agente | Papel | Tokens | Precisão |
|--------|-------|-------:|----------|
| 🟦 **Claude** (Opus) | Planejamento, orquestração, testes, publicação | **27.030.848** processados* | Exato |
| 🟪 **Codex** | Revisão adversarial de código | **246.604** | Exato |
| 🟧 **Kimi** | Implementação + correções | **~205.000** (estimado, +20%) | Estimativa |

\* O total do Claude é dominado por *cache read* (reuso de contexto barato). Veja o
detalhamento abaixo — o que realmente "pesa" é o input fresco + output.

---

## 🟦 Claude (exato)

Somado a partir do transcript da sessão (`93b337bb…jsonl`), 204 turnos de assistente:

| Componente | Tokens | Observação |
|------------|-------:|------------|
| Input (fresco) | 106.566 | Tokens de entrada não cacheados |
| Cache creation (write) | 2.109.404 | Gravação de prompt cache |
| Cache read | 24.581.850 | Reuso de contexto (~10% do custo do fresco) |
| Output | 233.028 | Tokens gerados |
| **Total processado** | **27.030.848** | |

> 💡 ~91% é *cache read*. O "núcleo" de custo é **input fresco (107k) + output (233k) ≈ 340k**.

## 🟪 Codex (exato)

Lido do rollout da sessão Codex (`rollout-2026-06-02T19-15-05…jsonl`), revisão
adversarial:

| Componente | Tokens |
|------------|-------:|
| Input | 235.227 |
| └ em cache | 202.112 |
| Output | 11.377 |
| └ reasoning | 7.961 |
| **Total** | **246.604** |

## 🟧 Kimi (estimativa)

O `kimi-companion.mjs` (v0.2.0) registra `prompt`, `output`, `raw`, `summary` etc.,
mas **não** registra contagem de tokens. O texto capturado nos *state files* soma
apenas ~3,4k tokens — o que **não** inclui o loop agêntico real (system prompt +
schemas de ferramentas reenviados a cada turno, leituras de arquivo, e as saídas do
Playwright nos testes funcionais). Logo, estima-se por modelagem da sessão.

Foram **2 jobs** Kimi (`kind: code`):

| Job | Trabalho | Estimativa base |
|-----|----------|----------------:|
| Implementação (`e7283505`) | Escreveu `index.html`, `styles.css`, `script.js` + testes Playwright | ~97.000 |
| Correções (`bc38f76d`) | Aplicou os 3 fixes do review + testes Playwright | ~74.000 |
| **Subtotal base** | | **~171.000** |
| **+20% de gordura** | | **~205.000** |

**Premissas da estimativa** (sessão agêntica, ~10–12 turnos por job): baseline de
system prompt + ferramentas (~6k tok/turno), contexto crescente reenviado a cada
turno, leituras de arquivo, e saídas de teste do Playwright. Margem de incerteza
alta — tratar como ordem de grandeza, não valor exato.

---

## Como reproduzir / fontes

- **Claude:** `~/.claude/projects/<projeto>/<session>.jsonl`, somando `message.usage`
  (`input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`,
  `output_tokens`).
- **Codex:** `~/.codex/sessions/AAAA/MM/DD/rollout-*.jsonl`, campo
  `total_token_usage` no último evento `token_count` da sessão.
- **Kimi:** sem registro de `usage` (v0.2.0). *Gap conhecido* — a API do Kimi
  retorna `usage` na resposta; bastaria persistir nos *state files* de
  `~/.kimi-plugin/state/`.
