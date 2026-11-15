<p align="center">
  <img src="packages/vscode-extension/media/maria-logo.png" alt="MarIA Code" width="180">
</p>

<h1 align="center">MarIA Code</h1>

<p align="center">
  <strong>El agente de programación de Unicaja para desarrolladores y empleados.</strong><br>
  Un <em>coding agent harness</em> corporativo: terminal, VS Code y SDK sobre el mismo motor, conectado al gateway de modelos de Unicaja.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/uso-corporativo%20Unicaja-005B3E?style=flat&colorA=222222" alt="Uso corporativo Unicaja">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&colorA=222222&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Rust-DEA584?style=flat&colorA=222222&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/runtime-Bun-f472b6?style=flat&colorA=222222" alt="Bun">
  <img src="https://img.shields.io/badge/licencia-MIT-58A6FF?style=flat&colorA=222222" alt="MIT">
</p>

## Qué es

MarIA Code es la distribución corporativa de un agente de programación con LLM para el personal técnico de Unicaja. El agente lee y edita código, ejecuta comandos, usa el LSP y el depurador, lanza subagentes en paralelo y recuerda lo aprendido entre sesiones. Se maneja desde la terminal o desde un panel de chat en VS Code.

Se compone de dos piezas:

| Pieza | Qué es | Dónde vive |
| --- | --- | --- |
| **Motor `omp`** | Agente, herramientas, sesiones, subagentes, skills, memoria y conexión con modelos. CLI interactivo (TUI), modo `-p`, RPC, ACP y SDK. | [`packages/coding-agent`](packages/coding-agent) y paquetes de apoyo |
| **Extensión de VS Code `maria-code`** | Chat, sesiones, selector de modelo, ajustes, voz, checkpoints de ficheros y skills dentro del IDE. Arranca `omp --mode rpc-ui`, así que usa los mismos modelos, skills y sesiones que la terminal. | [`packages/vscode-extension`](packages/vscode-extension) |

