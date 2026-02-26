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
const usersHtml = fs.readFileSync(path.join(__dirname, "public", "users.html"), "utf8");

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || "Users";
const mongoUsersCollection = process.env.MONGODB_USERS_COLLECTION || "database";
const seedOnBoot = process.env.SEED_ON_BOOT === "true";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ctf_secret_dev",
    resave: false,
    saveUninitialized: false,
  })
);

const seedUsers = [
  { username: "Daniel", password: "linkinpark1996" },
  { username: "Jana", password: "janabanana" },
  { username: "Silva", password: "palmeiras1914" },
  { username: "Maria", password: "maria123" },
  { username: "Carlos", password: "carlos789" },
  { username: "Ana", password: "ana456" },
];

const adminPublicProfileId = "manager";
const publicUserIdByUsername = {
  Jana: "1",
  Maria: "2",
  Silva: "3",
  Carlos: "4",
};

const workAreaByUsername = {
  Daniel: "Desenvolvedor SÃªnior | LÃ­der de Equipe",
  Jana: "Desenvolvedora Frontend",
  Silva: "Desenvolvedor Backend",
  Maria: "Desenvolvedora Frontend",
  Carlos: "Diretor Comercial",
};

function getPublicProfileIdByUsername(username) {
  if (username === "Daniel") {
    return adminPublicProfileId;
  }
  return publicUserIdByUsername[username] || null;
}

function getUsernameByPublicProfileId(profileId) {
  if (profileId === adminPublicProfileId) {
    return "Daniel";
  }

  const foundEntry = Object.entries(publicUserIdByUsername).find(
    ([, id]) => String(id) === String(profileId)
  );

  return foundEntry ? foundEntry[0] : null;
}

function getWorkAreaByUsername(username) {
  return workAreaByUsername[username] || "frontend";
}

function isBackendUser(username) {
  return String(username || "").trim() === "Silva";
}

let usersCollection;

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

    console.log('aqui::  ')

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
      name: "Daniel Bassani",
      role: "Gerente",
      team: "Infra e Seguranca",
      phone: "+55 11 95555-1001",
    },
    jana: {
      name: "Jana Ina",
      role: "Desenvolvedora Frontend",
      team: "Produto Web",
      phone: "+55 11 95555-1022",
    },
    silva: {
      name: "Silva da Cunha",
      role: "Desenvolvedor Full Stack",
      team: "Tecnologia",
      phone: "+55 11 95555-1038",
    },
    maria: {
      name: "Maria Gomes",
      role: "Desenvolvedora Frontend",
      team: "Produto Web",
      phone: "+55 11 95555-1045",
    },
    carlos: {
      name: "Carlos Almeida",
      role: "Diretor Comercial",
      team: "Comercial",
      phone: "+55 11 95555-1090",
    },
    ana: {
      name: "Ana Carvalho",
      role: "QA Engineer",
      team: "Qualidade",
      phone: "+55 11 95555-1072",
    },
  };

  const normalizedUsername = String(username || "").toLowerCase();
  const defaultEntry = {
    name: `Funcionario ${username}`,
    role: "Colaborador Interno",
    team: "Operacoes",
    phone: "+55 11 95555-0000",
    favorites: {
      language: "Node",
      editor: "VS Code",
      team: "Indefinido",
    },
    avatarYear: "2000",
    stats: {
      followers: "0",
      likes: "0",
      photos: "0",
    },
    note: "Sem anotacoes internas.",
  };
  const entry = {
    ...defaultEntry,
    ...(profileMap[normalizedUsername] || {}),
  };

  const publicProfileId = getPublicProfileIdByUsername(username);

  return {
    id: publicProfileId || userId,
    username,
    name: entry.name,
    role: entry.role,
    workArea: getWorkAreaByUsername(username),
    team: entry.team,
    phone: entry.phone,
    email: `${username}@empresa-interna.local`,
    avatarYear: entry.avatarYear,
    favorites: entry.favorites,
    stats: entry.stats,
    note: entry.note,
  };
}

