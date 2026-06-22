/**
 * seed_doctors.js — Reads doctors.json and inserts into PostgreSQL.
 * Runs inside the Docker container on first boot.
 * Also auto-generates a text bio from existing fields for RAG context.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
  const client = new Client({
    host: '/var/run/postgresql',
    port: 5432,
    user: 'vitacard',
    database: 'vitacard_db',
  });

  await client.connect();
  console.log('Connected to PostgreSQL for seeding...');

  // Check if already seeded
  const countRes = await client.query('SELECT COUNT(*) FROM doctors');
  if (parseInt(countRes.rows[0].count) > 0) {
    console.log(`Database already seeded with ${countRes.rows[0].count} doctors. Skipping.`);
    await client.end();
    return;
  }

  // Load doctors.json
  const jsonPath = path.join(__dirname, 'doctors.json');
  const doctors = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Seeding ${doctors.length} doctors...`);

  // Insert into DB
  for (const doc of doctors) {
    // We already enriched doctors_with_embeddings.json with expYears, rating, etc.
    const expYears = doc.expYears !== undefined ? doc.expYears : 3 + (doc.s_no % 20);
    const rating = doc.rating !== undefined ? doc.rating : parseFloat((3.5 + (doc.s_no % 15) * 0.1).toFixed(1));
    const fees = ['₹200-₹500', '₹300-₹800', '₹500-₹1200', '₹800-₹1500'];
    const feeRange = doc.feeRange || fees[doc.s_no % fees.length];
    const bio = doc.bio || `${doc.name} is a ${doc.specialization} practicing at ${doc.clinic}, located in ${doc.address}, ${doc.city}. Contact: ${doc.phone}. Listed on ${doc.source}.`;
    
    // Use pre-computed embedding if available, else NULL
    const embedding = doc.embedding || null;

    await client.query(
      `INSERT INTO doctors (s_no, name, specialization, clinic, address, city, phone, source,
                            experience_years, rating, fee_range, bio, hospital_name, location, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (s_no) DO NOTHING`,
      [
        doc.s_no, doc.name, doc.specialization, doc.clinic, doc.address, doc.city, doc.phone, doc.source,
        expYears, rating, feeRange, bio,
        doc.clinic, `${doc.address}, ${doc.city}`,
        embedding
      ]
    );
  }

  const finalCount = await client.query('SELECT COUNT(*) FROM doctors');
  console.log(`✓ Seeded ${finalCount.rows[0].count} doctors successfully.`);
  await client.end();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