El motor es un fork de [oh-my-pi](https://github.com/can1357/oh-my-pi) (de Stencil Labs), que a su vez nace de [Pi](https://github.com/badlogic/pi-mono) de Mario Zechner. MarIA Code mantiene la base y añade la integración con el entorno de Unicaja, la extensión de VS Code y los ajustes de seguridad y privacidad descritos más abajo. Las mejoras de upstream se portan de forma selectiva; el análisis vigente está en [`docs/upstream-gap-analysis-v18.18.9.md`](docs/upstream-gap-analysis-v18.18.9.md).

## Para quién es

- **Desarrolladores**: implementar, depurar, revisar y refactorizar código en cualquier repositorio.
- **Plataforma y operaciones**: tareas de infraestructura y operación a través de skills (nube, paneles, tickets, wikis, gateways y registros de modelos). Los chats sin workspace de la extensión están pensados para estas tareas generales.
- **Equipos que integran el agente** en otras herramientas, mediante RPC o SDK.

## Qué hace el agente

- **Edición fiable**: parches anclados por hash de contenido (*hashline*); si el fichero cambió, el parche se rechaza en lugar de corromperlo. Los cambios estructurales (`ast_edit`) se previsualizan antes de aplicarse.
- **IDE integrado**: `lsp` (diagnósticos, navegación, renombrados) y `debug` (DAP) como herramientas del agente.
- **Ejecución**: `bash` con motor embebido y `eval` con Python y JavaScript persistentes que pueden llamar de vuelta a las herramientas del agente.
- **Subagentes**: `task` reparte el trabajo en paralelo, opcionalmente en worktrees aislados, y devuelve resultados validados por esquema. El rol `advisor` revisa cada turno con otro modelo, y `/review` puntúa los hallazgos de P0 a P3.
- **Skills**: procedimientos reutilizables (`SKILL.md`) que codifican cómo operar un sistema concreto. El agente puede proponer mejoras a una skill tras una tarea; no se aplican hasta que las apruebas en la extensión.
- **Memoria** entre sesiones, limitada al proyecto por defecto.
- **Contexto de repositorio**: lee `AGENTS.md`, `CLAUDE.md` y las reglas ya presentes en `.cursor`, `.claude`, `.codex`, `.cline`, `.github/copilot` y similares.
- **Web y documentos**: `web_search`, lectura de PDF, páginas, issues y PRs (`pr://`, `issue://`) con la misma herramienta `read`.
- **Revisión y Git**: `/review`, `omp commit` (commits atómicos con mensajes validados) y resolución de conflictos de merge mediante `conflict://`.

### Herramientas

Las herramientas viven en el mismo espacio de nombres que `read` y `bash`. `--tools read,edit,bash,…` fija el conjunto activo; las poco habituales quedan tras dispositivos `xd://` (`read xd://` los lista).

| Familia | Herramientas |
| --- | --- |
| Ficheros y búsqueda | `read`, `write`, `edit`, `ast_edit`, `ast_grep`, `grep`, `glob` |
| Ejecución | `bash`, `eval` |
| Código | `lsp`, `debug`, `security_scan` |
| Coordinación | `task`, `wait`, `todo`, `ask` |
| Escritorio y web | `browser`, `computer`, `web_search`, `github`, `generate_image`, `tts` |
| Memoria y skills | `checkpoint`, `rewind`, `retain`, `recall`, `reflect`, `memory_edit`, `learn`, `manage_skill` |

Desactivadas por defecto y activables por ajuste: `github`, `security_scan`, `generate_image`, `tts`, `checkpoint`, `rewind` y las de memoria.

### Controles de turno y de sesión

- `ultrathink`, `orchestrate` y `workflowz`, escritas como palabras sueltas en minúsculas dentro de un prompt, activan razonamiento profundo, orquestación con subagentes o un flujo multiagente determinista. Ver [`docs/magic-keywords.md`](docs/magic-keywords.md).
- `/vibe` ([`docs/vibe-mode.md`](docs/vibe-mode.md)) y `/fresh` ([`docs/session-operations-export-share-fork-resume.md`](docs/session-operations-export-share-fork-resume.md#fresh)).

## Extensión de VS Code

Chat en la barra lateral o en una pestaña del editor, pensado para el trabajo diario:

- Respuestas en streaming con markdown, razonamiento plegable y una fila de actividad por cada llamada a herramienta (lecturas, ediciones con `+/−`, comandos).
- **Plan mode**: el agente planifica en solo lectura y tú apruebas, refinas o abres el plan en el editor.
- **Editar un prompt anterior** y, si el agente modificó ficheros, **restaurarlos** a partir de checkpoints en git (objetos en un índice temporal; no tocan ramas, índice ni historial).
- **Preguntas del agente** como tarjeta sobre el chat, con avisos sonoros mientras esperan respuesta.
- **Varias sesiones a la vez**, historial con búsqueda, y chats **sin workspace** para tareas generales.
- **Dictado por voz**, `@` para adjuntar ficheros y carpetas, imágenes pegadas, predicción de palabras y «Mejorar prompt».
- **Skills de la sesión**: activarlas o desactivarlas por chat, importarlas y revisar las mejoras propuestas.
- **Red corporativa**: usa el almacén de certificados del sistema operativo y las CA de Netskope, de modo que un proxy que re-firma HTTPS suele funcionar sin configuración adicional.

La lista completa de funciones, ajustes (`ompCustom.*`) y requisitos está en [`packages/vscode-extension/README.md`](packages/vscode-extension/README.md).

## Instalación

### Extensión de VS Code

Descarga `maria-code.vsix` desde las *releases* del repositorio y ejecuta **Extensions: Install from VSIX…**, o:

```sh
code --install-extension maria-code.vsix
```

La extensión necesita el motor `omp` en el `PATH` (o configurado en `ompCustom.executable`).

### Motor `omp` desde el código fuente

Requiere Bun ≥ 1.4.4 y la cadena de herramientas de Rust del repositorio (`rust-toolchain.toml`).

```sh
bun setup          # instala los workspaces y compila el addon nativo
bun dev            # ejecuta el CLI desde las fuentes
bun dev -- --version
```

`bun setup` compila `@oh-my-pi/pi-natives`; repite `bun run build:native` tras cambiar los crates de Rust o `packages/natives`. Los usuarios de Nix disponen de un entorno reproducible con `nix develop`. Para generar el binario y enlazar `omp` en el `PATH`, ver [`packages/coding-agent/DEVELOPMENT.md`](packages/coding-agent/DEVELOPMENT.md) y `scripts/link-omp.sh`.

> [!WARNING]
> Los instaladores públicos de upstream (`https://omp.sh/install`, `install.ps1`, la fórmula de Homebrew `can1357/tap/omp`, `mise use github:can1357/oh-my-pi`) y `omp update` resuelven contra el proyecto original, no contra esta distribución. Instala MarIA Code desde las *releases* de este repositorio o desde sus fuentes.

Versionado: el motor conserva la versión base `18.9.1` con etiquetas `v18.9.1-custom.N`; la extensión de VS Code se versiona aparte (`packages/vscode-extension/package.json`).

## Modelos y gateway corporativo

MarIA Code se conecta a los modelos a través del **gateway LiteLLM de Unicaja** (`driver-ia.<env>.unicajasc.corp`). El motor descubre los modelos que el gateway expone y los reparte entre roles: `default`, `smol` (subagentes baratos), `slow` (razonamiento profundo), `plan`, `commit`, `vision`, `task`, `advisor`, `tiny`, además de los roles `ask` y `enhance` que usa la extensión. `Ctrl+P` recorre los modelos del rol activo, `/model` cambia el modelo en mitad de una sesión y `--smol`, `--slow` y `--plan` lo fijan al arrancar.

```sh
export LITELLM_BASE_URL="<URL del gateway de tu entorno>/v1"
export LITELLM_API_KEY="<tu clave>"
omp models            # lista lo descubierto
```

Para fijar el modelo por defecto o declarar más proveedores compatibles con OpenAI, usa `~/.omp/agent/models.yml` y `~/.omp/agent/config.yml`:

```yaml
# ~/.omp/agent/config.yml
modelRoles:
  default: litellm/<modelo>
```

Referencias: [`docs/models.md`](docs/models.md) (formato de `models.yml`, descubrimiento LiteLLM, cadenas de *fallback* en `retry.fallbackChains`, modelos por ruta), [`docs/providers.md`](docs/providers.md) y [`docs/auth-broker-gateway.md`](docs/auth-broker-gateway.md) (bóveda de credenciales y *forward proxy* que mantienen los tokens fuera de los equipos de los desarrolladores).

## Seguridad, privacidad y cumplimiento

Valores por defecto de esta distribución, comprobados en el código. Revísalos antes de desplegar en un equipo o en un contenedor compartido.

| Aspecto | Valor por defecto | Cómo cambiarlo |
| --- | --- | --- |
| Aprobación de herramientas (`tools.approvalMode`) | `yolo`: el agente ejecuta lectura, escritura y comandos sin preguntar | `always-ask` (pregunta al escribir y ejecutar) o `write` (pregunta solo al ejecutar), también con `--approval-mode`. Reglas por herramienta en `tools.approval`. Los subagentes corren sin interfaz y no pueden responder a un aviso. Ver [`docs/approval-mode.md`](docs/approval-mode.md) |
| Ofuscación de secretos (`secrets.enabled`) | Desactivada | Activarla sustituye claves, tokens y contraseñas por marcadores antes de enviar texto al proveedor. Ver [`docs/secrets.md`](docs/secrets.md) |
| Auto QA y reporte de incidencias (`dev.autoqa`) | Desactivado; sin *endpoint* de envío (`dev.autoqaPush.endpoint` vacío) | Requiere activación explícita, consentimiento del usuario y un *endpoint* configurado |
| Consultas fuera de sesión (`ask` sobre una selección, «Mejorar prompt», mejora de skills) | No se registran en la sesión y, en el gateway de Unicaja, llevan `"no-log": true` para quedar fuera de los logs del proxy | Ver [`docs/rpc.md`](docs/rpc.md) |
| Contenido del proyecto | Al abrir un repositorio se cargan por diseño sus ajustes, extensiones, hooks, herramientas, comandos, skills, reglas y configuración MCP; no hay filtro de confianza de proyecto | Ver «Entradas del proyecto» más abajo |

### Servicios externos heredados de upstream

El motor trae valores por defecto que apuntan a servicios de Stencil Labs, que **no pertenecen a Unicaja**. Reapúntalos o desactívalos según la política de seguridad antes de usarlos con código o datos de la entidad.

| Función | Servicio por defecto | Ajuste |
| --- | --- | --- |
| `/collab` (sesiones compartidas) | `wss://my.omp.sh` | `collab.relayUrl` |
| `/share` (subida de sesiones; ofusca secretos por defecto) | `https://my.omp.sh/s` | `share.serverUrl`, `share.store`, `share.redactSecrets` |
| Registro de skills (`omp skill …`) | `https://skills.omp.sh` | `skills.registryUrl` |
| `omp stream` | `https://live.omp.sh` | `stream.serverUrl` |
| Comprobación de actualizaciones al arrancar y servicio de *builds* | `https://build.stencil.so` y el canal de releases de upstream | `startup.checkUpdate`, `PI_BUILD_URL` |
| `web_search` | Cadena de proveedores de búsqueda externos, algunos sin clave | Fijar un proveedor por nombre en los ajustes de búsqueda |

### Entradas del proyecto

Abrir un repositorio carga sus entradas por diseño. Para excluir el `.mcp.json` del proyecto en una invocación, pasa `--config <fichero>` con una capa YAML anidada (una línea plana `mcp.enableProjectConfig: false` se ignora):

```yaml
mcp:
  enableProjectConfig: false
```

`--no-extensions` omite el descubrimiento de extensiones; `--trusted-extension /ruta/absoluta/al/fichero.ts` admite solo las extensiones indicadas. `--no-tools` desactiva las herramientas integradas, pero los módulos de herramientas del proyecto son una superficie de descubrimiento aparte.

> **Vulnerabilidades.** No las publiques en issues abiertos. Comunícalas por los canales internos de seguridad de Unicaja. `.github/SECURITY.md` es el texto heredado de upstream.

## Puntos de entrada

Un solo motor, cuatro envoltorios.

| Modo | Comando | Uso |
| --- | --- | --- |
| Interactivo | `omp` | TUI; la ambigüedad se resuelve con la herramienta `ask` (selector estructurado) |
| Un solo prompt | `omp -p "<prompt>"` | Responde y sale |
| RPC | `omp --mode rpc` / `--mode rpc-ui` | NDJSON por stdio; `rpc-ui` añade tarjetas, selectores y diálogos. Es el modo que usa la extensión. [`docs/rpc.md`](docs/rpc.md). SDK cliente en `sdk/go`, `sdk/python` y `sdk/rust` (`omp-rpc`) |
| ACP | `omp acp` | [Agent Client Protocol](https://github.com/zed-industries/agent-client-protocol) para editores; las escrituras pasan por `session/request_permission` |

SDK para Node/TypeScript (`@oh-my-pi/pi-coding-agent`):

```ts
import {
  ModelRegistry,
  SessionManager,
  createAgentSession,
  discoverAuthStorage,
} from "@oh-my-pi/pi-coding-agent";

const auth = await discoverAuthStorage();
const models = new ModelRegistry(auth);
await models.refresh();

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage: auth,
  modelRegistry: models,
});
await session.prompt("lista los ficheros .ts");
```

Referencia: [`docs/sdk.md`](docs/sdk.md).

## Extensibilidad

- **Extensiones**: módulos TypeScript con la misma API de herramientas, comandos y atajos que los integrados ([`docs/extensions.md`](docs/extensions.md)).
- **Skills** ([`docs/skills.md`](docs/skills.md)), **MCP** ([`docs/mcp-config.md`](docs/mcp-config.md)), **hooks** ([`docs/hooks.md`](docs/hooks.md)) y **reglas** ([`docs/context-files.md`](docs/context-files.md)).
- **Plugins y marketplaces** ([`docs/marketplace.md`](docs/marketplace.md)).
- **Reglas de modelo y proveedor** en KDL (`packages/catalog/src/compat/rules/`), compiladas a `rules.json` con `bun run gen:compat`. Ningún comportamiento específico de un modelo se codifica en TypeScript.

## Estructura del repositorio

### Paquetes

| Paquete | Descripción |
| --- | --- |
| [`vscode-extension`](packages/vscode-extension) | **Propio de MarIA Code.** Extensión de VS Code |
| [`coding-agent`](packages/coding-agent) | CLI interactivo, modos RPC/ACP y SDK |
| [`agent`](packages/agent) | Runtime del agente: bucle, llamadas a herramientas y estado |
| [`ai`](packages/ai) | Cliente multiproveedor con streaming, bróker de credenciales y gateway |
| [`catalog`](packages/catalog) | Catálogo de modelos, descriptores de proveedor y reglas KDL |
| [`tui`](packages/tui) | Biblioteca de interfaz de terminal con renderizado diferencial |
| [`natives`](packages/natives) | Bindings N-API: grep, shell, imagen, texto, resaltado |
| [`utils`](packages/utils) | Logger, streams y utilidades de directorios, entorno y procesos |
| [`wire`](packages/wire) | Tipos del protocolo de sesiones compartidas |
| [`mnemopi`](packages/mnemopi) | Motor de memoria local sobre SQLite |
| [`snapcompact`](packages/snapcompact) | Compresión de contexto mediante marcos de imagen |
| [`stats`](packages/stats) | Panel local de estadísticas de uso (`omp stats`) |
| [`omptype`](packages/omptype) | Validación de esquemas compatible con ArkType |
| [`collab-web`](packages/collab-web) | Cliente web, host simulado y relay local de `/collab` |
| [`browser-relay`](packages/browser-relay) | Extensión de Chrome para que el agente use pestañas ya abiertas |
| [`metaharness`](packages/metaharness), [`typescript-edit-benchmark`](packages/typescript-edit-benchmark) | Bancos de pruebas |

`python/robomp` (bot de mantenimiento de PRs de upstream) e `infra/` también se heredan del proyecto original.

### Crates de Rust

El rendimiento crítico (búsqueda, shell, AST, PTY, control de escritorio) corre dentro del proceso, sin `fork/exec` en el camino caliente. Plataformas: `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `win32-x64` y `win32-arm64`.

| Crate | Descripción |
| --- | --- |
| [`pi-natives`](crates/pi-natives) | Addon N-API que agrega al resto |
| [`pi-shell`](crates/pi-shell) | Bash 5.3 embebido: sesiones persistentes, PTY y gestión de procesos |
| [`pi-builtins`](crates/pi-builtins) | Builtins de bash y utilidades de línea de comandos en proceso |
| [`pi-edit`](crates/pi-edit) | Motor de la herramienta `edit`: parches anclados, previsualización en streaming y aplicación atómica |
| [`pi-ast`](crates/pi-ast) | Resúmenes y consultas tree-sitter (más de 50 gramáticas) |
| [`pi-iso`](crates/pi-iso) | Aislamiento de workspace para subagentes: APFS, reflink, overlayfs, projfs |
| [`pi-walker`](crates/pi-walker) | Recorrido paralelo respetando `.gitignore`, con caché compartida |
| [`pi-voice`](crates/pi-voice) | Captura y reproducción de audio, Opus y WebRTC |
| [`crates/vendor`](crates/vendor) | Dependencias de terceros vendorizadas (`jaq-*`, `grep-searcher`, `tree-sitter-go`, `napi`, `cfg_aliases`) |

## Documentación

Todo en [`docs/`](docs/). Puntos de partida:

| Tema | Documento |
| --- | --- |
| Modelos, proveedores y gateway | [`models.md`](docs/models.md), [`providers.md`](docs/providers.md), [`auth-broker-gateway.md`](docs/auth-broker-gateway.md) |
| Seguridad | [`approval-mode.md`](docs/approval-mode.md), [`secrets.md`](docs/secrets.md) |
| Protocolo RPC y SDK | [`rpc.md`](docs/rpc.md), [`sdk.md`](docs/sdk.md) |
| Skills, MCP, hooks y reglas | [`skills.md`](docs/skills.md), [`mcp-config.md`](docs/mcp-config.md), [`hooks.md`](docs/hooks.md), [`context-files.md`](docs/context-files.md) |
| Sesiones, memoria y compactación | [`session.md`](docs/session.md), [`memory.md`](docs/memory.md), [`compaction.md`](docs/compaction.md) |
| Análisis comparativos de producto | [`codex-vs-omp-analisis.md`](docs/codex-vs-omp-analisis.md), [`zcode-vs-omp-analisis.md`](docs/zcode-vs-omp-analisis.md), [`upstream-gap-analysis-v18.18.9.md`](docs/upstream-gap-analysis-v18.18.9.md) |

## Desarrollo y contribución

Los cambios se proponen por *pull request* a este repositorio. Antes de empezar, lee [`AGENTS.md`](AGENTS.md) (reglas de código, pruebas y logging) y [`CONTRIBUTING.md`](CONTRIBUTING.md), texto heredado de upstream: sus referencias a Discord y a los flujos del proyecto original no aplican a esta distribución.

```sh
bun run check      # tipos y lint (TypeScript y Rust)
bun run test       # pruebas de TypeScript
bun run lint
bun run fmt
```

- Las novedades visibles para el usuario se anotan bajo `## [Unreleased]` en `packages/*/CHANGELOG.md`; las secciones ya publicadas no se modifican.
- Mensajes de commit al estilo convencional con el paquete entre paréntesis, p. ej. `feat(vscode): …` o `fix(coding-agent): …`.
- No se editan a mano `packages/catalog/src/models.json` ni `packages/catalog/src/compat/rules.json`: se regeneran con `bun run gen:models` y `bun run gen:compat`.
- Para depurar el agente en ejecución, `/debug` abre las herramientas de diagnóstico, informes y perfilado.

## Licencia y atribución

MIT, según [`LICENSE`](LICENSE). El código de terceros y el vendorizado (`crates/vendor/*`) y las partes señaladas en `crates/pi-builtins/LICENSE` y `crates/pi-shell/NOTICE` conservan su licencia original; ver `THIRD-PARTY-NOTICES.txt` y los avisos locales de cada componente.

© 2025 Mario Zechner  
© 2025-2026 Can Bölük  
© 2026 [Stencil Labs, Inc.](https://stencil.so)

MarIA Code se construye sobre su trabajo y mantiene sus avisos de copyright, como exige la licencia.
