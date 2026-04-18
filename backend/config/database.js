const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/letters.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✓ Connected to SQLite database');
    initializeTables();
  }
});

// Initialize database tables
function initializeTables() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Public letters by author (the open letters platform)
    db.run(`
      CREATE TABLE IF NOT EXISTS public_letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        letterNumber INTEGER,
        authorName TEXT NOT NULL,
        title TEXT NOT NULL,
        preview TEXT,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        tags TEXT DEFAULT '',
        accentColor TEXT DEFAULT '#D43F3A',
        publishedAt DATETIME,
        isApproved INTEGER DEFAULT 0,
        userId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Add imageData column if missing
    db.run(`ALTER TABLE public_letters ADD COLUMN imageData TEXT`, () => {});

    // Private user-drafted letters (portal feature)
    db.run(`
      CREATE TABLE IF NOT EXISTS letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        recipientName TEXT NOT NULL,
        recipientEmail TEXT,
        subject TEXT,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        tags TEXT DEFAULT '',
        summary TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        sentAt DATETIME,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Migrate existing letters table — add columns added after initial schema
    db.run(`ALTER TABLE letters ADD COLUMN category TEXT DEFAULT 'General'`, () => {});
    db.run(`ALTER TABLE letters ADD COLUMN tags TEXT DEFAULT ''`, () => {});
    db.run(`ALTER TABLE letters ADD COLUMN summary TEXT DEFAULT ''`, () => {});
    db.run(`ALTER TABLE letters ADD COLUMN imageData TEXT`, () => {});

    // Letter attachments table
    db.run(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        letterId INTEGER NOT NULL,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (letterId) REFERENCES letters(id)
      )
    `);

    // Visitor letters — submitted by website visitors (unauthenticated)
    db.run(`
      CREATE TABLE IF NOT EXISTS visitor_letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        penName TEXT NOT NULL,
        email TEXT,
        title TEXT NOT NULL,
        preview TEXT,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        tags TEXT DEFAULT '',
        location TEXT,
        status TEXT DEFAULT 'pending',
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subscribers table
    db.run(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed the 10 existing public letters (only if table is empty)
    db.get(`SELECT COUNT(*) as count FROM public_letters`, (err, row) => {
      if (!err && row.count === 0) {
        seedPublicLetters(db);
      }
    });

    // Auto-seed admin user on every startup (safe — uses INSERT OR IGNORE)
    seedAdminUser(db);
  });
}

function seedAdminUser(db) {
  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'eoforid@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ejDanso22$';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Eoforid';

  db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail], (err, row) => {
    if (err || row) return; // already exists or error
    bcrypt.hash(adminPassword, 10, (err, hash) => {
      if (err) return;
      db.run(
        `INSERT OR IGNORE INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, '')`,
        [adminEmail, hash, adminFirstName],
        () => { console.log('✓ Admin user seeded'); }
      );
    });
  });
}

