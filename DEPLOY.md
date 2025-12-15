# Deployment Guide

This guide will help you deploy your application's **Backend** and connect it to **Supabase**.

## Prerequisites
- A GitHub account (where your code is pushed).
- A [Supabase](https://supabase.com/) account (for the database).
- A [Render](https://render.com/) account (for hosting the backend).

## Step 1: Setup Supabase Database

1.  Create a new project in Supabase.
2.  Go to **Project Settings** -> **Database**.
3.  Copy the **Connection String** (URI mode). It looks like: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
    *   *Remember the password you set when creating the project!*
4.  Go to **SQL Editor** in Supabase and run the following script to create the tables:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table users (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  role text default 'user',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sets table
create table sets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  name text not null,
  topic text,
  description text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Words table
create table words (
  id uuid default uuid_generate_v4() primary key,
  set_id uuid references sets(id) on delete cascade,
  word text not null,
  meaning text not null,
  type text,
  phonetic text,
  example text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Progress table
create table progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  word_id uuid references words(id) on delete cascade,
  box integer default 1,
  next_review timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, word_id)
);
```

## Step 2: Deploy Backend to Render

1.  Log in to [Render](https://render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `vocabmaster-api` (or similar)
    *   **Region**: Singapore (closest to Vietnam)
    *   **Root Directory**: `.` (Leave empty)

## Step 3: Update Netlify Frontend

1.  Go to your **Netlify** dashboard.
2.  Select your site -> **Site configuration** -> **Environment variables**.
3.  Add a new variable:
    *   **Key**: `VITE_API_URL`
    *   **Value**: The Render Service URL from Step 2 (e.g., `https://vocabmaster-api.onrender.com`)
4.  Go to **Deploys** and **Trigger deploy** to rebuild the frontend with the new setting.

## Done!
Your app should now be fully functional with the Frontend on Netlify and Backend on Render + Supabase.
