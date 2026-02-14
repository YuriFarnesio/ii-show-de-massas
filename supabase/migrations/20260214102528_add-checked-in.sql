-- Adiciona coluna de controle de presença na tabela tickets
alter table tickets
  add column checked_in boolean default false not null;

-- Índice parcial para contagem rápida de check-ins
create index idx_tickets_checked_in on tickets (checked_in)
  where checked_in = true;
