-- Hierarquia da equipe: o antigo ADMIN vira OWNER (Proprietário).
-- RENAME VALUE preserva as linhas existentes — quem era ADMIN passa a ser OWNER
-- sem precisar de UPDATE. Os novos níveis entram antes de OWNER para manter a
-- ordem do enum igual à do schema.
ALTER TYPE "Role" RENAME VALUE 'ADMIN' TO 'OWNER';
ALTER TYPE "Role" ADD VALUE 'STAFF' BEFORE 'OWNER';
ALTER TYPE "Role" ADD VALUE 'MANAGER' BEFORE 'OWNER';
