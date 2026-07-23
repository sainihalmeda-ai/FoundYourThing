# GitHub setup

The project is committed locally on branch `main`. Push it to GitHub with these steps.

## 1. Create an empty repo on GitHub

1. Go to https://github.com/new
2. Repository name: `foundyourthing`
3. Keep it **Public** or **Private** (your choice)
4. Do **not** add README, `.gitignore`, or license (already in this project)
5. Click **Create repository**

## 2. Connect and push

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
cd c:\foundyourthing
git remote add origin https://github.com/YOUR_USERNAME/foundyourthing.git
git push -u origin main
```

If the remote already exists:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/foundyourthing.git
git push -u origin main
```

## 3. Ongoing workflow

After each feature or fix:

```powershell
git add .
git commit -m "Short description of what changed"
git push
```

## What is ignored (never commit)

- `backend/.env` — secrets
- `backend/venv/` — Python virtualenv
- `backend/uploads/` — user photos
- `backend/*.db` — local database
- `mobile/.env` — API URL on your machine
- `mobile/node_modules/` — dependencies

## Optional: GitHub CLI

Install [GitHub CLI](https://cli.github.com/) then:

```powershell
gh auth login
gh repo create foundyourthing --public --source=. --remote=origin --push
```
