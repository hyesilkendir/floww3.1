# 🚀 CLEAN SUPABASE-FIRST SETUP PLAN

## 1️⃣ CURRENT STATE BACKUP
- [ ] Export existing data (if any valuable)
- [ ] Document current auth users

## 2️⃣ SUPABASE RESET
- [ ] Drop all custom tables
- [ ] Reset Supabase Auth
- [ ] Create fresh schema

## 3️⃣ NEW SCHEMA (snake_case)
```sql
-- Users table (remove - use auth.users)
-- clients table (clean snake_case)
-- employees table (clean snake_case) 
-- transactions table (clean snake_case)
```

## 4️⃣ AUTH SYSTEM CLEANUP
- [ ] Remove custom auth from store
- [ ] Remove auth mapping utility
- [ ] Use only supabase.auth.getUser()
- [ ] Update all pages to use Supabase Auth

## 5️⃣ DATA SERVICES UPDATE
- [ ] Remove field mapping (use snake_case directly)
- [ ] Update TypeScript interfaces
- [ ] Simplify supabase-service.ts

## 6️⃣ TESTING
- [ ] Test auth flow
- [ ] Test CRUD operations
- [ ] Test data persistence
