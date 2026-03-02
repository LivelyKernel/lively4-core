# AI Workspace Introduction

## Motivation

Our research explores hands-free programming experiences, with the ultimate goal of enabling live programming in VR environments. To achieve this, we need effective voice interaction with AI coding agents. This work presents a hybrid architecture combining real-time voice models with specialized code agents, addressing the fundamental tension between conversational speed and code quality.

## Document Structure

This documentation describes our exploration of voice-driven AI-assisted programming through a hybrid agent system. 

[Background](background.md) establishes context by contrasting modern code agents (deep reasoning, slow interaction) with realtime voice agents (fast conversation, shallow reasoning), highlighting the gap our work addresses. 

[Approach](approach.md) discusses the core problem (traditional audio-to-text limitations), our key insight (the speed-depth tradeoff in AI models), and the resulting dual-agent solution. It maps out the design space we're exploring through dogfooding experiments: different agent responsibility models, interaction patterns, and capability distributions. 

[Implementation](implementation.md) covers the technical architecture, components, and infrastructure built to support this exploration. 

Current status, detailed component APIs, and refactoring tasks are documented in [ai-workspace.md](ai-workspace.md) and [refactoring.md](refactoring.md).