function renderEmployeeAreaHtml(profile) {
  const templateData = {
    CURRENT_USER: profile.username,
    PROFILE_NAME: profile.name,
    PROFILE_USERNAME: profile.username,
    PROFILE_ID: String(profile.id),
    PROFILE_ROLE: profile.role,
    PROFILE_WORK_AREA: profile.workArea,
    PROFILE_EMAIL: profile.email,
    PROFILE_PHONE: profile.phone,
    PROFILE_TEAM: profile.team,
    PROFILE_AVATAR_YEAR: profile.avatarYear,
    PROFILE_FAV_LANGUAGE: profile.favorites.language,
    PROFILE_FAV_EDITOR: profile.favorites.editor,
    PROFILE_FAV_TEAM: profile.favorites.team,
    PROFILE_STATS_FOLLOWERS: profile.stats.followers,
    PROFILE_STATS_LIKES: profile.stats.likes,
    PROFILE_STATS_PHOTOS: profile.stats.photos,
    PROFILE_INTERNAL_NOTE: profile.note,
  };

  return Object.entries(templateData).reduce((html, [key, value]) => {
    return html.replaceAll(`{{${key}}}`, value);
  }, usersHtml);
}

function buildInternalCommits() {
  return [
    
    {
      sha: "b23d8aa",
      author: "ana",
      message: "test(auth): checklist de sessao e logout finalizado",
      date: "2026-02-21T10:04:00Z",
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
      author: "carlos",
      message: "feat(users): criar area de perfil para funcionarios",
      date: "2026-02-21T12:02:00Z",
      source: "GitHub",
    },
    {
      sha: "08cd2f9",
      author: "silva",
      message: "fix(session): reduzir timeout de sessao ociosa",
      date: "2026-02-21T12:19:00Z",
      source: "GitHub",
    },
    {
      sha: "19ef33c",
      author: "daniel",
      message: "docs(security): registrar fluxo de permissoes admin",
      date: "2026-02-21T12:41:00Z",
      source: "GitHub",
    },
    {
      sha: "2af0451",
      author: "jana",
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
      author: "maria",
      message: "chore: pendencia de endpoint TWF4TmV0 para revisao",
      date: "2026-02-21T14:04:00Z",
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
      sha: "92c7f03",
      author: "carlos",
      message: "ops: revisar restart da app apos seed do banco",
      date: "2026-02-21T15:30:00Z",
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

function requireBackend(req, res, next) {
  if (!req.session.user || !isBackendUser(req.session.user.username)) {
    return res.status(403).send("Acesso restrito ao funcionario do setor.");
  }
  return next();
}

function decodeJwtPart(part) {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
}

function hasWeakInternalApiAccess(req) {
  if (req.session.user && isBackendUser(req.session.user.username)) {
    return true;
  }

  if (String(req.headers["x-internal-request"] || "").toLowerCase() === "true") {
    return true;
  }

  if (String(req.headers["x-employee-role"] || "").toLowerCase() === "backend") {
    return true;
  }

  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  const parts = token.split(".");
  if (parts.length < 2) {
    return false;
  }

  const header = decodeJwtPart(parts[0]);
  const payload = decodeJwtPart(parts[1]);

  if (!header || !payload) {
    return false;
  }

  // Vulnerabilidade intencional para CTF: confia em alg=none e nao valida assinatura.
  return String(header.alg || "").toLowerCase() === "none" && String(payload.role || "").toLowerCase() === "backend";
}

function requireInternalTeamsAccess(req, res, next) {
  if (!hasWeakInternalApiAccess(req)) {
    return res.status(403).send("Acesso restrito ao funcionario do setor.");
  }
  return next();
}

app.use(express.static(path.join(__dirname, "public")));

const sensitiveRoutes = ["/old-login", "/admin-backup", "/manager/commits", "/search"];

app.get("/internal/teams", requireInternalTeamsAccess, (req, res) => {
  return res.json({
    teams: {
      // backend: {
      //   internal_tools: ["/search", "/logs"],
      // },
      manager: {
        restricted_tools: ["/manager/commits"],
      },
    },
    logs: [
      "manager pushed security fix",
      "commit reverted previous file removal",
    ],
  });
});

// Pagina inicial estilizada
app.get("/", (req, res) => {
  res.send(homeHtml);
});

app.get("/login", (req, res) => {
  res.send(loginHtml);
});

app.get("/users", requireLogin, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.redirect("/login");
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(req.session.user.id) });
    const profileId = getPublicProfileIdByUsername(user ? user.username : req.session.user.username);

    if (profileId) {
      return res.redirect(`/users/${profileId}`);
    }

    const fallbackId = user ? user._id.toString() : req.session.user.id;
    return res.redirect(`/users/${fallbackId}`);
  } catch (error) {
    console.error("Erro ao resolver perfil da sessao:", error.message);
    return res.status(500).send("Erro ao consultar perfil.");
  }
});

