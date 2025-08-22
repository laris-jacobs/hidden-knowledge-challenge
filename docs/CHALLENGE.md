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

## Features

- Multiple data sources (e.g., “official” vs. “community variant”)
- Graph-based modeling of crafting recipes with recursive resolution
- Path queries from achievements back to base items
- Demo queries to showcase missing, incomplete, and conflicting knowledge
- Angular frontend for visualization
- Flask backend API to query the knowledge graph