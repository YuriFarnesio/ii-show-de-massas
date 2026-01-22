create table buyers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  cpf text not null unique,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table orders (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references buyers(id) not null,
  external_id text unique,
  invoice_slug text unique,
  receipt_url text,
  amount integer not null,
  paid_amount integer,
  payment_method text,
  installments integer,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table tickets (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) not null,
  name text not null,
  type text not null,
  is_member boolean default false not null,
  nucleo_name text,
  gluten_intolerant boolean default false not null,
  lactose_intolerant boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table buyers enable row level security;
alter table orders enable row level security;
alter table tickets enable row level security;

comment on column orders.invoice_slug is 'Identificador da fatura na operadora';
comment on column orders.receipt_url is 'Link direto para o comprovante oficial';
comment on column orders.payment_method is 'Método de captura (pix ou credit_card)';
comment on column orders.paid_amount is 'Valor exato processado pela operadora em centavos';