// Vulnerabilidade intencional (IDOR): qualquer funcionario autenticado pode
// acessar o perfil de outros funcionarios trocando o ID na URL.
app.get("/users/:profileId", requireLogin, async (req, res) => {
  const requestedProfileId = String(req.params.profileId || "").trim();

  try {
    if (
      requestedProfileId === adminPublicProfileId &&
      (!req.session.user || req.session.user.username !== "Daniel")
    ) {
      return res.status(403).send("Acesso restrito ao admin.");
    }

    const mappedUsername = getUsernameByPublicProfileId(requestedProfileId);
    let user = null;

    if (mappedUsername) {
      user = await usersCollection.findOne({ username: mappedUsername });
    } else if (ObjectId.isValid(requestedProfileId)) {
      user = await usersCollection.findOne({ _id: new ObjectId(requestedProfileId) });
    }

    if (!user) {
      return res.status(404).send("Funcionario nao encontrado.");
    }

    const profile = buildEmployeeProfile(requestedProfileId, user.username);
    return res.send(renderEmployeeAreaHtml(profile));
  } catch (error) {
    console.error("Erro ao buscar perfil por ID:", error.message);
    return res.status(500).send("Erro ao consultar perfil.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

async function renderManagerArea(req, res) {
  try {
    const adminUser = await usersCollection.findOne({ username: "Daniel" });
    if (!adminUser) {
      return res.status(404).send("Funcionario nao encontrado.");
    }
    const adminProfile = buildEmployeeProfile(adminPublicProfileId, adminUser.username);
    return res.send(renderEmployeeAreaHtml(adminProfile));
  } catch (error) {
    console.error("Erro ao carregar area do manager:", error.message);
    return res.status(500).send("Erro ao consultar perfil.");
  }
}

// app.get("/manager", requireLogin, requireAdmin, renderManagerArea);
app.get("/users/manager", requireLogin, requireAdmin, renderManagerArea);

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = (username || "").trim();
  const cleanPassword = (password || "").trim();

  try {
    if (!cleanUsername && !cleanPassword) {
      return res.redirect("/login?error=both_invalid");
    }
    if (!cleanUsername) {
      return res.redirect("/login?error=user_invalid");
    }
    if (!cleanPassword) {
      return res.redirect("/login?error=password_invalid");
    }

    const user = await usersCollection.findOne({ username: cleanUsername });
    if (!user) {
      const passwordExists = await usersCollection.findOne({ password: cleanPassword });
      if (!passwordExists) {
        return res.redirect("/login?error=both_invalid");
      }
      return res.redirect("/login?error=user_invalid");
    }

    if (user.password !== cleanPassword) {
      return res.redirect("/login?error=password_invalid");
    }

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      workArea: getWorkAreaByUsername(user.username),
    };
      return res.redirect("/users");
  } catch (error) {
    console.error("Erro no login:", error.message);
    return res.status(500).send("Erro interno no servidor.");
  }
});


function requireAdminHidden(req, res, next) {
  if (!req.session.user || req.session.user.username !== "Daniel") {
    return res.status(404).send("Not Found");
  }
  return next();
}

app.get(["/users/manager/commits"], requireLogin, requireAdminHidden, async (req, res) => {

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