function seedPublicLetters(db) {
  const letters = [
    {
      letterNumber: 1,
      authorName: 'A Ghanaian with a Melting Fridge',
      title: 'On the Matter of "Dumsor" and the Audacity of Darkness',
      preview: '"Dear Osagyefo, you spoke of African unity lighting up the continent. The continent responded by giving us load-shedding schedules..."',
      content: `Dear Osagyefo,

I hope this letter finds you in a dimension that has, at the very minimum, twenty-four hours of uninterrupted electricity. We do not, as you may have surmised, have that here.

You spoke of industrialisation. You built the Akosombo Dam — a colossal monument to ambition and the optimism of a newly independent nation. Then Ghana got creative.

We created something called Dumsor — a portmanteau from Twi meaning "off-on." The lights go off. Then they come on. Then they go off again. Sometimes for hours.

We have adapted remarkably. Generators are standard fixtures. Power banks, candle sellers, generator fuel vendors — an entire ecosystem built around light-off has emerged.

We do not blame you, Osagyefo. You gave us the dam. What we did with the transmission lines afterwards is entirely our own achievement.

Yours faithfully, with a charged power bank,
A Ghanaian with a Melting Fridge`,
      category: 'Culture',
      tags: 'dumsor,energy',
      accentColor: '#D43F3A',
      publishedAt: '2024-03-06',
      isApproved: 1
    },
    {
      letterNumber: 2,
      authorName: 'A MoMo Agent in Kumasi',
      title: 'On Mobile Money, and How We Accidentally Built Socialism in Our Phones',
      preview: '"You redistributed land, Kwame. We redistributed airtime credit. Both are controversial at family gatherings..."',
      content: `Dear Osagyefo,

You championed socialism. We laughed at it in the 1980s, then thirty years later accidentally rebuilt parts of it inside our mobile phones.

Mobile Money — MoMo — launched in 2009. It allows anyone with a phone to send, receive, and store money through agents at roadside kiosks, barbershops, and churches.

The redistribution is staggering. A market woman in Tamale can receive payment from her daughter in Accra within seconds. The unbanked were, within a decade, sending money like texts.

You tried to build state infrastructure. The market built its own through the air.

We found your socialism, Kwame. It was yellow, fit in a pocket, and was MTN-branded.

With mobile-transferred regards,
A MoMo Agent in Kumasi`,
      category: 'Economy',
      tags: 'mobile money,socialism,fintech',
      accentColor: '#E8B923',
      publishedAt: '2023-08-04',
      isApproved: 1
    },
    {
      letterNumber: 3,
      authorName: 'A Diaspora Returnee',
      title: 'The Year of Return: A Homecoming in Four Acts',
      preview: '"You declared: \'Africa must unite.\' We said: \'We\'ll visit.\' 2019 became the Year of Return. Millions came home..."',
      content: `Dear Osagyefo,

You declared: "Africa must unite." We listened. For decades, the diaspora lived the dream elsewhere — Boston, London, Toronto, Accra-in-spirit.

Then 2019 came. The year you would have turned 110. Ghana declared it the "Year of Return" — a homecoming for all those who'd left.

And we came. Millions. We came to Elmina and Gorée, to face the ghosts of our origins. We came to Accra, to taste our mother's cooking. We came to reclaim something we didn't know we'd lost.

For a moment, the diaspora became the home. The prodigals returned not as visitors, but as inheritors. Tourism became pilgrimage.

The Year of Return asked: what does it mean to belong? Not to a place, but to a people, a history, a reckoning?

From the soil of remembrance,
A Diaspora Returnee`,
      category: 'Culture',
      tags: 'diaspora,homecoming,identity',
      accentColor: '#2D5F3F',
      publishedAt: '2020-01-01',
      isApproved: 1
    },
    {
      letterNumber: 4,
      authorName: 'An Economist with Anxiety',
      title: 'On the Cedi, the IMF, and the Arithmetic of Survival',
      preview: '"Osagyefo, the Cedi has weakened. We\'ve invited the IMF. They\'ve brought worksheets and disappointment..."',
      content: `Dear Osagyefo,

The Cedi has weakened. Against the dollar, the pound, even the East African shilling — it shrinks like a sweater in hot water.

We have invited the IMF back. They arrive with briefcases and recommendations, speaking in the language of structural adjustments and fiscal discipline.

This is the arithmetic of modern Africa: borrow to grow, cut to survive, privatize to stabilize. It's mathematics written in the language of distant creditors.

You fought for dignity. We're fighting for solvency. It's not the same war, Kwame.

Yet here's the thing: we keep going. The market women still sell, the hawkers still hawk, the traders adapt. We are not our currency.

From the marketplace of resilience,
An Economist with Anxiety`,
      category: 'Economy',
      tags: 'IMF,cedi,economy,austerity',
      accentColor: '#D43F3A',
      publishedAt: '2022-12-31',
      isApproved: 1
    },
    {
      letterNumber: 5,
      authorName: 'A Jaded Voter',
      title: 'On Elections: Democracy\'s Quarterly Fever',
      preview: '"Dear Kwame, we hold elections every four years like clockwork. Promises fly like confetti... and then?"',
      content: `Dear Osagyefo,

Every four years, we do this: we queue in the sun, we vote, we hope. Then promises dissolve like sugar in rain.

Politicians speak of growth and development. Of jobs that never arrive on schedule, of hospitals half-built, of roads that become rivers in season.

Yet we return. We queue again, four years later. Hope is a chronic disease here, and we never seem to find the cure.

You said democracy must come to Africa. She came. She wore a beautiful dress and made beautiful promises. We married her anyway, knowing she had a wandering eye.

Still, Kwame — she's ours. Imperfect, unreliable, occasionally bewildering. But ours.

From the poll lines,
A Jaded Voter`,
      category: 'Politics',
      tags: 'elections,democracy,governance',
      accentColor: '#E8B923',
      publishedAt: '2024-12-07',
      isApproved: 1
    },
    {
      letterNumber: 6,
      authorName: 'A Ghanaian Food Nationalist',
      title: 'On Jollof Rice: A Culinary Declaration of Independence',
      preview: '"You liberated a nation. We liberated jollof rice from mediocrity. One is celebrated annually. Guess which one?"',
      content: `Dear Osagyefo,

You liberated a nation. We liberated rice from mediocrity.

Jollof is our national dish — or rather, it's the dish we wage national wars over. We claim ownership like territorial champions. "Ghanaian jollof is the best." "No, Nigerian jollof..." And so it goes.

It's rice, tomato, pepper. Simple. Yet somehow it represents everything: pride, identity, the small victories we take for ourselves.

While you were changing the course of history, we perfected the art of the one-pot meal. Both are achievements, aren't they?

You gave us the nation. We gave it flavour.

From the kitchen, with love,
A Ghanaian Food Nationalist`,
      category: 'Culture',
      tags: 'food,jollof,culture,satire',
      accentColor: '#E8B923',
      publishedAt: '2025-02-14',
      isApproved: 1
    },
    {
      letterNumber: 7,
      authorName: 'A Political Observer',
      title: 'High Definition Hypocrisy',
      preview: '"We preach democracy while silencing dissent. We champion freedom while chaining ambition..."',
      content: `Dear Osagyefo,

We preach freedom while silencing voices. We champion transparency while drawing darkened curtains. We speak of unity while fracturing along the thinnest lines.

The hypocrisy isn't malicious — it's human. We want to be the nation you envisioned, but we're creatures of contradiction and compromise.

In HD clarity, our flaws are impossible to ignore. Yet we persist anyway, believing that the next generation might get it right.

In recognition,
A Political Observer`,
      category: 'Politics',
      tags: 'politics,hypocrisy,democracy',
      accentColor: '#D43F3A',
      publishedAt: '2026-03-10',
      isApproved: 1
    },
    {
      letterNumber: 8,
      authorName: 'A Frustrated Driver',
      title: 'DVLA World Tour',
      preview: '"The Driver and Vehicle Licensing Authority: where innovation goes to retire and bureaucracy goes to thrive..."',
      content: `Dear Osagyefo,

The Driver and Vehicle Licensing Authority is where innovation goes to retire and bureaucracy goes to thrive.

To renew a license takes an odyssey. Forms must be gathered. Offices must be visited. Officers must be appeased. It's an expedition, not a transaction.

Yet somehow, miraculously, people still drive. The system doesn't work, yet it persists. Rather like the nation itself.

From the DVLA queue,
A Frustrated Driver`,
      category: 'Governance',
      tags: 'bureaucracy,satire,DVLA',
      accentColor: '#E8B923',
      publishedAt: '2026-01-01',
      isApproved: 1
    },
    {
      letterNumber: 9,
      authorName: "A Villager's Diary",
      title: 'Obimanso, the Struggle is Real',
      preview: '"Obimanso: where the sun beats down with the fury of a scorned lover and progress goes to contemplate defeat..."',
      content: `Dear Osagyefo,

Obimanso: where the sun beats down with the fury of a scorned lover and progress seems a luxury imported from elsewhere.

The roads are rough. The water is scarce. The schools lack basic things and the clinics are pharmacies without the pharmacy.

Yet the people endure with a grace that borders on the miraculous. They plant. They build. They dream despite everything.

The struggle here isn't romantic, Kwame. It's daily. It's real.

From a village perspective,
A Villager's Diary`,
      category: 'Governance',
      tags: 'rural,development,struggle',
      accentColor: '#2D5F3F',
      publishedAt: '2026-01-01',
      isApproved: 1
    },
    {
      letterNumber: 10,
      authorName: 'An Environmental Witness',
      title: "The Lagoon's Revenge",
      preview: '"We built on faith and shortsighted ambition. The lagoon remembers, and it collects its debts..."',
      content: `Dear Osagyefo,

We built on faith and shortsighted ambition. We built where the lagoon had always been, as if water and gravity were merely suggestions.

The lagoon remembers. It collects its debts with the patience of geological time. When the rains come, when the tides rise, it reclaims.

We are learning, slowly, that the land has its own logic. We can't negotiate with geography.

From the waterfront, watching,
An Environmental Witness`,
      category: 'Environment',
      tags: 'environment,coastal,climate',
      accentColor: '#D43F3A',
      publishedAt: '2026-01-01',
      isApproved: 1
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO public_letters (letterNumber, authorName, title, preview, content, category, tags, accentColor, publishedAt, isApproved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  letters.forEach(l => {
    stmt.run(l.letterNumber, l.authorName, l.title, l.preview, l.content, l.category, l.tags, l.accentColor, l.publishedAt, l.isApproved);
  });

  stmt.finalize(() => {
    console.log('✓ Seeded 10 public letters into database');
  });
}

module.exports = db;
