# SSC CGL Prep Platform - Living Content System

A comprehensive, AI-powered exam preparation platform for SSC CGL with a **living question bank**, **daily automated test generation**, **secure role-based access**, and **mandatory human review for all content**.

## 🎯 Project Overview

### Core Features
- **100 Tests**: 50 full-length + 50 topic-wise tests
- **3 Preloaded Users**: Dulip Pegu (Student), Udit Doley (Student), Rana Pegu (Examiner)
- **Secure RBAC**: Student, Examiner, Admin, Editor roles
- **Timed Tests**: Server-side authoritative timing with detailed analytics
- **Living Content System**: All questions versioned, source-tracked, and reviewable
- **Daily Automated Ingestion**: Web scraping from 4+ educational sources
- **AI-Assisted Generation**: Optional question generation with mandatory review
- **Post-Test Analytics**: Weak-topic ranking, performance metrics, recommendations

### Tech Stack
- **Backend**: Node.js + Express + TypeScript + TypeORM
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Database**: PostgreSQL + Redis (sessions/caching)
- **Authentication**: JWT + Refresh Tokens
- **AI Integration**: OpenAI API (embeddings, question generation)

## 📁 Repository Structure

```
ssc-cgl-master/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts
│   ├── migrations/
│   ├── seeds/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── docs/
    ├── DATABASE.md
    ├── API.md
    └── ARCHITECTURE.md
```

## 📋 Implementation Phases

- **Phase 1**: ✅ Foundation - Database, Auth, Basic API (Starting)
- **Phase 2**: Test taking interface & timed tests
- **Phase 3**: Analytics & dashboards
- **Phase 4**: Content management & moderation
- **Phase 5**: AI & web scraping integration
- **Phase 6**: Polish & production hardening

---

**Status**: Phase 1 - Foundation (Step 1.1: Project Setup)
