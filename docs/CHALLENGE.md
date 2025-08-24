# Our challenge

The idea was to adapt a **business knowledge use case** to a format that resonates with the Hackathon audience.

In the real world, companies often face the challenge that when employees retire, they take a huge amount of tacit knowledge with them — knowledge that is rarely fully documented.

## Analogy

Consider the case of an **expert in accident investigation reports**.  
Their professional “achievements” are goals such as taking precise photos of an accident scene so the evidence can later hold up in court. To reach these goals, the expert may follow different processes: they might use measuring tools, draw chalk outlines, or apply other investigative methods.

In Minecraft, this situation can be represented through **crafting recipes**. Just as the investigator has multiple possible ways of achieving their objective, Minecraft players can choose different paths to craft an item.

Our goal is to build software that can **extract this hidden knowledge from a graph-like database** and represent it in a clear and comparable way.

## Use Cases

We considered four fundamental knowledge scenarios, illustrated with Minecraft achievements:

1. **Complete Knowledge** – all data for the achievement is present.
2. **Missing Knowledge** – the achievement can be reached, but some steps are undocumented (alternative crafting recipes exist).
3. **Missing Relevant Knowledge** – no possible path (no crafting tree) exists to reach the goal.
4. **Conflicting Knowledge** – different sources document **contradicting information** (e.g., two conflicting recipes for the same item).

## Flow chart

```mermaid
flowchart LR
%% =========================
%% High-level challenge + analogy
%% =========================
classDef title fill:#0f172a,stroke:#334155,color:#e5e7eb,stroke-width:1px
classDef group fill:#0b1220,stroke:#334155,color:#cbd5e1,stroke-width:1px
classDef comp fill:#0a1a2f,stroke:#475569,color:#e2e8f0,stroke-width:1px
classDef good fill:#052e16,stroke:#22c55e,color:#dcfce7
classDef warn fill:#3f1d00,stroke:#f59e0b,color:#ffedd5
classDef bad  fill:#3f0f12,stroke:#ef4444,color:#fee2e2
classDef neutral fill:#111827,stroke:#6b7280,color:#e5e7eb
classDef db fill:#0a1f2c,stroke:#38bdf8,color:#cffafe

    T["
    **Our challenge**  
    Adapt a business knowledge use case to hackathon audience.  
    Hidden/tacit knowledge must be made explicit & comparable.
    "]:::title

    A["
    **Analogy**  
    Accident investigation expert has multiple processes  
    to reach goals (like Minecraft crafting variants).
    "]:::group

    T --> A

    %% =========================
    %% Use cases panel
    %% =========================
    subgraph UC[Use Cases]
      direction TB
      UC1[\"Complete Knowledge\n(all steps known)\"]:::good
      UC2["Missing Knowledge\n(alternative steps undocumented)"]:::warn
      UC3["Missing Relevant Knowledge\n(no path to goal)"]:::neutral
      UC4["Conflicting Knowledge\n(contradicting recipes)"]:::bad
    end
    A --> UC

    %% =========================
    %% Architecture
    %% =========================
    subgraph ING[Data Ingestion]
      direction LR
      S1[[Official Source\n(e.g., recipes API/JSON)]]:::group
      S2[[Community Variant\n(e.g., CSV/Wiki scrape)]]:::group

      SCR1([Scraper #1]):::comp
      SCR2([Scraper #2]):::comp

      S1 --> SCR1
      S2 --> SCR2
    end

    subgraph ETL[Normalization & Harmonization]
      direction TB
      MAP([Schema Mapping\n(ID strategy, enums, images)]):::comp
      CLEAN([Cleaning & Dedup]):::comp
      HARM([Harmonizer\n(items & action-types source-agnostic,\nDifferences carried by actions)]):::comp
      QA([Data QA\n• completeness checks\n• conflict detection hooks]):::comp
      SCR1 --> MAP
      SCR2 --> MAP
      MAP --> CLEAN --> HARM --> QA
    end

    subgraph LOAD[Loader]
      direction TB
      L1([Graph Loader\n(bulk inserts)]):::comp
      DB[(Graph-like DB Schema\nPostgreSQL (recursive SQL) *or* Neo4j)]:::db
      L1 --> DB
    end

    subgraph BE[Backend (Flask)]
      direction TB
      API1[/GET /paths?goal=pickaxe_stone&source=* /]:::comp
      API2[/GET /conflicts?item=... /]:::comp
      API3[/GET /gaps?goal=... /]:::comp

      subgraph LOGIC[Evaluation Logic]
        direction TB
        PATH([Path Resolver\n(recursive SQL / graph traversal)]):::comp
        CONFLICT([Conflict Detector\n(compare actions per source)]):::comp
        GAP([Gap Analyzer\n(no path → missing relevant)]):::comp
      end

      DB --> PATH
      DB --> CONFLICT
      DB --> GAP

      PATH --> API1
      CONFLICT --> API2
      GAP --> API3
    end

    subgraph FE[Frontend (Angular)]
      direction TB
      VIZ([Graph Viewer\n(custom SVG with images & arrows]):::comp
      FILTER([Source & Variant Filters]):::comp
      BADGES([Use-case Badges\n(complete / missing / conflicting)]):::comp
      VIZ --> FILTER
      VIZ --> BADGES
    end

    %% Flows
    UC1 -. influences .-> PATH
    UC2 -. influences .-> PATH
    UC3 -. influences .-> GAP
    UC4 -. influences .-> CONFLICT

    QA --> L1
    API1 --> VIZ
    API2 --> VIZ
    API3 --> VIZ

    %% Legend
    subgraph LEGEND[Features & Notes]
      direction TB
      F1["• Multiple data sources ('official' vs 'community')"]:::neutral
      F2["• Graph-based modeling of recipes (actions, inputs, outputs)"]:::neutral
      F3["• Paths from achievements back to base items"]:::neutral
      F4["• Demo endpoints: paths, conflicts, gaps"]:::neutral
      F5["• Angular viz + Flask API"]:::neutral
    end
```

## Features

- Multiple data sources (e.g., “official” vs. “community variant”)
- Graph-based modeling of crafting recipes with recursive resolution
- Path queries from achievements back to base items
- Demo queries to showcase missing, incomplete, and conflicting knowledge
- Angular frontend for visualization
- Flask backend API to query the knowledge graph