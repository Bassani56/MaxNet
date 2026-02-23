require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const homeHtml = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");
const loginHtml = fs.readFileSync(path.join(__dirname, "public", "login.html"), "utf8");
const registerHtml = fs.readFileSync(path.join(__dirname, "public", "register.html"), "utf8");
const usersHtml = fs.readFileSync(path.join(__dirname, "public", "users.html"), "utf8");
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || "Users";
const mongoUsersCollection = process.env.MONGODB_USERS_COLLECTION || "database";
const seedOnBoot = process.env.SEED_ON_BOOT === "true";
let usersCollection;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ctf_secret_dev",
    resave: false,
    saveUninitialized: false,
  })
);

const seedUsers = [
  { username: "Daniel", password: "sensitive2006" },
  { username: "Jana", password: "janabanana" },
  { username: "Silva", password: "joao2026" },
  { username: "Maria", password: "maria123" },
  { username: "Carlos", password: "carlos789" },
  { username: "Ana", password: "ana456" },
  { username: "Pedro", password: "pedro321" },
  { username: "Juliana", password: "ju_alves" },
  { username: "Rafael", password: "rafael007" },
  { username: "Camila", password: "camila2026" },
  { username: "Lucas", password: "lucas1234" },
  { username: "Fernanda", password: "fernanda88" },
];

async function initMongo() {
  if (!mongoUri) {
    throw new Error("Defina MONGODB_URI no ambiente.");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  const db = client.db(mongoDbName);
  usersCollection = db.collection(mongoUsersCollection);

  await usersCollection.createIndex({ username: 1 }, { unique: true });

  if (seedOnBoot) {
    await usersCollection.deleteMany({});
    await usersCollection.insertMany(seedUsers);
    console.log("Seed executado (SEED_ON_BOOT=true).");
  } else {
    const totalUsers = await usersCollection.countDocuments();
    if (totalUsers === 0) {
      await usersCollection.insertMany(seedUsers);
      console.log("Seed inicial executado (colecao vazia).");
    }
  }

  console.log(`MongoDB conectado: ${mongoDbName}/${mongoUsersCollection}`);
}

function buildEmployeeProfile(userId, username) {
  const profileMap = {
    daniel: {
      name: "Daniel Bassani Fabricio",
      role: "Gerente",
      team: "Infra e Seguranca",
      phone: "+55 11 95555-1001",
    },
    luana: {
      name: "Luana Ribeiro",
      role: "Desenvolvedora Frontend",
      team: "Produto Web",
      phone: "+55 11 95555-1022",
    },
    rafael: {
      name: "Rafael Nunes",
      role: "Analista de Seguranca",
      team: "Infra e Seguranca",
      phone: "+55 11 95555-1038",
    },
    camila: {
      name: "Camila Duarte",
      role: "Gerente de Projeto",
      team: "Gestao de Produto",
      phone: "+55 11 95555-1045",
    },
    ana: {
      name: "Ana Carvalho",
      role: "QA Engineer",
      team: "Qualidade",
      phone: "+55 11 95555-1072",
    },
  };

  const normalizedUsername = String(username || "").toLowerCase();
  const entry = profileMap[normalizedUsername] || {
    name: `Funcionario ${username}`,
    role: "Colaborador Interno",
    team: "Operacoes",
    phone: "+55 11 95555-0000",
  };

  return {
    id: userId,
    username,
    name: entry.name,
    role: entry.role,
    team: entry.team,
    phone: entry.phone,
    email: `${username}@empresa-interna.local`,
  };
}

function renderEmployeeAreaHtml(profile) {
  return usersHtml
    .replace("{{CURRENT_USER}}", profile.username)
    .replace("{{PROFILE_NAME}}", profile.name)
    .replace("{{PROFILE_USERNAME}}", profile.username)
    .replace("{{PROFILE_ID}}", String(profile.id))
    .replace("{{PROFILE_ROLE}}", profile.role)
    .replace("{{PROFILE_EMAIL}}", profile.email)
    .replace("{{PROFILE_PHONE}}", profile.phone)
    .replace("{{PROFILE_TEAM}}", profile.team);
}

function buildInternalCommits() {
  return [
    {
      sha: "a91c2f0",
      author: "luana",
      message: "fix(home): ajustar bloco de contato e espaco mobile",
      date: "2026-02-21T09:12:00Z",
      source: "GitHub",
    },
    {
      sha: "b23d8aa",
      author: "ana",
      message: "test(auth): checklist de sessao e logout finalizado",
      date: "2026-02-21T10:04:00Z",
      source: "GitHub",
    },
    {
      sha: "c44e6bd",
      author: "rafael",
      message: "security(login): revisar regra de acesso da area administrativa",
      date: "2026-02-21T10:48:00Z",
      source: "GitHub",
    },
    {
      sha: "d71f93e",
      author: "camila",
      message: "docs(project): atualizar notas da entrega da sprint",
      date: "2026-02-21T11:10:00Z",
      source: "GitHub",
    },
    {
      sha: "e8b41ad",
      author: "carlos",
      message: "chore(ci): atualizar pipeline de deploy interno",
      date: "2026-02-21T11:34:00Z",
      source: "GitHub",
    },
    {
      sha: "f29ab17",
      author: "juliana",
      message: "feat(users): criar area de perfil para funcionarios",
      date: "2026-02-21T12:02:00Z",
      source: "GitHub",
    },
    {
      sha: "08cd2f9",
      author: "pedro",
      message: "fix(session): reduzir timeout de sessao ociosa",
      date: "2026-02-21T12:19:00Z",
      source: "GitHub",
    },
    {
      sha: "19ef33c",
      author: "fernanda",
      message: "docs(security): registrar fluxo de permissoes admin",
      date: "2026-02-21T12:41:00Z",
      source: "GitHub",
    },
    {
      sha: "2af0451",
      author: "lucas",
      message: "perf(db): revisar indices da tabela users",
      date: "2026-02-21T13:05:00Z",
      source: "GitHub",
    },
    {
      sha: "3bc9d2e",
      author: "maria",
      message: "refactor(layout): simplificar css da area interna",
      date: "2026-02-21T13:23:00Z",
      source: "GitHub",
    },
    {
      sha: "4d01eaf",
      author: "silva",
      message: "chore: validar token QmFzc2FuaTU2 no parser de logs",
      date: "2026-02-21T13:47:00Z",
      source: "GitHub",
    },
    {
      sha: "5e2bf44",
      author: "luana",
      message: "chore: pendencia de endpoint TWF4TmV0 para revisao",
      date: "2026-02-21T14:04:00Z",
      source: "GitHub",
    },
    {
      sha: "6f3c8b0",
      author: "rafael",
      message: "note: referencia de auditoria https://github.com",
      date: "2026-02-21T14:28:00Z",
      source: "GitHub",
    },
    {
      sha: "70a5dd1",
      author: "ana",
      message: "test(registro): adicionar cenarios de username existente",
      date: "2026-02-21T14:52:00Z",
      source: "GitHub",
    },
    {
      sha: "81b611a",
      author: "camila",
      message: "pm(update): ajustar checklist da sprint para sexta",
      date: "2026-02-21T15:07:00Z",
      source: "GitHub",
    },
    {
      sha: "92c7f03",
      author: "carlos",
      message: "ops: revisar restart da app apos seed do banco",
      date: "2026-02-21T15:30:00Z",
      source: "GitHub",
    },
    {
      sha: "a3d8be4",
      author: "pedro",
      message: "fix(login): mensagem de erro para credenciais invalidas",
      date: "2026-02-21T15:46:00Z",
      source: "GitHub",
    },
    {
      sha: "b4e9265",
      author: "fernanda",
      message: "qa: revisar compatibilidade do painel em resolucao baixa",
      date: "2026-02-21T16:12:00Z",
      source: "GitHub",
    },
    {
      sha: "c50af98",
      author: "juliana",
      message: "feat(chat): inserir mensagens iniciais do grupo interno",
      date: "2026-02-21T16:39:00Z",
      source: "GitHub",
    },
    {
      sha: "d6b13ac",
      author: "lucas",
      message: "db: conferir consistencia de ids apos cadastro",
      date: "2026-02-21T17:02:00Z",
      source: "GitHub",
    },
    {
      sha: "e7c2d9f",
      author: "maria",
      message: "docs(front): atualizar texto institucional da homepage",
      date: "2026-02-21T17:26:00Z",
      source: "GitHub",
    },
  ];
}

function renderCommitsHtml(commits) {
  const rows = commits
    .map((commit) => {
      return `<tr><td>${commit.sha || "-"}</td><td>${commit.author || "-"}</td><td>${commit.message || "-"}</td><td>${commit.date || "-"}</td><td>${commit.source || "-"}</td></tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Commits do Repositorio</title>
  <style>
    body {
      background: #030712;
      color: #e5e7eb;
      font-family: "Courier New", monospace;
      padding: 30px;
    }
    .box {
      max-width: 1100px;
      margin: 0 auto;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 20px;
      background: #0f172a;
    }
    h1 {
      color: #22c55e;
      margin-top: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #334155;
      padding: 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #111827;
    }
    a {
      color: #22c55e;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>Commits do GitHub</h1>
    <table>
      <thead>
        <tr>
          <th>SHA</th>
          <th>Autor</th>
          <th>Mensagem</th>
          <th>Data</th>
          <th>Origem</th>
        </tr>
      </thead>
      <tbody>${rows || "<tr><td colspan='5'>Sem commits</td></tr>"}</tbody>
    </table>
    <p><a href="/users">Voltar para usuarios</a></p>
    <p><a href="/logout">Sair</a></p>
  </div>
</body>
</html>
`;
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.username !== "Daniel") {
    return res.status(403).send("Acesso restrito ao admin.");
  }
  return next();
}

// Pagina inicial estilizada
app.get("/", (req, res) => {
  res.send(homeHtml);
});

app.get("/login", (req, res) => {
  res.send(loginHtml);
});

app.get("/register", (req, res) => {
  res.send(registerHtml);
});

app.get("/users", requireLogin, async (req, res) => {
  try {
    let user = null;
    if (req.session.user && req.session.user.id) {
      user = await usersCollection.findOne({ _id: new ObjectId(req.session.user.id) });
    }

    const id = user ? user._id.toString() : req.session.user.id;
    const username = user ? user.username : req.session.user.username;
    const profile = buildEmployeeProfile(id, username);
    return res.send(renderEmployeeAreaHtml(profile));
  } catch (error) {
    console.error("Erro ao buscar usuario da sessao:", error.message);
    return res.status(500).send("Erro ao consultar perfil.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = (username || "").trim();
  const cleanPassword = (password || "").trim();

  if (!cleanUsername || !cleanPassword) {
    return res.status(400).send("Username e senha sao obrigatorios.");
  }

  try {
    const existing = await usersCollection.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(409).send("Usuario ja existe. Tente outro username.");
    }

    await usersCollection.insertOne({ username: cleanUsername, password: cleanPassword });
    return res.redirect("/login");
  } catch (error) {
    console.error("Erro ao cadastrar usuario:", error.message);
    return res.status(500).send("Erro ao cadastrar usuario.");
  }
});

// Login vulneravel
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const row = await usersCollection.findOne({ username, password });

    if (row) {
      req.session.user = { id: row._id.toString(), username: row.username };
      return res.redirect("/users");
    }
    return res.redirect("/login?error=1");
  } catch (error) {
    console.error("Erro no login:", error.message);
    return res.status(500).send("Erro interno no servidor.");
  }
});

app.get("/admin/commits", requireAdmin, async (req, res) => {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return res
      .status(500)
      .send("Configure GITHUB_OWNER, GITHUB_REPO e GITHUB_TOKEN no ambiente.");
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ctf-entrar-app",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Erro GitHub API:", response.status, body);
      return res.status(500).send("Erro ao buscar commits no GitHub.");
    }

    const githubCommits = (await response.json()).map((commit) => ({
      sha: commit.sha ? commit.sha.slice(0, 7) : "-",
      author: commit.commit && commit.commit.author ? commit.commit.author.name : "-",
      message: commit.commit && commit.commit.message ? commit.commit.message : "-",
      date: commit.commit && commit.commit.author ? commit.commit.author.date : "-",
      source: "GitHub",
    }));

    const internalCommits = buildInternalCommits();
    const mixedCommits = [...githubCommits, ...internalCommits].sort((a, b) => {
      const aTime = Date.parse(a.date);
      const bTime = Date.parse(b.date);
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return 0;
      }
      return bTime - aTime;
    });

    return res.send(renderCommitsHtml(mixedCommits));
  } catch (error) {
    console.error("Erro na consulta de commits:", error);
    return res.status(500).send("Erro ao consultar commits.");
  }
});

async function startServer() {
  try {
    await initMongo();
    app.listen(3000, () => {
      console.log("http://localhost:3000");
    });
  } catch (error) {
    console.error("Falha ao iniciar servidor:", error.message);
    process.exit(1);
  }
}

startServer();
